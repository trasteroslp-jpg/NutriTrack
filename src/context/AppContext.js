import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    updateDoc,
    deleteDoc,
    serverTimestamp,
    increment,
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { foodCatalogue } from '../data/mockData';
import { HealthService } from '../services/healthService';
import { XP_ACTIONS, getLevelInfo } from '../utils/gamificationLogic';
import { orderBy, limit } from 'firebase/firestore';

const AppContext = createContext();

const DEFAULT_USER_PROFILE = {
    name: '',
    email: '',
    isPro: false,
    gender: 'male',
    activityLevel: 1.2,
    age: 25,
    weight: 70,
    height: 170,
    goal: 'maintain',
    goalCalories: 2040, // Calculado para 25 años, 70kg, 170cm, male, sedentary
    macros: { protein: 25, carbs: 45, fat: 30 }, // Coincide con el objetivo 'maintain' de ProfileScreen
    dislikedFoods: [],
    dietType: 'omnivore', // omnivore, vegetarian, vegan, keto, paleo
    restrictions: [], // celiac, lactose, nuts, etc.
    waterGoal: 2000,
    xp: 0,
    weightHistory: [],
    favorites: [],
    customRecipes: [],
    showRecentSuggestions: true,
    hiddenRecentFoodIds: [],
};

const getDateString = (date = new Date()) => date.toISOString().split('T')[0];

const getMealTypeByHour = (hour) => {
    if (hour >= 6 && hour < 12) return 'Desayuno';
    if (hour >= 12 && hour < 17) return 'Almuerzo';
    if (hour >= 17 && hour < 20) return 'Merienda';
    if (hour >= 20 || hour < 6) return 'Cena';
    return 'Snack';
};

