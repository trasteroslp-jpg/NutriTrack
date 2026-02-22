import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, TextInput, Alert, useWindowDimensions } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { PieChart } from 'react-native-chart-kit';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Save, Award, Zap, Target, Flame, Trophy, Camera, CheckCircle2 } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import PremiumModal from '../components/PremiumModal';

const ProfileScreen = () => {
    const { user, updateUser, meals, streak, logout, weightHistory, logWeight } = useApp();
    const { width } = useWindowDimensions();
    const [name, setName] = useState(user.name);
    const [showPremium, setShowPremium] = useState(false);
    const [age, setAge] = useState(user.age?.toString() || '25');
    const [weight, setWeight] = useState(user.weight.toString());
    const [height, setHeight] = useState(user.height?.toString() || '170');
    const [gender, setGender] = useState(user.gender || 'male');
    const [activityLevel, setActivityLevel] = useState(user.activityLevel || 1.2);
    const [goal, setGoal] = useState(user.goal || 'maintain');

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
            ...nutrients
        });
    }, [name, age, weight, height, gender, activityLevel, goal]);

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



    return (
        <ScrollView style={styles.container}>
            {/* Pro Status Card */}
            {!user.isPro ? (
                <View style={[styles.proSection, { marginBottom: 15 }]}>
                    <TouchableOpacity
                        style={styles.proCard}
                        onPress={() => setShowPremium(true)}
                    >
                        <View style={styles.proInfo}>
                            <View style={styles.proIconCircle}>
                                <Zap size={24} color={colors.accent} fill={colors.accent} />
                            </View>
                            <View>
                                <Text style={styles.proTitle}>Hazte NutriTrack PRO</Text>
                                <Text style={styles.proStatus}>Desbloquea IA Vision y más ✨</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={[styles.proSection, { marginBottom: 15 }]}>
                    <View style={[styles.proCard, styles.proCardEnabled]}>
                        <View style={styles.proInfo}>
                            <View style={styles.proIconCircle}>
                                <Trophy size={24} color={colors.accent} />
                            </View>
                            <View>
                                <Text style={styles.proTitle}>NutriTrack PRO</Text>
                                <Text style={styles.proStatus}>Suscripción Activa ✨</Text>
                            </View>
                        </View>
                        <Award size={24} color={colors.accent} />
                    </View>
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
                    onChangeText={setName}
                    placeholder="Tu Nombre"
                    placeholderTextColor={colors.textSecondary}
                />
                <Text style={styles.userEmail}>{user.email || 'david@example.com'}</Text>

                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: 'transparent', marginTop: 10, borderWidth: 1, borderColor: colors.danger }]}
                    onPress={logout}
                >
                    <LogOut size={18} color={colors.danger} />
                    <Text style={[styles.saveButtonText, { color: colors.danger }]}>Cerrar Sesión</Text>
                </TouchableOpacity>
            </View>

            {/* Biométricos */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Tus Datos Biométricos</Text>
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
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Edad</Text>
                        <TextInput style={styles.textInput} value={age} onChangeText={setAge} keyboardType="numeric" />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Peso (kg)</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TextInput style={styles.textInput} value={weight} onChangeText={setWeight} keyboardType="numeric" />
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.inputRow}>
                        <Text style={styles.inputLabel}>Altura (cm)</Text>
                        <TextInput style={styles.textInput} value={height} onChangeText={setHeight} keyboardType="numeric" />
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
                </View>
            </View>


            {/* Actividad y Objetivo */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Actividad y Objetivo</Text>
                <View style={styles.inputCard}>
                    <Text style={styles.cardLabel}>Nivel de Actividad</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelector}>
                        {[
                            { label: 'Sedentario', val: 1.2 },
                            { label: 'Ligero', val: 1.375 },
                            { label: 'Moderado', val: 1.55 },
                            { label: 'Activo', val: 1.725 },
                            { label: 'Atleta', val: 1.9 },
                        ].map(item => (
                            <TouchableOpacity
                                key={item.val}
                                style={[styles.choiceChip, activityLevel === item.val && styles.choiceChipActive]}
                                onPress={() => setActivityLevel(item.val)}
                            >
                                <Text style={[styles.choiceText, activityLevel === item.val && styles.choiceTextActive]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <Text style={[styles.cardLabel, { marginTop: 20 }]}>Mi Objetivo</Text>
                    <View style={styles.goalRow}>
                        {[
                            { label: 'Perder Peso', val: 'lose' },
                            { label: 'Mantener', val: 'maintain' },
                            { label: 'Ganar Músculo', val: 'gain' },
                        ].map(item => (
                            <TouchableOpacity
                                key={item.val}
                                style={[styles.goalTab, goal === item.val && styles.goalTabActive]}
                                onPress={() => setGoal(item.val)}
                            >
                                <Text style={[styles.goalTabText, goal === item.val && styles.goalTabTextActive]}>{item.label}</Text>
                            </TouchableOpacity>
                        ))}
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
                <Text style={styles.sectionTitle}>Tus Medallas & Logros</Text>
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


            <View style={{ height: 40 }} />
        </ScrollView>
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
    }
});

export default ProfileScreen;
