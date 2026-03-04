import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Dimensions, Alert, Vibration } from 'react-native';
import { ProgressChart } from 'react-native-chart-kit';
import { PlusCircle, Flame, Target, Utensils, Trophy, Zap, Award, Droplets, GlassWater, Minus, Star, Leaf, X, ChevronRight, Info, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { r, rn } from '../utils/formatNumber';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { getLevelInfo, LEGEND, getXPForLevel } from '../utils/gamificationLogic';
import { Modal } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DashboardScreen = () => {
    const { meals, user, streak, isLoading, waterIntake, addWater, levelUpData, setLevelUpData } = useApp();
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

    const consumedCalories = Math.round(todayMeals.reduce((sum, meal) => sum + meal.calories, 0));
    const totalProtein = rn(todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0));
    const totalCarbs = rn(todayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0));
    const totalFat = rn(todayMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0));

    const progress = Math.min(consumedCalories / user.goalCalories, 1);

    // Gamification Data
    const levelInfo = getLevelInfo(user.xp || 0);
    const [isLegendVisible, setIsLegendVisible] = React.useState(false);

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

    const COACHING_TIPS = [
        "El aceite de oliva virgen extra es oro líquido. ¡Úsalo siempre en crudo!",
        "Prioriza las legumbres 3 veces por semana para una racha legendaria.",
        "Beber agua antes de las comidas ayuda a la saciedad. ¡A por ese vaso!",
        "¿Sabías que el sueño profundo regula tus hormonas del hambre?",
        "Caminar 10 minutos tras la cena mejora tu digestión notablemente.",
        "Las nueces son el snack perfecto: omega-3 para tu cerebro.",
        "Menos procesado, más mercado. ¡Tu cuerpo lo agradecerá!"
    ];

    const dailyTip = React.useMemo(() => COACHING_TIPS[Math.floor(Math.random() * COACHING_TIPS.length)], []);

    return (
        <ScrollView style={styles.container}>
            {/* Legend Modal */}
            <Modal
                visible={isLegendVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsLegendVisible(false)}
            >
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end' }]}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Cómo ganar XP</Text>
                            <TouchableOpacity onPress={() => setIsLegendVisible(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalSubtitle}>Sube de nivel registrando tus hábitos diarios. ¡Los niveles altos son para los más constantes!</Text>

                        <ScrollView style={{ maxHeight: 400 }}>
                            <Text style={styles.sectionMiniLabel}>Formas de ganar XP</Text>
                            {LEGEND.map((item, idx) => (
                                <View key={idx} style={styles.legendItem}>
                                    <View style={styles.legendIconBg}>
                                        <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                                    </View>
                                    <View style={styles.legendTextContainer}>
                                        <Text style={styles.legendAction}>{item.action}</Text>
                                        <Text style={styles.legendPoints}>{item.points}</Text>
                                    </View>
                                </View>
                            ))}

                            <Text style={[styles.sectionMiniLabel, { marginTop: 20 }]}>Progreso de Niveles</Text>
                            {[1, 2, 3, 5, 10, 15, 20, 30].map((lvl) => {
                                const info = getLevelInfo(getXPForLevel(lvl));
                                return (
                                    <View key={lvl} style={styles.levelRow}>
                                        <View style={[styles.levelRowBadge, { backgroundColor: info.color + '20' }]}>
                                            <Text style={{ fontSize: 16 }}>{info.icon}</Text>
                                        </View>
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={styles.levelRowName}>{info.name}</Text>
                                            <Text style={styles.levelRowDetail}>Nivel {lvl}</Text>
                                        </View>
                                        <Text style={styles.levelRowXP}>{getXPForLevel(lvl)} XP</Text>
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setIsLegendVisible(false)}
                        >
                            <Text style={styles.modalCloseBtnText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Level Up Modal */}
            <Modal
                visible={!!levelUpData}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setLevelUpData(null)}
            >
                <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }]}>
                    <View style={styles.levelUpCard}>
                        <Trophy size={60} color={colors.accent} style={{ marginBottom: 16 }} />
                        <Text style={styles.levelUpTitle}>¡NUEVO NIVEL!</Text>
                        <Text style={styles.levelUpText}>Has ascendido al rango de</Text>
                        <Text style={[styles.levelUpRank, { color: levelUpData?.color }]}>{levelUpData?.icon} {levelUpData?.name}</Text>
                        <View style={styles.levelUpBadge}>
                            <Text style={styles.levelUpBadgeText}>Nivel {levelUpData?.level}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.modalCloseBtn, { width: '100%', marginTop: 20 }]}
                            onPress={() => setLevelUpData(null)}
                        >
                            <Text style={styles.modalCloseBtnText}>¡A por el siguiente!</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Premium Rank Card */}
            <TouchableOpacity
                style={[styles.rankCard, { borderColor: levelInfo.color + '40' }]}
                onPress={() => {
                    Vibration.vibrate(10);
                    setIsLegendVisible(true);
                }}
            >
                <View style={styles.rankHeader}>
                    <View style={[styles.rankIconContainer, { backgroundColor: levelInfo.color + '20' }]}>
                        <Text style={{ fontSize: 32 }}>{levelInfo.icon}</Text>
                    </View>
                    <View style={styles.rankInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.rankLevel}>NIVEL {levelInfo.level}</Text>
                            <Info size={14} color={colors.textSecondary} />
                        </View>
                        <Text style={[styles.rankName, { color: levelInfo.color }]}>{levelInfo.name}</Text>
                        <View style={styles.xpBarBg}>
                            <View style={[styles.xpBarFill, { width: `${levelInfo.progress * 100}%`, backgroundColor: levelInfo.color }]} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={styles.xpText}>{user.xp || 0} XP</Text>
                            <Text style={styles.xpText}>Siguiente: {levelInfo.nextLevelXP} XP</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.streakBadge}
                        onPress={() => Alert.alert("Racha de Días", "Representa los días consecutivos que has cumplido tu objetivo de calorías (con un margen del 10%). ¡No dejes que se apague la llama!")}
                    >
                        <Flame size={16} color={colors.accent} fill={colors.accent} />
                        <Text style={styles.streakBadgeText}>{streak}</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

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
                    value={`${r(totalProtein)}g`}
                    goal={`${Math.round((user.goalCalories * (user.macros?.protein / 100)) / 4)}g`}
                    color={colors.macronutrients.protein}
                    percent={Math.min(totalProtein / ((user.goalCalories * (user.macros?.protein / 100)) / 4), 1) * 100}
                />
                <MacroCard
                    label="Carbos"
                    value={`${r(totalCarbs)}g`}
                    goal={`${Math.round((user.goalCalories * (user.macros?.carbs / 100)) / 4)}g`}
                    color={colors.macronutrients.carbs}
                    percent={Math.min(totalCarbs / ((user.goalCalories * (user.macros?.carbs / 100)) / 4), 1) * 100}
                />
                <MacroCard
                    label="Grasas"
                    value={`${r(totalFat)}g`}
                    goal={`${Math.round((user.goalCalories * (user.macros?.fat / 100)) / 9)}g`}
                    color={colors.macronutrients.fat}
                    percent={Math.min(totalFat / ((user.goalCalories * (user.macros?.fat / 100)) / 9), 1) * 100}
                />
            </View>

            {/* Quick Add Section */}
            <TouchableOpacity
                style={styles.quickAddCard}
                onPress={() => {
                    Vibration.vibrate(20);
                    navigation.navigate('Añadir');
                }}
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

            {/* Daily Tip Card */}
            <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                    <Sparkles size={20} color={colors.accent} />
                    <Text style={styles.tipTitle}>Coaching del Día</Text>
                </View>
                <Text style={styles.tipContent}>{dailyTip}</Text>
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
        display: 'none'
    },
    rankCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
    },
    rankHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankInfo: {
        flex: 1,
        marginLeft: 16,
    },
    rankLevel: {
        fontSize: 10,
        fontWeight: '900',
        color: colors.textSecondary,
        letterSpacing: 1.5,
    },
    rankName: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 6,
    },
    xpBarBg: {
        height: 6,
        backgroundColor: colors.background,
        borderRadius: 3,
        marginBottom: 4,
    },
    xpBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    xpText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
        position: 'absolute',
        top: -10,
        right: -10,
    },
    streakBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.text,
        marginLeft: 4,
    },
    mdCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    mdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    mdTitleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    mdTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    mdScoreBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    mdScoreValue: {
        fontSize: 18,
        fontWeight: '900',
    },
    mdTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    mdTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
        borderWidth: 1,
        borderColor: colors.border,
    },
    mdTagText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    mdEmptyText: {
        fontSize: 12,
        fontStyle: 'italic',
        color: colors.textSecondary,
        marginBottom: 8,
    },
    mdBarBg: {
        height: 8,
        backgroundColor: colors.background,
        borderRadius: 4,
        overflow: 'hidden',
    },
    mdBarFill: {
        height: '100%',
        borderRadius: 4,
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
    tipCard: {
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        borderRadius: 20,
        padding: 20,
        marginTop: 20,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.accent,
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.accent,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    tipContent: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
        fontStyle: 'italic',
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
    // Gamification Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        padding: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.text,
    },
    modalSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 24,
        lineHeight: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    legendIconBg: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    legendTextContainer: {
        flex: 1,
    },
    legendAction: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    legendPoints: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.primary,
        marginTop: 2,
    },
    sectionMiniLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    levelRowBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelRowName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    levelRowDetail: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    levelRowXP: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.primary,
    },
    modalCloseBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    modalCloseBtnText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '900',
    },
    levelUpCard: {
        backgroundColor: colors.card,
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.accent,
    },
    levelUpTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.accent,
        marginBottom: 8,
    },
    levelUpText: {
        fontSize: 16,
        color: colors.textSecondary,
    },
    levelUpRank: {
        fontSize: 24,
        fontWeight: '800',
        marginVertical: 12,
    },
    levelUpBadge: {
        backgroundColor: colors.background,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    levelUpBadgeText: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
});

export default DashboardScreen;