export const AppProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [user, setUser] = useState(DEFAULT_USER_PROFILE);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [meals, setMeals] = useState([]);
    const [completedWorkouts, setCompletedWorkouts] = useState({});
    const [streak, setStreak] = useState(0);
    const [authError, setAuthError] = useState(null);
    const [weeklyDiet, setWeeklyDiet] = useState(null);
    const [waterIntake, setWaterIntake] = useState(0);
    const [weightHistory, setWeightHistory] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [customRecipes, setCustomRecipes] = useState([]);
    const [globalFoodCatalogue, setGlobalFoodCatalogue] = useState(foodCatalogue);
    const [isNewUser, setIsNewUser] = useState(false);
    const [recentFoods, setRecentFoods] = useState([]);
    const [levelUpData, setLevelUpData] = useState(null);

    // ── Escuchar cambios de sesión ──
    useEffect(() => {
        const startupTimeout = setTimeout(() => {
            if (isLoading) setIsLoading(false);
        }, 6000);

        const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
            if (fbUser) {
                setFirebaseUser(fbUser);
                setIsLoggedIn(true);
                try {
                    await loadUserData(fbUser.uid);
                } catch (err) {
                    console.error("LOAD_DATA_ERROR:", err);
                }
            } else {
                setFirebaseUser(null);
                setIsLoggedIn(false);
                setUser(DEFAULT_USER_PROFILE);
                setMeals([]);
                setCompletedWorkouts({});
            }
            setIsLoading(false);
            clearTimeout(startupTimeout);
        });
        return () => {
            unsubscribe();
            clearTimeout(startupTimeout);
        };
    }, []);

    // ── Cargar perfil y datos ──
    const loadUserData = async (uid) => {
        try {
            const profileRef = doc(db, 'users', uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                const data = profileSnap.data();
                // Migration
                if (data.totalXP !== undefined && data.xp === undefined) {
                    data.xp = data.totalXP;
                    await updateDoc(profileRef, { xp: data.totalXP });
                }

                // Repair
                const authUser = auth.currentUser;
                if (authUser) {
                    if (!data.email && authUser.email) data.email = authUser.email;
                    if (!data.name && authUser.displayName) data.name = authUser.displayName;
                }

                const repairedProfile = { ...DEFAULT_USER_PROFILE, ...data };
                setUser(repairedProfile);

                if ((!profileSnap.data().email && data.email) || (!profileSnap.data().name && data.name)) {
                    await setDoc(profileRef, { email: data.email, name: data.name }, { merge: true });
                }

                // Sync public profile for leaderboard
                await setDoc(doc(db, 'leaderboard_profiles', uid), {
                    name: data.name || 'Héroe NutriTrack',
                    xp: data.xp || 0,
                    profileImage: data.profileImage || null,
                }, { merge: true }).catch(e => console.warn('Public sync:', e.message));

            } else {
                const authUser = auth.currentUser;
                const newProfile = {
                    ...DEFAULT_USER_PROFILE,
                    email: authUser?.email || '',
                    name: authUser?.displayName || 'Usuario',
                };
                setUser(newProfile);
                await setDoc(profileRef, newProfile, { merge: true });

                // Sync new user public profile
                await setDoc(doc(db, 'leaderboard_profiles', uid), {
                    name: newProfile.name,
                    xp: 0,
                    profileImage: null,
                }, { merge: true }).catch(e => console.warn('Public sync new:', e.message));
            }

            // One-time admin migration: populate leaderboard_profiles for ALL users
            const currentEmail = auth.currentUser?.email;
            if (currentEmail === 'daforg@hotmail.com') {
                try {
                    const migrated = await AsyncStorage.getItem('leaderboard_migrated');
                    if (!migrated) {
                        console.log('🔄 Admin migration: populating leaderboard_profiles...');
                        const allUsersSnap = await getDocs(collection(db, 'users'));
                        for (const userDoc of allUsersSnap.docs) {
                            const ud = userDoc.data();
                            await setDoc(doc(db, 'leaderboard_profiles', userDoc.id), {
                                name: ud.name || 'Héroe NutriTrack',
                                xp: ud.xp || 0,
                                profileImage: ud.profileImage || null,
                            }, { merge: true });
                        }
                        await AsyncStorage.setItem('leaderboard_migrated', 'true');
                        console.log(`✅ Migrated ${allUsersSnap.docs.length} users to leaderboard_profiles`);
                    }
                } catch (migErr) {
                    console.warn('Migration warning:', migErr.message);
                }
            }

            // Carga secundaria
            const loadSecondaryData = async () => {
                try {
                    const mealsRef = collection(db, 'users', uid, 'meals');
                    const mealsSnap = await getDocs(mealsRef);
                    const loadedMeals = mealsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                    loadedMeals.sort((a, b) => (b.date > a.date ? 1 : -1));
                    setMeals(loadedMeals);

                    const storedTraining = await AsyncStorage.getItem(`@training_${uid}`);
                    if (storedTraining) setCompletedWorkouts(JSON.parse(storedTraining));

                    const extraDataRef = doc(db, 'users', uid, 'extra', 'health');
                    const extraSnap = await getDoc(extraDataRef);
                    if (extraSnap.exists()) {
                        const data = extraSnap.data();
                        setWeightHistory(data.weightHistory || []);
                        setFavorites(data.favorites || []);
                        setCustomRecipes(data.customRecipes || []);
                        setRecentFoods(data.recentFoods || []);

                        const today = getDateString();
                        if (data.lastWaterUpdate === today) setWaterIntake(data.waterIntake || 0);
                    }

                    const globalRef = collection(db, 'global_foods');
                    const globalSnap = await getDocs(globalRef);
                    if (!globalSnap.empty) {
                        const cloudFoods = globalSnap.docs.map(d => ({ ...d.data(), id: d.id }));
                        setGlobalFoodCatalogue([...foodCatalogue, ...cloudFoods]);
                    }

                    // Check Daily Login XP
                    const today = getDateString();
                    if (profileSnap.data()?.lastLoginDate !== today) {
                        await addXP(XP_ACTIONS.DAILY_LOGIN);
                        await updateUser({ lastLoginDate: today });
                    }
                } catch (e) {
                    console.warn('Secondary data load warning:', e.message);
                }
            };
            loadSecondaryData();
        } catch (e) {
            console.error('CRITICAL_LOAD_ERROR:', e);
        }
    };

    // ── Gamification ──
    const addXP = async (points) => {
        setUser(prev => {
            const currentXP = prev.xp || 0;
            const newXP = currentXP + points;
            const oldInfo = getLevelInfo(currentXP);
            const newInfo = getLevelInfo(newXP);

            if (newInfo.level > oldInfo.level) setLevelUpData(newInfo);

            if (firebaseUser) {
                setDoc(doc(db, 'users', firebaseUser.uid), { xp: newXP }, { merge: true })
                    .catch(e => console.error('Error saving XP:', e));
                // Sync XP to public leaderboard
                setDoc(doc(db, 'leaderboard_profiles', firebaseUser.uid), { xp: newXP }, { merge: true })
                    .catch(e => console.warn('Leaderboard XP sync:', e.message));
            }
            return { ...prev, xp: newXP };
        });
    };

    // ── Calcular racha ──
    const calculateStreak = () => {
        const mealsByDate = {};
        meals.forEach(m => { mealsByDate[m.date] = (mealsByDate[m.date] || 0) + m.calories; });
        const today = getDateString();
        const yesterday = getDateString(new Date(Date.now() - 86400000));
        let currentStreak = 0;
        let checkDate = new Date();

        const isGoalMet = (cals) => cals > 0 && Math.abs(cals - user.goalCalories) <= (user.goalCalories * 0.1);

        const todayCals = mealsByDate[today] || 0;
        if (!isGoalMet(todayCals)) {
            const yesterdayCals = mealsByDate[yesterday] || 0;
            if (yesterdayCals === 0 || !isGoalMet(yesterdayCals)) return setStreak(0);
            checkDate.setDate(checkDate.getDate() - 1);
        }

        let safety = 0;
        while (safety < 3000) {
            safety++;
            const dStr = getDateString(checkDate);
            const dailyCals = mealsByDate[dStr] || 0;
            if (isGoalMet(dailyCals)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else break;
        }
        setStreak(currentStreak);

        if (isGoalMet(todayCals) && user.lastGoalXpDate !== today) {
            addXP(XP_ACTIONS.COMPLETE_DAILY_GOAL);
            updateUser({ lastGoalXpDate: today });
        }

        if (currentStreak === 7 && user.lastStreakXP !== 7) {
            addXP(XP_ACTIONS.STREAK_7_DAYS);
            updateUser({ lastStreakXP: 7 });
        } else if (currentStreak === 30 && user.lastStreakXP !== 30) {
            addXP(XP_ACTIONS.STREAK_30_DAYS);
            updateUser({ lastStreakXP: 30 });
        }
    };

    useEffect(() => {
        if (meals.length > 0) calculateStreak();
    }, [meals]);

    // ── AUTH ──
    const registerWithEmail = async (email, password, name) => {
        setAuthError(null);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(cred.user, { displayName: name });
            const newProfile = { ...DEFAULT_USER_PROFILE, name, email, isPro: false, createdAt: serverTimestamp() };
            await setDoc(doc(db, 'users', cred.user.uid), newProfile);
            setUser(newProfile);
            setIsNewUser(true);
            return { success: true };
        } catch (e) {
            const msg = getAuthErrorMessage(e.code);
            setAuthError(msg);
            return { success: false, error: msg };
        }
    };

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

    const resetPassword = async (email) => {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (e) {
            return { success: false, error: getAuthErrorMessage(e.code) };
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setWeightHistory([]);
            setFavorites([]);
            setCustomRecipes([]);
            setWaterIntake(0);
            setStreak(0);
            setIsNewUser(false);
        } catch (e) { console.error('Logout error:', e); }
    };

    // ── MEALS ──
    const addMeal = async (newMeal) => {
        if (!firebaseUser) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const mealData = {
            ...newMeal,
            date: getDateString(now),
            time: timeStr,
            type: newMeal.type || getMealTypeByHour(now.getHours()),
            createdAt: serverTimestamp(),
        };
        try {
            const docRef = await addDoc(collection(db, 'users', firebaseUser.uid, 'meals'), mealData);
            setMeals(prev => [{ id: docRef.id, ...mealData }, ...prev]);

            const today = getDateString();
            const todayMeals = meals.filter(m => m.date === today);
            if (todayMeals.length < 15) addXP(XP_ACTIONS.LOG_MEAL);

            addRecentFood({
                title: newMeal.title,
                calories: newMeal.calories,
                protein: newMeal.protein || 0,
                carbs: newMeal.carbs || 0,
                fat: newMeal.fat || 0,
                grams: newMeal.grams || 100,
                mealType: mealData.type,
                lastUsed: new Date().toISOString(),
                useCount: 1,
            });
        } catch (e) { console.error('Add meal error:', e); }
    };

    const addRecentFood = async (foodEntry) => {
        setRecentFoods(prev => {
            const existing = prev.findIndex(f => f.title?.toLowerCase() === foodEntry.title?.toLowerCase());
            let updated;
            if (existing >= 0) {
                const item = { ...prev[existing], lastUsed: new Date().toISOString(), useCount: (prev[existing].useCount || 1) + 1 };
                updated = [item, ...prev.filter((_, i) => i !== existing)];
            } else {
                updated = [foodEntry, ...prev];
            }
            return updated.slice(0, 25);
        });
        if (firebaseUser) {
            try {
                const updatedRecents = [foodEntry, ...recentFoods.filter(f => f.title?.toLowerCase() !== foodEntry.title?.toLowerCase())].slice(0, 25);
                await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), { recentFoods: updatedRecents }, { merge: true });
            } catch (e) { console.warn('Save recents error:', e); }
        }
    };

    const dismissRecentFood = async (foodTitle) => {
        const currentHidden = user.hiddenRecentFoodIds || [];
        if (!currentHidden.includes(foodTitle)) {
            await updateUser({ hiddenRecentFoodIds: [...currentHidden, foodTitle] });
        }
    };

    const deleteMeal = async (mealId) => {
        if (!firebaseUser) return;
        try {
            const mealToDelete = meals.find(m => m.id === mealId);
            await deleteDoc(doc(db, 'users', firebaseUser.uid, 'meals', mealId));
            setMeals(prev => prev.filter(m => m.id !== mealId));
            if (mealToDelete) {
                const createdTime = mealToDelete.createdAt?.toDate ? mealToDelete.createdAt.toDate() : new Date();
                if (new Date() - createdTime < 3600000) addXP(-XP_ACTIONS.LOG_MEAL);
            }
        } catch (e) { console.error('Delete meal error:', e); }
    };

    const updateMeal = async (mealId, updates) => {
        if (!firebaseUser) return;
        try {
            await setDoc(doc(db, 'users', firebaseUser.uid, 'meals', mealId), updates, { merge: true });
            setMeals(prev => prev.map(m => m.id === mealId ? { ...m, ...updates } : m));
        } catch (e) { console.error('Update meal error:', e); }
    };

    // ── PERFIL ──
    const updateUser = async (updates) => {
        setUser(prev => ({ ...prev, ...updates }));
        if (firebaseUser) {
            try {
                await setDoc(doc(db, 'users', firebaseUser.uid), updates, { merge: true });
                // Mirror public fields to leaderboard
                const publicFields = {};
                if (updates.name !== undefined) publicFields.name = updates.name;
                if (updates.xp !== undefined) publicFields.xp = updates.xp;
                if (updates.profileImage !== undefined) publicFields.profileImage = updates.profileImage;
                if (Object.keys(publicFields).length > 0) {
                    await setDoc(doc(db, 'leaderboard_profiles', firebaseUser.uid), publicFields, { merge: true });
                }
            } catch (e) { console.error('Update user error:', e); }
        }
    };

    // ── IA TRACKING ──
    const trackAIUsage = async (featureName, baseTokens, generatedTokens = 0) => {
        if (!firebaseUser) return;
        try {
            const totalTokens = baseTokens + generatedTokens;
            await setDoc(doc(db, 'users', firebaseUser.uid), {
                aiTokensUsed: increment(totalTokens),
                aiRequestsCount: increment(1)
            }, { merge: true });
            await addDoc(collection(db, 'users', firebaseUser.uid, 'ai_logs'), {
                feature: featureName,
                tokens: totalTokens,
                timestamp: serverTimestamp()
            });
        } catch (e) { console.error("Track AI usage error:", e); }
    };

    // ── HEALTH & EXTRA ──
    const logWeight = async (weight) => {
        const newEntry = { date: getDateString(), weight: parseFloat(weight) };
        const updatedHistory = [...weightHistory, newEntry].sort((a, b) => b.date > a.date ? 1 : -1);
        setWeightHistory(updatedHistory);
        await updateUser({ weight: parseFloat(weight) });
        if (firebaseUser) {
            await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), { weightHistory: updatedHistory }, { merge: true });
        }
    };

    const addWater = async (amount) => {
        const newTotal = Math.max(0, waterIntake + amount);
        setWaterIntake(newTotal);
        if (firebaseUser) {
            await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), {
                waterIntake: newTotal,
                lastWaterUpdate: getDateString()
            }, { merge: true });
        }
    };

    const toggleFavorite = async (food) => {
        let updated;
        const isFav = favorites.find(f => f.id === food.id);
        if (isFav) updated = favorites.filter(f => f.id !== food.id);
        else updated = [...favorites, food];
        setFavorites(updated);
        if (firebaseUser) {
            await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), { favorites: updated }, { merge: true });
        }
    };

    // ── RECIPES ──
    const addCustomRecipe = async (recipe) => {
        const updated = [...customRecipes, { ...recipe, id: Date.now().toString() }];
        setCustomRecipes(updated);
        if (firebaseUser) {
            await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), { customRecipes: updated }, { merge: true });
        }
    };

    const deleteCustomRecipe = async (recipeId) => {
        const updated = customRecipes.filter(r => r.id !== recipeId);
        setCustomRecipes(updated);
        if (firebaseUser) {
            await setDoc(doc(db, 'users', firebaseUser.uid, 'extra', 'health'), { customRecipes: updated }, { merge: true });
        }
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
            firebaseUser, user, isLoading, isLoggedIn, authError, setAuthError,
            loginWithEmail, registerWithEmail, resetPassword, logout,
            meals, addMeal, deleteMeal, updateMeal, getStatsForRange,
            streak, waterIntake, addWater, weightHistory, logWeight,
            favorites, toggleFavorite,
            recentFoods, dismissRecentFood,
            customRecipes, addCustomRecipe, deleteCustomRecipe,
            levelUpData, setLevelUpData, addXP,
            trackAIUsage,
            updateUser,
            globalFoodCatalogue,
            addToGlobalCatalogue: async (food) => {
                if (globalFoodCatalogue.find(f => (f.name.toLowerCase() === food.name.toLowerCase()) || (food.barcode && f.barcode === food.barcode))) return;
                const newFood = { ...food, id: food.barcode ? `bar_${food.barcode}` : `gen_${Date.now()}`, isGenerated: true, contributedBy: firebaseUser?.uid || 'anonymous' };
                setGlobalFoodCatalogue(prev => [...prev, newFood]);
                try { await addDoc(collection(db, 'global_foods'), { ...newFood, createdAt: serverTimestamp() }); } catch (e) { console.error("Global catalogue error:", e); }
            },
            syncWeightFromHealth: async () => {
                const isAvailable = await HealthService.checkAvailability();
                if (!isAvailable) return { success: false, error: 'Health Connect no disponible' };
                const hasPermissions = await HealthService.requestWeightPermissions();
                if (!hasPermissions) return { success: false, error: 'Permisos denegados' };
                const weightData = await HealthService.getLatestWeight();
                if (weightData) {
                    await logWeight(weightData.weight);
                    return { success: true, weight: weightData.weight };
                }
                return { success: false, error: 'No se encontraron datos de peso recientes' };
            }
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
