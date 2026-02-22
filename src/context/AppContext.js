import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupDefaultReminders } from '../utils/notifications';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    GoogleAuthProvider,
    signInWithCredential,
    sendPasswordResetEmail,
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    getDocs,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const AppContext = createContext();

const DEFAULT_USER_PROFILE = {
    name: '',
    email: '',
    isPro: false, // Nueva bandera para funcionalidades Premium
    age: 25,
    weight: 70,
    height: 170,
    goal: 'maintain',
    goalCalories: 2000,
    macros: { protein: 30, carbs: 40, fat: 30 },
    dislikedFoods: [],
    waterGoal: 2000, // ml
    weightHistory: [], // { date, weight }
    favorites: [], // array de objetos de comida
    customRecipes: [],
};

const getDateString = (date = new Date()) => date.toISOString().split('T')[0];

const getMealTypeByHour = (hour) => {
    if (hour >= 6 && hour < 12) return 'Desayuno';
    if (hour >= 12 && hour < 17) return 'Almuerzo';
    if (hour >= 17 && hour < 21) return 'Merienda';
    if (hour >= 21 || hour < 6) return 'Cena';
    return 'Snack';
};

export const AppProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null); // usuario de Firebase Auth
    const [user, setUser] = useState(DEFAULT_USER_PROFILE);  // perfil extendido (Firestore)
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [meals, setMeals] = useState([]);
    const [completedWorkouts, setCompletedWorkouts] = useState({});
    const [streak, setStreak] = useState(0);
    const [authError, setAuthError] = useState(null);
    const [weeklyDiet, setWeeklyDiet] = useState(null);
    const [waterIntake, setWaterIntake] = useState(0); //ml de hoy
    const [weightHistory, setWeightHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [customRecipes, setCustomRecipes] = useState([]);

    // ── Escuchar cambios de sesión de Firebase ──
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                setFirebaseUser(fbUser);
                setIsLoggedIn(true);
                await loadUserData(fbUser.uid);
                // setupDefaultReminders(); // Desactivado en v1.1
            } else {
                setFirebaseUser(null);
                setIsLoggedIn(false);
                setUser(DEFAULT_USER_PROFILE);
                setMeals([]);
                setCompletedWorkouts({});
            }
            setIsLoading(false);
        });
        return unsubscribe;
    }, []);

    // ── Cargar perfil y datos del usuario desde Firestore ──
    const loadUserData = async (uid) => {
        try {
            // Perfil
            const profileRef = doc(db, 'users', uid);
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
                setUser({ ...DEFAULT_USER_PROFILE, ...profileSnap.data() });
            }

            // Comidas
            const mealsRef = collection(db, 'users', uid, 'meals');
            const mealsSnap = await getDocs(mealsRef);
            const loadedMeals = mealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            loadedMeals.sort((a, b) => (b.date > a.date ? 1 : -1));
            setMeals(loadedMeals);

            // Entrenamientos completados (guardados localmente por uid)
            const storedTraining = await AsyncStorage.getItem(`@training_${uid}`);
            if (storedTraining) setCompletedWorkouts(JSON.parse(storedTraining));

            // Cargar Agua, Peso, Favoritos y Recetas (Firebase o local como fallback)
            const extraDataRef = doc(db, 'users', uid, 'extra', 'health');
            const extraSnap = await getDoc(extraDataRef);
            if (extraSnap.exists()) {
                const data = extraSnap.data();
                setWeightHistory(data.weightHistory || []);
                setFavorites(data.favorites || []);
                setCustomRecipes(data.customRecipes || []);

                // Agua es diaria
                const today = getDateString();
                if (data.lastWaterUpdate === today) {
                    setWaterIntake(data.waterIntake || 0);
                } else {
                    setWaterIntake(0);
                }
            }

        } catch (e) {
            console.error('Error loading user data:', e);
        }
    };

    // ── Calcular racha ──
    useEffect(() => {
        if (meals.length > 0) calculateStreak();
    }, [meals]);

    const calculateStreak = () => {
        const mealsByDate = {};
        meals.forEach(m => { mealsByDate[m.date] = (mealsByDate[m.date] || 0) + m.calories; });
        const today = getDateString();
        const yesterday = getDateString(new Date(Date.now() - 86400000));
        let currentStreak = 0;
        let checkDate = new Date();
        const todayCals = mealsByDate[today] || 0;
        if (!(todayCals > 0 && todayCals <= user.goalCalories)) {
            const yesterdayCals = mealsByDate[yesterday] || 0;
            if (yesterdayCals === 0 || yesterdayCals > user.goalCalories) return setStreak(0);
            checkDate.setDate(checkDate.getDate() - 1);
        }
        while (true) {
            const dStr = getDateString(checkDate);
            const dailyCals = mealsByDate[dStr] || 0;
            if (dailyCals > 0 && dailyCals <= user.goalCalories) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else break;
        }
        setStreak(currentStreak);
    };

    // ── AUTH: Registro con email/contraseña ──
    const registerWithEmail = async (email, password, name) => {
        setAuthError(null);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: name });

            // Crear perfil en Firestore
            const newProfile = {
                ...DEFAULT_USER_PROFILE,
                name,
                email,
                isPro: false,
                createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', cred.user.uid), newProfile);
            setUser(newProfile);
            return { success: true };
        } catch (e) {
            const msg = getAuthErrorMessage(e.code);
            setAuthError(msg);
            return { success: false, error: msg };
        }
    };

    // ── AUTH: Login con email/contraseña ──
    const loginWithEmail = async (email, password) => {
        setAuthError(null);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return { success: true };
        } catch (e) {
            const msg = getAuthErrorMessage(e.code);
            setAuthError(msg);
            return { success: false, error: msg };
        }
    };

    // ── AUTH: Recuperar contraseña ──
    const resetPassword = async (email) => {
        console.log(`DEBUG: Intentando resetear contraseña para: ${email}`);
        try {
            await sendPasswordResetEmail(auth, email);
            console.log("DEBUG: Firebase dice que el correo fue enviado con éxito");
            return { success: true };
        } catch (e) {
            console.error("DEBUG: Error de Firebase al enviar correo:", e.code, e.message);
            const msg = getAuthErrorMessage(e.code);
            return { success: false, error: msg };
        }
    };


    // ── AUTH: Logout ──
    const logout = async () => {
        try {
            await signOut(auth);
        } catch (e) {
            console.error('Error logging out:', e);
        }
    };

    // ── MEALS: Añadir comida ──
    const addMeal = async (newMeal) => {
        if (!firebaseUser) return;

        const now = new Date();
        const hour = now.getHours();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const mealData = {
            ...newMeal,
            date: getDateString(now),
            time: timeStr,
            type: newMeal.type || getMealTypeByHour(hour),
            createdAt: serverTimestamp(),
        };
        try {
            const docRef = await addDoc(
                collection(db, 'users', firebaseUser.uid, 'meals'),
                mealData
            );
            setMeals(prev => [{ id: docRef.id, ...mealData }, ...prev]);
        } catch (e) {
            console.error('Error adding meal:', e);
        }
    };

    // ── MEALS: Eliminar comida ──
    const deleteMeal = async (mealId) => {
        if (!firebaseUser) return;
        try {
            await deleteDoc(doc(db, 'users', firebaseUser.uid, 'meals', mealId));
            setMeals(prev => prev.filter(m => m.id !== mealId));
        } catch (e) {
            console.error('Error deleting meal:', e);
        }
    };

    // ── MEALS: Actualizar comida ──
    const updateMeal = async (mealId, updates) => {
        if (!firebaseUser) return;
        try {
            await setDoc(doc(db, 'users', firebaseUser.uid, 'meals', mealId), updates, { merge: true });
            setMeals(prev => prev.map(m => m.id === mealId ? { ...m, ...updates } : m));
        } catch (e) {
            console.error('Error updating meal:', e);
        }
    };

    // ── PERFIL: Actualizar datos del usuario ──
    const updateUser = async (updates) => {
        const updated = { ...user, ...updates };
        setUser(updated);
        if (firebaseUser) {
            try {
                await setDoc(doc(db, 'users', firebaseUser.uid), updated, { merge: true });
            } catch (e) {
                console.error('Error updating user:', e);
            }
        }
    };

    // ── ENTRENAMIENTOS ──
    const toggleWorkoutCompletion = async (workoutId) => {
        if (!firebaseUser) return;
        const today = getDateString();
        const dayWorkouts = completedWorkouts[today] || [];
        const newDayWorkouts = dayWorkouts.includes(workoutId)
            ? dayWorkouts.filter(id => id !== workoutId)
            : [...dayWorkouts, workoutId];
        const updated = { ...completedWorkouts, [today]: newDayWorkouts };
        setCompletedWorkouts(updated);
        await AsyncStorage.setItem(`@training_${firebaseUser.uid}`, JSON.stringify(updated));
    };

    // ── STATS ──
    const getStatsForRange = (startDate, endDate) => {
        const dailyData = {};
        let current = new Date(startDate);
        const end = new Date(endDate);
        while (current <= end) {
            dailyData[getDateString(current)] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
            current.setDate(current.getDate() + 1);
        }
        meals.forEach(meal => {
            if (dailyData[meal.date] !== undefined) {
                dailyData[meal.date].calories += meal.calories || 0;
                dailyData[meal.date].protein += meal.protein || 0;
                dailyData[meal.date].carbs += meal.carbs || 0;
                dailyData[meal.date].fat += meal.fat || 0;
            }
        });
        return Object.keys(dailyData).sort().map(date => ({
            date,
            day: new Date(date).toLocaleDateString('es-ES', { weekday: 'short' }),
            ...dailyData[date]
        }));
    };

    // ── Mensajes de error en español ──
    const getAuthErrorMessage = (code) => {
        const errors = {
            'auth/email-already-in-use': 'Este correo ya está registrado.',
            'auth/invalid-email': 'El correo no es válido.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
            'auth/user-not-found': 'No existe una cuenta con este correo.',
            'auth/wrong-password': 'Contraseña incorrecta.',
            'auth/invalid-credential': 'Correo o contraseña incorrectos.',
            'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
            'auth/network-request-failed': 'Error de conexión. Comprueba tu internet.',
        };
        return errors[code] || 'Ha ocurrido un error. Inténtalo de nuevo.';
    };

    return (
        <AppContext.Provider value={{
            // Auth
            firebaseUser,
            isLoggedIn,
            isLoading,
            authError,
            setAuthError,
            loginWithEmail,
            registerWithEmail,
            resetPassword,
            logout,
            // User
            user,
            updateUser,
            // Meals
            meals,
            addMeal,
            deleteMeal,
            updateMeal,
            // Stats
            getStatsForRange,
            streak,
            // Training
            completedWorkouts,
            toggleWorkoutCompletion,
            // Diets
            weeklyDiet,
            setWeeklyDiet,
            toggleDislikedFood: async (foodName) => {
                const currentDisliked = user.dislikedFoods || [];
                const updated = currentDisliked.includes(foodName)
                    ? currentDisliked.filter(f => f !== foodName)
                    : [...currentDisliked, foodName];
                await updateUser({ dislikedFoods: updated });
            },
            // Health & Extra
            waterIntake,
            addWater: async (amount) => {
                const newTotal = Math.max(0, waterIntake + amount);
                setWaterIntake(newTotal);
                if (firebaseUser) {
                    await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), {
                        waterIntake: newTotal,
                        lastWaterUpdate: getDateString()
                    }, { merge: true });
                }
            },
            weightHistory,
            logWeight: async (weight) => {
                const newEntry = { date: getDateString(), weight: parseFloat(weight) };
                const updatedHistory = [...weightHistory, newEntry].sort((a, b) => b.date > a.date ? 1 : -1);
                setWeightHistory(updatedHistory);
                await updateUser({ weight: parseFloat(weight) }); // Actualizamos peso actual en perfil
                if (firebaseUser) {
                    await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), {
                        weightHistory: updatedHistory
                    }, { merge: true });
                }
            },
            favorites,
            toggleFavorite: async (food) => {
                let updated;
                const isFav = favorites.find(f => f.id === food.id);
                if (isFav) {
                    updated = favorites.filter(f => f.id !== food.id);
                } else {
                    updated = [...favorites, food];
                }
                setFavorites(updated);
                if (firebaseUser) {
                    await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), {
                        favorites: updated
                    }, { merge: true });
                }
            },
            customRecipes,
            addCustomRecipe: async (recipe) => {
                const updated = [...customRecipes, { ...recipe, id: Date.now().toString() }];
                setCustomRecipes(updated);
                if (firebaseUser) {
                    await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), {
                        customRecipes: updated
                    }, { merge: true });
                }
            },
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
