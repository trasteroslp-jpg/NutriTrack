import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, ScrollView, TextInput, TouchableOpacity, FlatList, Dimensions, Alert } from 'react-native';
import Svg, { Circle, G, Rect, Text as SvgText, Line, Polyline, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import { TrendingUp, Award, Calendar, Search, ChevronDown, ChevronUp, Scale, Save, Plus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Gráfico de barras personalizado con SVG (sin bugs de re-render) ──
const CalorieBarChart = ({ data, goalCalories, width }) => {
    const chartWidth = width - 72;
    const chartHeight = 180;
    const paddingLeft = 38;
    const paddingBottom = 28;
    const paddingTop = 20;
    const innerWidth = chartWidth - paddingLeft - 10;
    const innerHeight = chartHeight - paddingBottom - paddingTop;

    const maxVal = Math.max(goalCalories, ...data.map(d => d.calories), 1);
    const barCount = data.length;
    const barWidth = Math.min(28, (innerWidth / barCount) * 0.55);
    const gap = (innerWidth - barWidth * barCount) / (barCount + 1);

    // Líneas de referencia
    const sections = 4;
    const yLines = Array.from({ length: sections + 1 }, (_, i) => i);

    return (
        <Svg width={chartWidth} height={chartHeight}>
            {/* Líneas horizontales de referencia */}
            {yLines.map(i => {
                const y = paddingTop + innerHeight - (i / sections) * innerHeight;
                const val = Math.round((i / sections) * maxVal);
                return (
                    <G key={i}>
                        <Rect
                            x={paddingLeft}
                            y={y}
                            width={innerWidth}
                            height={0.5}
                            fill={colors.border}
                            opacity={0.6}
                        />
                        <SvgText
                            x={paddingLeft - 4}
                            y={y + 4}
                            fontSize={9}
                            fill={colors.textSecondary}
                            textAnchor="end"
                        >
                            {val > 0 ? val : ''}
                        </SvgText>
                    </G>
                );
            })}

            {/* Línea de meta */}
            {goalCalories > 0 && (() => {
                const goalY = paddingTop + innerHeight - (goalCalories / maxVal) * innerHeight;
                return (
                    <Rect
                        x={paddingLeft}
                        y={goalY}
                        width={innerWidth}
                        height={1.5}
                        fill={colors.accent || '#FF9800'}
                        opacity={0.7}
                    />
                );
            })()}

            {/* Barras */}
            {data.map((d, i) => {
                const barHeight = d.calories > 0 ? Math.max(4, (d.calories / maxVal) * innerHeight) : 0;
                const x = paddingLeft + gap + i * (barWidth + gap);
                const y = paddingTop + innerHeight - barHeight;
                const isOverGoal = d.calories > goalCalories;

                return (
                    <G key={`bar-${i}`}>
                        {/* Barra */}
                        <Rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx={4}
                            fill={isOverGoal ? (colors.accent || '#FF9800') : colors.primary}
                            opacity={0.85}
                        />
                        {/* Valor encima */}
                        {d.calories > 0 && (
                            <SvgText
                                x={x + barWidth / 2}
                                y={y - 4}
                                fontSize={9}
                                fill={colors.primary}
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {d.calories}
                            </SvgText>
                        )}
                        {/* Etiqueta del día */}
                        <SvgText
                            x={x + barWidth / 2}
                            y={chartHeight - 6}
                            fontSize={10}
                            fill={colors.textSecondary}
                            textAnchor="middle"
                        >
                            {d.day || ''}
                        </SvgText>
                    </G>
                );
            })}
        </Svg>
    );
};

const ProgressScreen = () => {
    const { getStatsForRange, user, weightHistory, logWeight } = useApp();
    const { width } = useWindowDimensions();
    const [weightInput, setWeightInput] = useState(user.weight?.toString() || '');

    const getMonday = (d) => {
        d = new Date(d);
        const day = d.getDay(),
            diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    };

    const today = new Date();
    const monday = getMonday(today);

    // Main navigation states
    const [currentWeekStart, setCurrentWeekStart] = useState(monday);
    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
    const [filteredStats, setFilteredStats] = useState([]);
    const [isTableExpanded, setIsTableExpanded] = useState(false);

    // Derived dates for filtering
    const startDateStr = currentWeekStart.toISOString().split('T')[0];
    const endDate = new Date(currentWeekStart);
    endDate.setDate(endDate.getDate() + 6);
    const endDateStr = endDate.toISOString().split('T')[0];

    // Generate week days for the selector (always 7 days from currentWeekStart)
    const weekDays = [];
    let curr = new Date(currentWeekStart);
    for (let i = 0; i < 7; i++) {
        const dStr = curr.toISOString().split('T')[0];
        const dayData = getStatsForRange(dStr, dStr)[0] || { protein: 0, carbs: 0, fat: 0, calories: 0 };

        weekDays.push({
            date: dStr,
            label: curr.toLocaleDateString('es-ES', { weekday: 'narrow' }),
            dayNum: curr.getDate(),
            stats: dayData,
            month: curr.toLocaleDateString('es-ES', { month: 'short' }),
            year: curr.getFullYear()
        });
        curr.setDate(curr.getDate() + 1);
    }

    useEffect(() => {
        const stats = getStatsForRange(startDateStr, endDateStr);
        setFilteredStats(stats);
    }, [currentWeekStart]);

    const calChartData = filteredStats.map(d => ({
        value: d.calories,
        label: d.day,
        topLabelComponent: () => (
            <Text style={{ color: colors.primary, fontSize: 10, marginBottom: 4 }}>{d.calories > 0 ? d.calories : ''}</Text>
        ),
        frontColor: colors.primary + '80',
        gradientColor: colors.primary,
    }));

    // Calculate goals in grams
    const proteinGoal = Math.round((user.goalCalories * (user.macros.protein / 100)) / 4);
    const carbsGoal = Math.round((user.goalCalories * (user.macros.carbs / 100)) / 4);
    const fatGoal = Math.round((user.goalCalories * (user.macros.fat / 100)) / 9);
    const selectedDayData = filteredStats.find(d => d.date === selectedDate) || { protein: 0, carbs: 0, fat: 0, calories: 0 };

    const macroStackData = filteredStats.map(d => ({
        stacks: [
            { value: d.protein || 0, color: colors.macronutrients.protein },
            { value: d.carbs || 0, color: colors.macronutrients.carbs },
            { value: d.fat || 0, color: colors.macronutrients.fat },
        ],
        label: d.day,
    }));

    const macroRingsData = [
        { progress: Math.min((selectedDayData.carbs || 0) / (carbsGoal || 1), 1.2), color: colors.macronutrients.carbs, label: 'Carbs' },
        { progress: Math.min((selectedDayData.protein || 0) / (proteinGoal || 1), 1.2), color: colors.macronutrients.protein, label: 'Prot' },
        { progress: Math.min((selectedDayData.fat || 0) / (fatGoal || 1), 1.2), color: colors.macronutrients.fat, label: 'Grasa' },
    ];

    const totalCalories = filteredStats.reduce((sum, d) => sum + d.calories, 0);
    const avgCalories = filteredStats.length > 0 ? Math.round(totalCalories / filteredStats.length) : 0;

    // Calculate goal achievement
    const daysMetGoal = filteredStats.filter(d => d.calories <= user.goalCalories && d.calories > 0).length;
    const achievementRate = filteredStats.length > 0 ? Math.round((daysMetGoal / filteredStats.length) * 100) : 0;

    const isManualScroll = React.useRef(true);

    const handleMomentumScrollEnd = (event) => {
        if (!isManualScroll.current) {
            isManualScroll.current = true;
            return;
        }
        const scrollX = event.nativeEvent.contentOffset.x;
        const cardWidth = width - 72; // Ancho real de la tarjeta interna
        const index = Math.round(scrollX / cardWidth);
        if (weekDays[index] && weekDays[index].date !== selectedDate) {
            setSelectedDate(weekDays[index].date);
        }
    };

    const handleDayPress = (date) => {
        isManualScroll.current = false;
        setSelectedDate(date);
    };

    const changeWeek = (direction) => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
        setCurrentWeekStart(newStart);

        // Sync selected date to the same day of the work week
        const oldSelected = new Date(selectedDate);
        const dayDiff = (oldSelected.getDay() + 6) % 7; // Monday = 0
        const newSelected = new Date(newStart);
        newSelected.setDate(newSelected.getDate() + dayDiff);
        setSelectedDate(newSelected.toISOString().split('T')[0]);
    };


    const flatListRef = React.useRef(null);

    const handleLogWeight = () => {
        const w = parseFloat(weightInput);
        if (isNaN(w) || w <= 0) {
            Alert.alert('Error', 'Introduce un peso válido');
            return;
        }
        logWeight(w);
        Alert.alert('¡Registrado!', `Tu peso de ${w}kg ha sido guardado.`);
    };

    useEffect(() => {
        const index = weekDays.findIndex(d => d.date === selectedDate);
        if (index !== -1 && flatListRef.current) {
            flatListRef.current.scrollToIndex({ index, animated: true });
        }
    }, [selectedDate]);

    return (
        <ScrollView style={styles.container}>
            {/* Week Navigator - Arriba del todo */}
            <View style={styles.weekNavCard}>
                <TouchableOpacity onPress={() => changeWeek('prev')} style={styles.weekNavBtn}>
                    <ChevronDown size={24} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
                <View style={styles.weekInfo}>
                    <Calendar size={18} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.weekText}>
                        {weekDays[0].dayNum} {weekDays[0].month} - {weekDays[6].dayNum} {weekDays[6].month} {weekDays[6].year}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => changeWeek('next')} style={styles.weekNavBtn}>
                    <ChevronDown size={24} color={colors.primary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>
            </View>

            {/* Day Selector - Apple Style with Mini Rings */}
            <View style={styles.daySelectorContainer}>
                {weekDays.map((wd, index) => {
                    const miniRingsData = [
                        { progress: Math.min((wd.stats.carbs || 0) / (carbsGoal || 1), 1), color: colors.macronutrients.carbs },
                        { progress: Math.min((wd.stats.protein || 0) / (proteinGoal || 1), 1), color: colors.macronutrients.protein },
                        { progress: Math.min((wd.stats.fat || 0) / (fatGoal || 1), 1), color: colors.macronutrients.fat },
                    ];

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.dayItem, selectedDate === wd.date && styles.dayItemActive]}
                            onPress={() => handleDayPress(wd.date)}
                        >
                            <Text style={[styles.dayLabel, selectedDate === wd.date && styles.dayLabelActive]}>{wd.label}</Text>
                            <View style={styles.miniRingWrapper}>
                                <MacroRings data={miniRingsData} size={28} strokeWidth={3} spacing={1} />
                                {selectedDate === wd.date && (
                                    <View style={styles.activeDayIndicator} />
                                )}
                            </View>
                            <Text style={[styles.dayNumber, selectedDate === wd.date && styles.dayNumberActive]}>{wd.dayNum}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Swipeable Macro Rings Section */}
            <View style={styles.ringsCard}>
                <View style={styles.ringsHeader}>
                    <Text style={styles.ringsTitle}>Consecución Diaria</Text>
                    <Text style={styles.ringsDate}>{new Date(selectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</Text>
                </View>

                <FlatList
                    ref={flatListRef}
                    data={weekDays}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onMomentumScrollEnd={handleMomentumScrollEnd}
                    scrollEventThrottle={16}
                    getItemLayout={(data, index) => ({
                        length: width - 72,
                        offset: (width - 72) * index,
                        index
                    })}
                    renderItem={({ item }) => {
                        const dayStats = item.stats;
                        const ringData = [
                            { progress: Math.min((dayStats.carbs || 0) / (carbsGoal || 1), 1.2), color: colors.macronutrients.carbs, label: 'Carbs' },
                            { progress: Math.min((dayStats.protein || 0) / (proteinGoal || 1), 1.2), color: colors.macronutrients.protein, label: 'Prot' },
                            { progress: Math.min((dayStats.fat || 0) / (fatGoal || 1), 1.2), color: colors.macronutrients.fat, label: 'Grasa' },
                        ];

                        return (
                            <View style={[styles.ringsRow, { width: width - 72 }]}>
                                <View style={styles.ringsWrapper}>
                                    <MacroRings data={ringData} size={150} />
                                </View>

                                <View style={styles.ringsLegend}>
                                    {ringData.map((item, i) => (
                                        <View key={i} style={styles.legendItemSmall}>
                                            <View style={[styles.dotSmall, { backgroundColor: item.color }]} />
                                            <View>
                                                <Text style={styles.legendLabel}>{item.label}</Text>
                                                <Text style={styles.legendPercent}>{Math.round(item.progress * 100)}%</Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </View>
                        );
                    }}
                    keyExtractor={(item) => item.date}
                />
            </View>

            {/* Calorie Chart - Custom SVG (sin bugs de re-render) */}
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <TrendingUp size={18} color={colors.primary} />
                    <Text style={styles.chartTitle}>Calorías Consumidas</Text>
                </View>
                {filteredStats.length > 0 ? (
                    <CalorieBarChart
                        key={`cal-${startDateStr}-${endDateStr}`}
                        data={filteredStats}
                        goalCalories={user.goalCalories}
                        width={width}
                    />
                ) : (
                    <Text style={styles.emptyText}>No hay datos para este período</Text>
                )}
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <TrendingUp size={24} color={colors.secondary} />
                    <Text style={styles.statValue}>{avgCalories}</Text>
                    <Text style={styles.statLabel}>Promedio Diario</Text>
                </View>
                <View style={styles.statBox}>
                    <Award size={24} color={colors.accent} />
                    <Text style={styles.statValue}>{achievementRate}%</Text>
                    <Text style={styles.statLabel}>Meta Cumplida</Text>
                </View>
            </View>

            {/* Control de Peso - NUEVO en v1.1 */}
            <View style={styles.weightLogCard}>
                <View style={styles.chartHeader}>
                    <Scale size={18} color={colors.primary} />
                    <Text style={styles.chartTitle}>Control de Peso</Text>
                </View>

                <View style={styles.weightInputRow}>
                    <View style={styles.weightInputWrapper}>
                        <TextInput
                            style={styles.weightTextInput}
                            value={weightInput}
                            onChangeText={setWeightInput}
                            placeholder="Ej: 75.5"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="numeric"
                        />
                        <Text style={styles.kgBadge}>kg</Text>
                    </View>
                    <TouchableOpacity style={styles.logWeightButton} onPress={handleLogWeight}>
                        <Plus size={20} color={colors.white} />
                        <Text style={styles.logWeightButtonText}>Registrar</Text>
                    </TouchableOpacity>
                </View>

                {weightHistory.length > 0 && (() => {
                    const sorted = [...weightHistory].sort((a, b) => a.date > b.date ? 1 : -1).slice(-10);
                    const chartW = width - 100;
                    const chartH = 160;
                    const padL = 45;
                    const padR = 15;
                    const padT = 15;
                    const padB = 35;
                    const innerW = chartW - padL - padR;
                    const innerH = chartH - padT - padB;
                    const weights = sorted.map(s => s.weight);
                    const minW = Math.min(...weights) - 1;
                    const maxW = Math.max(...weights) + 1;
                    const range = maxW - minW || 1;

                    const points = sorted.map((item, i) => ({
                        x: padL + (sorted.length > 1 ? (i / (sorted.length - 1)) * innerW : innerW / 2),
                        y: padT + innerH - ((item.weight - minW) / range) * innerH,
                        date: item.date,
                        weight: item.weight,
                    }));
                    const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');
                    const polygonPoints = `${points[0].x},${padT + innerH} ${polylinePoints} ${points[points.length - 1].x},${padT + innerH}`;

                    return (
                        <View style={styles.miniHistory}>
                            <Text style={styles.miniHistoryTitle}>Evolución de Peso</Text>
                            <Svg width={chartW} height={chartH}>
                                <Defs>
                                    <LinearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                                        <Stop offset="0" stopColor={colors.primary} stopOpacity="0.3" />
                                        <Stop offset="1" stopColor={colors.primary} stopOpacity="0.02" />
                                    </LinearGradient>
                                </Defs>
                                {/* Grid lines */}
                                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                                    const yy = padT + innerH - pct * innerH;
                                    const val = (minW + pct * range).toFixed(1);
                                    return (
                                        <G key={i}>
                                            <Line x1={padL} y1={yy} x2={padL + innerW} y2={yy} stroke={colors.border} strokeWidth="1" strokeDasharray="4,4" />
                                            <SvgText x={padL - 8} y={yy + 4} fontSize="10" fill={colors.textSecondary} textAnchor="end">{val}</SvgText>
                                        </G>
                                    );
                                })}
                                {/* Area fill */}
                                <Polygon points={polygonPoints} fill="url(#weightFill)" />
                                {/* Line */}
                                <Polyline points={polylinePoints} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                {/* Points + date labels */}
                                {points.map((p, i) => {
                                    const dateLabel = p.date.slice(5).replace('-', '/');
                                    return (
                                        <G key={i}>
                                            <Circle cx={p.x} cy={p.y} r="4" fill={colors.primary} stroke={colors.card} strokeWidth="2" />
                                            <SvgText x={p.x} y={chartH - 5} fontSize="8" fill={colors.textSecondary} textAnchor="middle">{dateLabel}</SvgText>
                                        </G>
                                    );
                                })}
                            </Svg>
                            {/* Summary row */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Actual: <Text style={{ fontWeight: '700', color: colors.primary }}>{sorted[sorted.length - 1].weight} kg</Text></Text>
                                {sorted.length > 1 && (() => {
                                    const diff = (sorted[sorted.length - 1].weight - sorted[0].weight).toFixed(1);
                                    const diffColor = diff > 0 ? colors.danger : colors.primary;
                                    return <Text style={{ fontSize: 12, color: colors.textSecondary }}>Cambio: <Text style={{ fontWeight: '700', color: diffColor }}>{diff > 0 ? '+' : ''}{diff} kg</Text></Text>;
                                })()}
                            </View>
                        </View>
                    );
                })()}
            </View>

            {/* Collapsible Table */}
            <View style={styles.weightCard}>
                <TouchableOpacity
                    style={styles.collapsibleHeader}
                    onPress={() => setIsTableExpanded(!isTableExpanded)}
                >
                    <Text style={styles.chartTitle}>Tabla de Registros</Text>
                    {isTableExpanded ? <ChevronUp size={20} color={colors.textSecondary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
                </TouchableOpacity>

                {isTableExpanded && (
                    <View style={styles.tableContent}>
                        <View style={styles.tableHeaderRow}>
                            <Text style={styles.tableHead}>Fecha</Text>
                            <Text style={styles.tableHead}>Calorías</Text>
                            <Text style={styles.tableHead}>P/C/G</Text>
                        </View>
                        {filteredStats.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.tableCellDate}>{item.day}</Text>
                                    <Text style={styles.tableCellSubDate}>{item.date}</Text>
                                </View>
                                <Text style={[styles.tableCellCal, { flex: 1, color: item.calories > user.goalCalories ? colors.danger : colors.primary }]}>
                                    {item.calories} kcal
                                </Text>
                                <Text style={styles.tableCellMacros}>
                                    {Math.round(item.protein || 0)}/{Math.round(item.carbs || 0)}/{Math.round(item.fat || 0)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
};

const MacroRings = ({ data, size, strokeWidth = 14, spacing = 4 }) => {
    const center = size / 2;

    return (
        <Svg width={size} height={size}>
            <G rotation="-90" origin={`${center}, ${center}`}>
                {data.map((item, index) => {
                    const radius = (size / 2) - (index * (strokeWidth + spacing)) - (strokeWidth / 2);
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference - (item.progress * circumference);

                    return (
                        <G key={index}>
                            <Circle
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                strokeOpacity={0.15}
                                fill="none"
                            />
                            <Circle
                                cx={center}
                                cy={center}
                                r={radius}
                                stroke={item.color}
                                strokeWidth={strokeWidth}
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                fill="none"
                            />
                        </G>
                    );
                })}
            </G>
        </Svg>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    daySelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    dayItem: {
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    dayLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 8,
        fontWeight: '700',
    },
    dayLabelActive: {
        color: colors.text,
    },
    miniRingWrapper: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    activeDayIndicator: {
        position: 'absolute',
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 2,
        borderColor: colors.primary,
        zIndex: -1,
    },
    dayNumber: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    dayNumberActive: {
        color: colors.white,
        fontWeight: '800',
    },
    ringsCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ringsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    ringsTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    ringsDate: {
        fontSize: 12,
        color: colors.textSecondary,
        textTransform: 'capitalize',
    },
    ringsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    ringsWrapper: {
        width: 160,
        height: 160,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringsLegend: {
        justifyContent: 'center',
    },
    legendItemSmall: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dotSmall: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 10,
    },
    legendLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    legendPercent: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '800',
    },
    filterCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    filterHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    filterTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginLeft: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    inputWrapper: {
        flex: 1,
        marginRight: 10,
    },
    inputLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    dateInput: {
        backgroundColor: colors.background,
        borderRadius: 8,
        padding: 8,
        fontSize: 14,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchButton: {
        backgroundColor: colors.primary,
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    chartCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    weekNavCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginTop: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    weekNavBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    weekText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    chartWrapper: {
        paddingTop: 20,
        paddingBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 5,
    },
    legendText: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    chartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginLeft: 8,
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: colors.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    statBox: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        width: (SCREEN_WIDTH - 48) / 2,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        marginVertical: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    weightCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableHead: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        flex: 1,
    },
    tableCellDate: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    tableCellSubDate: {
        fontSize: 10,
        color: colors.textSecondary,
    },
    tableCellCal: {
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    tableCellMacros: {
        fontSize: 11,
        color: colors.textSecondary,
        flex: 1,
        textAlign: 'right',
    },
    collapsibleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    macroGoalsInfo: {
        marginTop: 10,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 10,
    },
    goalInfoText: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    weightLogCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    weightInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 20,
    },
    weightInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    weightTextInput: {
        flex: 1,
        height: 48,
        color: colors.text,
        fontSize: 16,
        fontWeight: '600',
    },
    kgBadge: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 14,
    },
    logWeightButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    logWeightButtonText: {
        color: colors.white,
        fontWeight: '700',
        marginLeft: 6,
    },
    miniHistory: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 16,
        padding: 12,
    },
    miniHistoryTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    historyList: {
        gap: 8,
    },
    miniHistoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historyDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
        marginRight: 10,
    },
    historyDateText: {
        flex: 1,
        fontSize: 13,
        color: colors.text,
    },
    historyWeightText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
    },
});

export default ProgressScreen;
