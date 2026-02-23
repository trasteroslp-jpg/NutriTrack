import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Dimensions } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { PlusCircle, Flame, Target, Utensils, Trophy, Zap, Award, Droplets, GlassWater, Minus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DashboardScreen = () => {
    const { meals, user, streak, isLoading, waterIntake, addWater } = useApp();
    const { width } = useWindowDimensions();
    const navigation = useNavigation();

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const todayMeals = meals.filter(meal => meal.date === today);

    const consumedCalories = todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalCarbs = todayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
    const totalFat = todayMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

    const progress = Math.min(consumedCalories / user.goalCalories, 1);

    const data = {
        labels: ["Calorías"],
        data: [progress]
    };

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 3,
        propsForBackgroundLines: {
            strokeDasharray: "", // solid background lines
            stroke: colors.border
        },
    };

    return (
        <ScrollView style={styles.container}>
            {/* Gamification Banner */}
            <View style={styles.streakBanner}>
                <View style={styles.streakContent}>
                    <Zap size={24} color={colors.accent} fill={colors.accent} />
                    <View style={styles.streakTextContainer}>
                        <Text style={styles.streakValue}>{streak} días</Text>
                        <Text style={styles.streakLabel}>Racha de cumplimiento</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.trophyButton}>
                    <Trophy size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Header Summary */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Resumen de Hoy</Text>
                <View style={styles.progressContainer}>
                    <ProgressChart
                        data={data}
                        width={width * 0.4}
                        height={160}
                        strokeWidth={16}
                        radius={50}
                        chartConfig={chartConfig}
                        hideLegend={true}
                    />
                    <View style={styles.caloriesInfo}>
                        <View style={styles.infoRow}>
                            <Flame size={18} color={colors.primary} />
                            <Text style={styles.infoValue}>{consumedCalories}</Text>
                            <Text style={styles.infoLabel}> Consumidas</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Target size={18} color={colors.textSecondary} />
                            <Text style={styles.infoValue}>{user.goalCalories}</Text>
                            <Text style={styles.infoLabel}> Objetivo</Text>
                        </View>
                        <Text style={[styles.infoStatus, { color: consumedCalories > user.goalCalories ? colors.danger : colors.primary }]}>
                            {user.goalCalories - consumedCalories < 0
                                ? `${Math.abs(user.goalCalories - consumedCalories)} kcal extra`
                                : `${user.goalCalories - consumedCalories} kcal restantes`}
                        </Text>
                    </View>
                </View>
            </View>


            {/* Macronutrients */}
            <View style={styles.macroRow}>
                <MacroCard
                    label="Proteínas"
                    value={`${totalProtein}g`}
                    goal={`${Math.round((user.goalCalories * (user.macros?.protein / 100)) / 4)}g`}
                    color={colors.macronutrients.protein}
                    percent={Math.min(totalProtein / ((user.goalCalories * (user.macros?.protein / 100)) / 4), 1) * 100}
                />
                <MacroCard
                    label="Carbos"
                    value={`${totalCarbs}g`}
                    goal={`${Math.round((user.goalCalories * (user.macros?.carbs / 100)) / 4)}g`}
                    color={colors.macronutrients.carbs}
                    percent={Math.min(totalCarbs / ((user.goalCalories * (user.macros?.carbs / 100)) / 4), 1) * 100}
                />
                <MacroCard
                    label="Grasas"
                    value={`${totalFat}g`}
                    goal={`${Math.round((user.goalCalories * (user.macros?.fat / 100)) / 9)}g`}
                    color={colors.macronutrients.fat}
                    percent={Math.min(totalFat / ((user.goalCalories * (user.macros?.fat / 100)) / 9), 1) * 100}
                />
            </View>

            {/* Quick Add Section */}
            <TouchableOpacity
                style={styles.quickAddCard}
                onPress={() => navigation.navigate('Añadir')}
            >
                <View style={styles.quickAddContent}>
                    <Utensils size={24} color={colors.primary} />
                    <View style={styles.quickAddText}>
                        <Text style={styles.quickAddTitle}>Registrar alimento</Text>
                        <Text style={styles.quickAddSubtitle}>Busca y añade tu comida</Text>
                    </View>
                </View>
                <PlusCircle size={28} color={colors.primary} />
            </TouchableOpacity>

            {/* Water Tracker Section */}
            <View style={styles.waterCard}>
                <View style={styles.waterHeader}>
                    <View style={styles.waterTitleRow}>
                        <Droplets size={22} color="#38BDF8" />
                        <Text style={styles.waterTitle}>Hidratación</Text>
                    </View>
                    <Text style={styles.waterGoalText}>Meta: {user.waterGoal || 2000}ml</Text>
                </View>

                <View style={styles.waterContent}>
                    <View style={styles.waterProgressInfo}>
                        <Text style={styles.waterLargeValue}>{waterIntake}</Text>
                        <Text style={styles.waterUnit}>ml</Text>
                    </View>

                    <View style={styles.waterControls}>
                        <TouchableOpacity
                            style={[styles.waterBtn, styles.waterBtnMinus]}
                            onPress={() => addWater(-250)}
                        >
                            <Minus size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.waterBtnMain}
                            onPress={() => addWater(250)}
                        >
                            <GlassWater size={24} color={colors.white} />
                            <Text style={styles.waterBtnText}>+250ml</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.waterBarBg}>
                    <View
                        style={[
                            styles.waterBarFill,
                            { width: `${Math.min((waterIntake / (user.waterGoal || 2000)) * 100, 100)}%` }
                        ]}
                    />
                </View>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
};


const MacroCard = ({ label, value, goal, color, percent }) => (
    <View style={styles.macroCard}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroValue, { color }]}>{value}</Text>
        <View style={styles.progressBg}>
            <View style={[styles.progressFill, { backgroundColor: color, width: `${percent}%` }]} />
        </View>
        <Text style={styles.macroGoal}>de {goal}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    streakBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        padding: 16,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.2)',
    },
    streakContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakTextContainer: {
        marginLeft: 12,
    },
    streakValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    streakLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    trophyButton: {
        backgroundColor: colors.card,
        padding: 8,
        borderRadius: 12,
        elevation: 2,
    },
    card: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 10,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    caloriesInfo: {
        flex: 1,
        marginLeft: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.text,
        marginLeft: 5,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    infoStatus: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    macroCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 12,
        width: (SCREEN_WIDTH - 64) / 3,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    macroLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    macroValue: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    progressBg: {
        height: 4,
        backgroundColor: colors.border,
        borderRadius: 2,
        width: '100%',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    macroGoal: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    quickAddCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    quickAddContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quickAddText: {
        marginLeft: 12,
    },
    quickAddTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    quickAddSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    waterCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    waterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    waterTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    waterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    waterGoalText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    waterContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    waterProgressInfo: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    waterLargeValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#38BDF8',
    },
    waterUnit: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 4,
        fontWeight: '600',
    },
    waterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    waterBtn: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    waterBtnMain: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#38BDF8',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 8,
    },
    waterBtnText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 14,
    },
    waterBarBg: {
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        overflow: 'hidden',
    },
    waterBarFill: {
        height: '100%',
        backgroundColor: '#38BDF8',
        borderRadius: 3,
    },
});

export default DashboardScreen;
