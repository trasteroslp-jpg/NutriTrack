import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Alert, useWindowDimensions, Dimensions, Switch, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Modal, ActivityIndicator } from 'react-native';
import { collection, query, orderBy, limit, getDocs, setDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getLevelInfo } from '../utils/gamificationLogic';
import * as ImagePicker from 'expo-image-picker';
import { User, Camera, Settings, ChevronRight, LogOut, Trophy, Target, Zap, Flame, CheckCircle2, Crown, Sparkles, Activity, RefreshCw, Award, Leaf, Wheat, Milk, Plus, TrendingUp, X, Trash2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import PremiumModal from '../components/PremiumModal';
import { PieChart } from 'react-native-chart-kit';
import { sanitizeName, sanitizeNumber } from '../utils/sanitize';
import * as WebBrowser from 'expo-web-browser';

import appConfig from '../../app.json';

const ProfileScreen = () => {
    const { user, updateUser, meals, streak, logout, deleteAccount, weightHistory, logWeight, loginWithEmail, syncWeightFromHealth, isNewUser, setIsNewUser } = useApp();
    const navigation = useNavigation();
    const appVersion = appConfig.expo.version;
    const { width } = useWindowDimensions();
    const [name, setName] = useState(user.name);
    const [showPremium, setShowPremium] = useState(false);
    const [age, setAge] = useState(String(user.age));
    const [weight, setWeight] = useState(String(user.weight));
    const [height, setHeight] = useState(String(user.height));
    const [gender, setGender] = useState(user.gender || 'male');
    const [isSyncing, setIsSyncing] = useState(false);
    const [activityLevel, setActivityLevel] = useState(user.activityLevel || 1.2);
    const [goal, setGoal] = useState(user.goal || 'maintain');
    const [dietType, setDietType] = useState(user.dietType || 'omnivore');
    const [restrictions, setRestrictions] = useState(user.restrictions || []);

    // States for Leaderboard
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [isFetchingLeaderboard, setIsFetchingLeaderboard] = useState(false);

    const fetchLeaderboard = async () => {
        setIsFetchingLeaderboard(true);
        try {
            const uid = user?.uid;
            if (uid) {
                await setDoc(doc(db, 'leaderboard_profiles', uid), {
                    name: user.name || 'Héroe NutriTrack',
                    xp: user.xp || 0,
                    profileImage: user.profileImage || null,
                }, { merge: true }).catch(err => console.warn("Failed to force sync:", err));
            }

            const q = query(collection(db, 'leaderboard_profiles'), orderBy('xp', 'desc'), limit(15));
            const querySnapshot = await getDocs(q);
            const usersList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                usersList.push({
                    id: doc.id,
                    name: data.name || 'Héroe NutriTrack',
                    xp: data.xp || 0,
                    photoURL: data.photoURL || data.profileImage || null,
                });
            });
            setLeaderboardData(usersList);
        } catch (error) {
            console.error("Error fetching leaderboard: ", error);
            Alert.alert("Error", "No se pudo cargar el ranking global.");
        } finally {
            setIsFetchingLeaderboard(false);
        }
    };

    // Sincronizar peso del perfil cuando cambia desde Stats (logWeight)
    React.useEffect(() => {
        if (user.weight && String(user.weight) !== weight) {
            setWeight(String(user.weight));
        }
    }, [user.weight]);

    // Calculate today's stats for badges
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(m => m.date === today);
    const todayCals = todayMeals.reduce((sum, m) => sum + m.calories, 0);
    const todayFat = todayMeals.reduce((sum, m) => sum + (m.fat || 0), 0);
    const progress = Math.min(todayCals / user.goalCalories, 1);

    // Auto-save logic
    React.useEffect(() => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const a = parseInt(age);

        if (!name.trim() || isNaN(w) || isNaN(h) || isNaN(a)) return;

        const nutrients = calculateNutrients();
        updateUser({
            name: name.trim(),
            age: a,
            weight: w,
            height: h,
            gender,
            activityLevel,
            goal,
            dietType,
            restrictions,
            ...nutrients
        });
        // Clear new user flag after profile is updated
        if (isNewUser) setIsNewUser(false);
    }, [name, age, weight, height, gender, activityLevel, goal, dietType, restrictions]);

    const handleDeleteAccount = () => {
        Alert.alert(
            "⚠️ ¿ELIMINAR TU CUENTA?",
            "Esta acción es PERMANENTE e IRREVERSIBLE.\n\nSe borrarán:\n• Tus progresos y estadísticas.\n• Historial de comidas y peso.\n• Perfil y medallas.\n• Tu derecho al olvido según RGPD.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Siguiente paso »",
                    onPress: () => {
                        Alert.alert(
                            "🚨 ÚLTIMA CONFIRMACIÓN",
                            "¿Estás absolutamente seguro? No podremos recuperar tus datos una vez confirmes.",
                            [
                                { text: "No, mantener mis datos", style: "cancel" },
                                {
                                    text: "Borrar TODO definitivamente",
                                    style: "destructive",
                                    onPress: async () => {
                                        const result = await deleteAccount();
                                        if (!result.success) {
                                            Alert.alert(
                                                "Error de Seguridad",
                                                "Por seguridad, debes haber iniciado sesión recientemente para borrar tu cuenta. Por favor, cierra sesión y vuelve a entrar para validar tu identidad antes de borrar."
                                            );
                                        }
                                    }
                                }
                            ]
                        );
                    }
                }
            ]
        );
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            updateUser({ profileImage: result.assets[0].uri });
        }
    };

    const calculateNutrients = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height);
        const a = parseInt(age);

        // Harris-Benedict Formula (BMR)
        let bmr;
        if (gender === 'male') {
            bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
        } else {
            bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
        }

        // TDEE (Total Daily Energy Expenditure)
        let tdee = bmr * activityLevel;

        // Goal Adjustment
        let targetCalories;
        let proteinPct, carbsPct, fatPct;

        if (goal === 'lose') {
            targetCalories = tdee - 500;
            proteinPct = 35; carbsPct = 35; fatPct = 30;
        } else if (goal === 'gain') {
            targetCalories = tdee + 300;
            proteinPct = 30; carbsPct = 50; fatPct = 20;
        } else {
            targetCalories = tdee;
            proteinPct = 25; carbsPct = 45; fatPct = 30;
        }

        return {
            goalCalories: Math.round(targetCalories),
            macros: { protein: proteinPct, carbs: carbsPct, fat: fatPct }
        };
    };

    const calculateBMI = () => {
        const w = parseFloat(weight);
        const h = parseFloat(height) / 100;
        if (!w || !h) return 0;
        return (w / (h * h)).toFixed(1);
    };

    const getBMICategory = (bmi) => {
        if (bmi < 18.5) return { label: 'Bajo peso', color: '#38BDF8' };
        if (bmi < 25) return { label: 'Normal', color: colors.primary };
        if (bmi < 30) return { label: 'Sobrepeso', color: colors.accent };
        return { label: 'Obesidad', color: colors.danger };
    };

    const handleSyncHealthConnect = async () => {
        setIsSyncing(true);
        try {
            // Add a timeout so it doesn't hang forever
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('timeout')), 15000)
            );
            const result = await Promise.race([
                syncWeightFromHealth(),
                timeoutPromise
            ]);

            if (result?.success) {
                Alert.alert("✅ Éxito", `Peso sincronizado: ${result.weight} kg`);
            } else {
                Alert.alert("Aviso", result?.error || "No se pudo sincronizar el peso.");
            }
        } catch (error) {
            console.error("Error syncing weight from Health Connect:", error);
            if (error?.message === 'timeout') {
                Alert.alert("Timeout", "La conexión con Health Connect tardó demasiado. Inténtalo de nuevo.");
            } else {
                Alert.alert("Error", "No se pudo conectar con Health Connect. Asegúrate de tener la app instalada y actualizada.");
            }
        } finally {
            setIsSyncing(false);
        }
    };


    return (
        <>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                {user.isPro ? (
                    <View style={[styles.proSection, { marginBottom: 15 }]}>
                        <TouchableOpacity
                            style={styles.proCard}
                            onPress={() => navigation.navigate('Subscription')}
                        >
                            <View style={styles.proInfo}>
                                <View style={styles.proIconCircle}>
                                    <Trophy size={24} color={colors.accent} />
                                </View>
                                <View>
                                    <Text style={styles.proTitle}>Gestión de Suscripción</Text>
                                    <Text style={styles.proStatus}>Ver detalles del plan PRO ✨</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.proSection, { marginBottom: 15 }]}>
                        <TouchableOpacity
                            style={styles.proCard}
                            onPress={() => navigation.navigate('Subscription')}
                        >
                            <View style={styles.proInfo}>
                                <View style={styles.proIconCircle}>
                                    <Zap size={24} color={colors.accent} fill={colors.accent} />
                                </View>
                                <View>
                                    <Text style={styles.proTitle}>Prueba NutriTrack PRO</Text>
                                    <Text style={styles.proStatus}>Gestionar opciones de pago ✨</Text>
                                </View>
                            </View>
                            <ChevronRight size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                )}

                <PremiumModal
                    visible={showPremium}
                    onClose={() => setShowPremium(false)}
                />

                {/* Header */}
                <View style={styles.profileHeader}>
                    <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage}>
                        <View style={styles.avatarContainer}>
                            {user.profileImage ? (
                                <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
                            ) : (
                                <User size={50} color={colors.primary} />
                            )}
                            <View style={styles.cameraIconBadge}>
                                <Camera size={14} color={colors.white} />
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TextInput
                        style={styles.userNameInput}
                        value={name}
                        onChangeText={(val) => setName(sanitizeName(val))}
                        placeholder="Tu Nombre"
                        placeholderTextColor={colors.textSecondary}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />
                    <Text style={styles.userEmail}>{user.email || 'Usuario de NutriTrack'}</Text>
                </View>

                {/* Biométricos */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tus Datos Biométricos</Text>

                    {isNewUser && (
                        <View style={styles.welcomeBanner}>
                            <Text style={styles.welcomeTitle}>¡Bienvenido a NutriTrack! 🎉</Text>
                            <Text style={styles.welcomeText}>Completa tus datos para personalizar tu experiencia nutricional.</Text>
                        </View>
                    )}

                    <View style={styles.inputCard}>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputLabel}>Género</Text>
                            <View style={styles.toggleRow}>
                                <TouchableOpacity
                                    style={[styles.miniTab, gender === 'male' && styles.miniTabActive]}
                                    onPress={() => setGender('male')}
                                >
                                    <Text style={[styles.miniTabText, gender === 'male' && styles.miniTabTextActive]}>Hombre</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.miniTab, gender === 'female' && styles.miniTabActive]}
                                    onPress={() => setGender('female')}
                                >
                                    <Text style={[styles.miniTabText, gender === 'female' && styles.miniTabTextActive]}>Mujer</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.divider} />

                        {/* Edad - estilo moderno */}
                        <View style={styles.bioFieldRow}>
                            <Text style={styles.inputLabel}>Edad</Text>
                            <View style={styles.bioInputWrapper}>
                                <TextInput
                                    style={styles.bioTextInput}
                                    value={age}
                                    onChangeText={(val) => setAge(sanitizeNumber(val))}
                                    keyboardType="numeric"
                                    placeholder="25"
                                    placeholderTextColor={colors.textSecondary}
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                                <Text style={styles.bioUnitBadge}>años</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />

                        {/* Peso - estilo moderno */}
                        <View style={styles.bioFieldRow}>
                            <Text style={styles.inputLabel}>Peso</Text>
                            <View style={styles.bioInputWrapper}>
                                <TextInput
                                    style={styles.bioTextInput}
                                    value={weight}
                                    onChangeText={(val) => setWeight(sanitizeNumber(val))}
                                    keyboardType="numeric"
                                    placeholder="70.0"
                                    placeholderTextColor={colors.textSecondary}
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                                <Text style={styles.bioUnitBadge}>kg</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />

                        {/* Altura - estilo moderno */}
                        <View style={styles.bioFieldRow}>
                            <Text style={styles.inputLabel}>Altura</Text>
                            <View style={styles.bioInputWrapper}>
                                <TextInput
                                    style={styles.bioTextInput}
                                    value={height}
                                    onChangeText={(val) => setHeight(sanitizeNumber(val))}
                                    keyboardType="numeric"
                                    placeholder="175"
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={styles.bioUnitBadge}>cm</Text>
                            </View>
                        </View>

                        {/* BMI Widget */}
                        <View style={styles.bmiWidget}>
                            <View>
                                <Text style={styles.bmiLabel}>Tu IMC Actual</Text>
                                <Text style={styles.bmiValue}>{calculateBMI()}</Text>
                            </View>
                            <View style={[styles.bmiBadge, { backgroundColor: getBMICategory(calculateBMI()).color }]}>
                                <Text style={styles.bmiBadgeText}>{getBMICategory(calculateBMI()).label}</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />
                        <TouchableOpacity
                            style={styles.syncRow}
                            onPress={handleSyncHealthConnect}
                            disabled={isSyncing}
                        >
                            <View style={styles.syncLabelContainer}>
                                <Activity size={20} color={colors.primary} />
                                <Text style={styles.syncLabel}>Sincronizar con Health Connect</Text>
                            </View>
                            {isSyncing ? (
                                <RefreshCw size={20} color={colors.primary} />
                            ) : (
                                <ChevronRight size={20} color={colors.textSecondary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>


                {/* Actividad y Objetivo */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nivel de Actividad</Text>
                    <View style={styles.inputCard}>
                        {[
                            { label: 'Sedentario', desc: 'Poco o nada de ejercicio', val: 1.2, icon: '🏠' },
                            { label: 'Ligero', desc: '1-3 días / semana', val: 1.375, icon: '🚶' },
                            { label: 'Moderado', desc: '3-5 días / semana', val: 1.55, icon: '🏋️' },
                            { label: 'Activo', desc: '6-7 días / semana', val: 1.725, icon: '🏃' },
                            { label: 'Muy Activo', desc: 'Atletas / Trabajo físico', val: 1.9, icon: '⚡' },
                        ].map(item => (
                            <TouchableOpacity
                                key={item.label}
                                style={[styles.activityItem, activityLevel === item.val && styles.activityItemActive]}
                                onPress={() => setActivityLevel(item.val)}
                            >
                                <View style={[styles.activityIconBox, activityLevel === item.val && styles.activityIconBoxActive]}>
                                    <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.activityName, activityLevel === item.val && styles.activityNameActive]}>{item.label}</Text>
                                    <Text style={styles.activityDesc}>{item.desc}</Text>
                                </View>
                                {activityLevel === item.val && <CheckCircle2 size={16} color={colors.primary} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Objetivo Personal</Text>
                    <View style={[styles.goalRow, { paddingHorizontal: 0 }]}>
                        {[
                            { label: 'Perder Grasa', val: 'lose', icon: <Flame size={18} /> },
                            { label: 'Mantener', val: 'maintain', icon: <Target size={18} /> },
                            { label: 'Ganar Músculo', val: 'gain', icon: <TrendingUp size={18} /> },
                        ].map(item => (
                            <TouchableOpacity
                                key={item.val}
                                style={[styles.goalTab, goal === item.val && styles.goalTabActive]}
                                onPress={() => setGoal(item.val)}
                            >
                                <View style={{ marginBottom: 6 }}>
                                    {React.cloneElement(item.icon, {
                                        color: goal === item.val ? colors.primary : colors.textSecondary,
                                        fill: goal === item.val ? (item.val === 'lose' ? colors.primary : 'transparent') : 'transparent'
                                    })}
                                </View>
                                <Text style={[styles.goalTabText, goal === item.val && styles.goalTabTextActive]}>
                                    {item.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Preferencias Alimentarias (Ruta de Dietas Especiales) */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Leaf size={18} color={colors.primary} />
                        <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>Preferencias Alimentarias</Text>
                    </View>

                    <View style={styles.inputCard}>
                        <Text style={styles.cardLabel}>Tipo de Dieta</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelector}>
                            {[
                                { label: 'Omnívora', val: 'omnivore', icon: '🥩' },
                                { label: 'Vegetariana', val: 'vegetarian', icon: '🥚' },
                                { label: 'Vegana', val: 'vegan', icon: '🌱' },
                                { label: 'Keto', val: 'keto', icon: '🥑' },
                                { label: 'Paleo', val: 'paleo', icon: '🦴' },
                            ].map(item => (
                                <TouchableOpacity
                                    key={item.val}
                                    style={[styles.choiceChip, dietType === item.val && styles.choiceChipActive]}
                                    onPress={() => setDietType(item.val)}
                                >
                                    <Text style={[styles.choiceText, dietType === item.val && styles.choiceTextActive]}>
                                        {item.icon} {item.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text style={[styles.cardLabel, { marginTop: 22, marginBottom: 12 }]}>Restricciones & Alergias</Text>
                        <View style={styles.restrictionGrid}>
                            {[
                                { label: 'Sin Gluten (Celiaco)', val: 'celiac', icon: <Wheat size={16} /> },
                                { label: 'Sin Lactosa', val: 'lactose', icon: <Milk size={16} /> },
                                { label: 'Sin Frutos Secos', val: 'nuts', icon: <Plus size={16} style={{ transform: [{ rotate: '45deg' }] }} /> },
                            ].map(item => {
                                const isActive = restrictions.includes(item.val);
                                return (
                                    <TouchableOpacity
                                        key={item.val}
                                        style={[styles.restrictionChip, isActive && styles.restrictionChipActive]}
                                        onPress={() => {
                                            if (isActive) {
                                                setRestrictions(restrictions.filter(r => r !== item.val));
                                            } else {
                                                setRestrictions([...restrictions, item.val]);
                                            }
                                        }}
                                    >
                                        <View style={{ marginRight: 8 }}>
                                            {React.cloneElement(item.icon, { color: isActive ? colors.white : colors.textSecondary })}
                                        </View>
                                        <Text style={[styles.restrictionText, isActive && styles.restrictionTextActive]}>
                                            {item.label}
                                        </Text>
                                        {isActive && <CheckCircle2 size={14} color={colors.white} style={{ marginLeft: 6 }} />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {/* Distribución de Macros Gráfica */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Distribución Recomendada</Text>
                    <View style={styles.chartCard}>
                        {(() => {
                            const nutrients = calculateNutrients();
                            const targetCals = nutrients.goalCalories;
                            const data = [
                                {
                                    name: `Proteínas: ${Math.round((targetCals * (nutrients.macros.protein / 100)) / 4)}g`,
                                    population: nutrients.macros.protein,
                                    color: colors.macronutrients.protein,
                                    legendFontColor: colors.text,
                                    legendFontSize: 12,
                                },
                                {
                                    name: `Carbos: ${Math.round((targetCals * (nutrients.macros.carbs / 100)) / 4)}g`,
                                    population: nutrients.macros.carbs,
                                    color: colors.macronutrients.carbs,
                                    legendFontColor: colors.text,
                                    legendFontSize: 12,
                                },
                                {
                                    name: `Grasas: ${Math.round((targetCals * (nutrients.macros.fat / 100)) / 9)}g`,
                                    population: nutrients.macros.fat,
                                    color: colors.macronutrients.fat,
                                    legendFontColor: colors.text,
                                    legendFontSize: 12,
                                },
                            ];

                            return (
                                <PieChart
                                    data={data}
                                    width={width - 40}
                                    height={180}
                                    chartConfig={{
                                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                    }}
                                    accessor={"population"}
                                    backgroundColor={"transparent"}
                                    paddingLeft={"15"}
                                    center={[10, 0]}
                                    absolute={false} // Muestra porcentajes en lugar de valores crudos
                                />
                            );
                        })()}
                        <Text style={styles.chartSummary}>
                            Objetivo: <Text style={{ color: colors.primary, fontWeight: '800' }}>{calculateNutrients().goalCalories} kcal</Text>
                        </Text>
                    </View>
                </View>

                {/* Medallas y Logros con Progreso */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Tus Medallas & Logros</Text>
                        <TouchableOpacity
                            style={styles.rankingBtn}
                            onPress={() => {
                                setShowLeaderboard(true);
                                fetchLeaderboard();
                            }}
                        >
                            <Crown size={16} color={colors.accent} fill={colors.accent} />
                            <Text style={styles.rankingBtnText}>Ranking Global</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgeScroll}>
                        <BadgeItem
                            icon={<Award size={30} color="#FFD700" />}
                            label="Principiante"
                            active={meals.length >= 5}
                            current={meals.length}
                            total={5}
                            desc="Haber registrado más de 5 comidas en total."
                        />
                        <BadgeItem
                            icon={<Zap size={30} color="#FF9800" />}
                            label="Racha 3 días"
                            active={streak >= 3}
                            current={streak}
                            total={3}
                            desc="Mantener el objetivo calórico durante 3 días consecutivos."
                        />
                        <BadgeItem
                            icon={<Target size={30} color="#2196F3" />}
                            label="🎯 Precisión"
                            active={progress > 0.9 && progress <= 1.05}
                            current={progress > 0.9 ? 1 : progress}
                            total={1}
                            isPercent
                            desc="Terminar el día con una precisión del 90-100% en calorías."
                        />
                        <BadgeItem
                            icon={<Flame size={30} color="#F44336" />}
                            label="Quema-grasas"
                            active={todayFat < 50 && todayCals > 1000}
                            current={(todayFat < 50 && todayCals > 0) ? 1 : 0}
                            total={1}
                            desc="Consumir más de 1000 kcal con menos de 50g de grasa hoy."
                        />
                        <BadgeItem
                            icon={<Trophy size={30} color="#10B981" />}
                            label="Leyenda"
                            active={streak >= 7}
                            current={streak}
                            total={7}
                            desc="¡Alcanzar una racha perfecta de 7 días!"
                        />
                    </ScrollView>
                </View>
                {/* Soporte y Cuenta */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Soporte & Privacidad</Text>
                    <View style={styles.inputCard}>
                        <TouchableOpacity
                            style={styles.syncRow}
                            onPress={() => WebBrowser.openBrowserAsync('https://nutritrack-327c1.web.app/privacy.html')}
                        >
                            <View style={styles.syncLabelContainer}>
                                <Settings size={20} color={colors.textSecondary} />
                                <Text style={[styles.syncLabel, { color: colors.text }]}>Términos y Privacidad</Text>
                            </View>
                            <ChevronRight size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.syncRow} onPress={logout}>
                            <View style={styles.syncLabelContainer}>
                                <LogOut size={20} color={colors.danger} />
                                <Text style={[styles.syncLabel, { color: colors.danger }]}>Cerrar Sesión</Text>
                            </View>
                            <ChevronRight size={20} color={colors.danger} />
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        <TouchableOpacity style={styles.syncRow} onPress={handleDeleteAccount}>
                            <View style={styles.syncLabelContainer}>
                                <Trash2 size={20} color={colors.danger} />
                                <Text style={[styles.syncLabel, { color: colors.danger }]}>Eliminar Cuenta definitivamente</Text>
                            </View>
                            <ChevronRight size={20} color={colors.danger} />
                        </TouchableOpacity>
                    </View>
                </View>


                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>NutriTrack v{appVersion}</Text>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* Modal de Ranking Global */}
            <Modal visible={showLeaderboard} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Crown size={28} color={colors.accent} fill={colors.accent} />
                                <Text style={styles.modalTitle}>Ranking Global</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowLeaderboard(false)} style={styles.modalCloseIcon}>
                                <X size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>¡Sigue sumando XP y escala hacia el top!</Text>

                        {isFetchingLeaderboard ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator size="large" color={colors.primary} />
                            </View>
                        ) : (
                            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                                {leaderboardData.map((lbUser, index) => {
                                    const levelInfo = getLevelInfo(lbUser.xp);
                                    const isCurrentUser = lbUser.id === user.uid;
                                    return (
                                        <View key={lbUser.id} style={[styles.rankRow, isCurrentUser && styles.rankRowCurrent]}>
                                            <Text style={[styles.rankNumber, index < 3 && { color: colors.accent, fontSize: 22, fontWeight: '900' }]}>
                                                #{index + 1}
                                            </Text>
                                            <View style={[styles.rankAvatar, { backgroundColor: isCurrentUser ? colors.primary + '20' : colors.surface }]}>
                                                {lbUser.photoURL ? (
                                                    <Image source={{ uri: lbUser.photoURL }} style={{ width: 48, height: 48, borderRadius: 24 }} />
                                                ) : (
                                                    <Text style={{ fontSize: 20 }}>{levelInfo.icon}</Text>
                                                )}
                                            </View>
                                            <View style={styles.rankInfo}>
                                                <Text style={[styles.rankName, isCurrentUser && { color: colors.primary }]}>{lbUser.name}</Text>
                                                <Text style={styles.rankLevelDesc}>Nivel {levelInfo.level} · {levelInfo.name}</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[styles.rankXP, isCurrentUser && { color: colors.primary }]}>{lbUser.xp}</Text>
                                                <Text style={styles.rankXpLabel}>XP</Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
        </>
    );
};

const BadgeItem = ({ icon, label, active, desc, current, total, isPercent }) => {
    const showDetails = () => {
        Alert.alert(
            label,
            `${desc}\n\nProgreso: ${current}/${total}${active ? ' ✅' : ''}`,
            [{ text: 'Entendido' }]
        );
    };

    const progressValue = Math.min(Math.max(current / total, 0), 1);

    return (
        <TouchableOpacity
            style={[styles.badgeItem, !active && styles.badgeInactive]}
            onPress={showDetails}
        >
            <View style={styles.badgeHeader}>
                {icon}
                {active && (
                    <View style={styles.badgeCheck}>
                        <CheckCircle2 size={12} color={colors.white} />
                    </View>
                )}
            </View>
            <Text style={styles.badgeLabel}>{label}</Text>

            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressValue * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
                {isPercent ? `${Math.round(progressValue * 100)}%` : `${current}/${total}`}
            </Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    proSection: {
        padding: 20,
        paddingBottom: 0,
        marginTop: 10,
    },
    proCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    proCardEnabled: {
        borderColor: colors.accent,
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
    },
    proInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    proIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    proTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    proStatus: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    statusToggle: {
        width: 46,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.border,
        padding: 2,
    },
    statusToggleActive: {
        backgroundColor: colors.accent,
    },
    toggleCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.white,
    },
    toggleCircleActive: {
        marginLeft: 'auto',
    },
    profileHeader: {
        alignItems: 'center',
        padding: 30,
        backgroundColor: colors.card,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    avatarWrapper: {
        marginBottom: 16,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        borderWidth: 2,
        borderColor: colors.primary,
        padding: 2,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.card,
    },
    userNameInput: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        minWidth: 150,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 20,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        backgroundColor: colors.primary,
    },
    saveButtonText: {
        color: colors.white,
        fontWeight: '600',
        marginLeft: 8,
    },
    section: {
        padding: 20,
        paddingBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    inputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
    },
    inputLabel: {
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
    },
    textInput: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
        textAlign: 'right',
        minWidth: 60,
    },
    toggleRow: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 10,
        padding: 4,
    },
    miniTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    miniTabActive: {
        backgroundColor: colors.primary,
    },
    miniTabText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    miniTabTextActive: {
        color: colors.white,
    },
    progressText: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '700',
        marginTop: 2,
    },
    restrictionGrid: {
        gap: 10,
    },
    restrictionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 15,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    restrictionChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    restrictionText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    restrictionTextActive: {
        color: colors.white,
        fontWeight: '700',
    },
    cardLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 12,
    },
    scrollSelector: {
        flexDirection: 'row',
    },
    choiceChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: colors.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    choiceChipActive: {
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
    },
    choiceText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    choiceTextActive: {
        color: colors.primary,
    },
    goalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    goalTab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 12,
        backgroundColor: colors.background,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    goalTabActive: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    goalTabText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '700',
    },
    goalTabTextActive: {
        color: colors.primary,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    activityItemActive: {
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
    },
    activityIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityIconBoxActive: {
        backgroundColor: colors.white,
    },
    activityName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    activityNameActive: {
        color: colors.primary,
    },
    activityDesc: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    summaryCard: {
        margin: 20,
        padding: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderRadius: 16,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    summaryText: {
        fontSize: 12,
        color: colors.primary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    badgeScroll: {
        marginTop: 5,
    },
    badgeItem: {
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 20,
        alignItems: 'center',
        marginRight: 12,
        width: 105,
        borderWidth: 1,
        borderColor: colors.border,
    },
    badgeInactive: {
        opacity: 0.2,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    badgeLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 8,
        textAlign: 'center',
        color: colors.text,
    },
    chartCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    chartSummary: {
        marginTop: 10,
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    badgeHeader: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeCheck: {
        position: 'absolute',
        top: -5,
        right: -10,
        backgroundColor: colors.primary,
        borderRadius: 10,
        padding: 2,
    },
    progressBarBg: {
        width: '100%',
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        marginTop: 12,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    progressText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.textSecondary,
        marginTop: 4,
    },
    logWeightBtn: {
        backgroundColor: colors.primary,
        width: 30,
        height: 30,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    bmiWidget: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(255,255,255,0.02)',
        padding: 15,
        borderRadius: 15,
        marginTop: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    bmiLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    bmiValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    bmiBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    bmiBadgeText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    weightHistoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    historyDate: {
        color: colors.textSecondary,
        fontSize: 14,
    },
    historyValueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    historyWeight: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    historyUnit: {
        fontSize: 12,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    syncRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    syncLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    syncLabel: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 14,
    },
    bioFieldRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    bioInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 120,
    },
    bioTextInput: {
        flex: 1,
        height: 44,
        color: colors.text,
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'right',
        paddingRight: 4,
    },
    bioUnitBadge: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 4,
    },
    welcomeBanner: {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.primary,
        borderStyle: 'dashed',
    },
    welcomeTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.primary,
        marginBottom: 4,
    },
    welcomeText: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    versionContainer: {
        alignItems: 'flex-end',
        paddingHorizontal: 30,
        marginTop: 20,
        opacity: 0.5,
    },
    versionText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    // Leaderboard Styles
    rankingBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.accent + '20',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    rankingBtnText: {
        color: colors.accent,
        fontWeight: '800',
        fontSize: 13,
        marginLeft: 6,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.text,
        marginLeft: 10,
    },
    modalCloseIcon: {
        padding: 5,
    },
    modalSubtitle: {
        color: colors.textSecondary,
        fontSize: 14,
        marginBottom: 20,
        marginLeft: 4,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 16,
        marginBottom: 10,
    },
    rankRowCurrent: {
        borderColor: colors.primary,
        borderWidth: 2,
        backgroundColor: colors.primary + '10',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    rankNumber: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textSecondary,
        width: 40,
    },
    rankAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankInfo: {
        flex: 1,
    },
    rankName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    rankLevelDesc: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    rankXP: {
        fontSize: 18,
        fontWeight: '900',
        color: colors.accent,
    },
    rankXpLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        textAlign: 'right',
    },
});

export default ProfileScreen;
