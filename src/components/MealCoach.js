import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Sparkles, ChevronDown, ChevronUp, Target, Zap } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { r } from '../utils/formatNumber';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const MealCoach = ({ analysis }) => {
    const [expanded, setExpanded] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    if (!analysis) return null;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setExpanded(!expanded)}
                style={styles.coachCard}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                    style={styles.cardGradient}
                >
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                                <View style={styles.aiBadge}>
                                    <Sparkles size={14} color={colors.white} />
                                </View>
                            </Animated.View>
                            <Text style={styles.coachTitle}>NutriTrack Coach</Text>
                        </View>
                        <View style={[styles.scoreBadge, { backgroundColor: analysis.color + '20' }]}>
                            <Text style={[styles.scoreText, { color: analysis.color }]}>{analysis.scoring}</Text>
                        </View>
                    </View>

                    <Text style={styles.feedbackText}>
                        {analysis.feedback}
                    </Text>

                    <View style={styles.meterContainer}>
                        <View style={styles.meterTrack}>
                            <View style={[styles.meterSegment, { flex: 1, backgroundColor: '#F59E0B' }]} />
                            <View style={[styles.meterSegment, { flex: 1, backgroundColor: '#10B981' }]} />
                            <View style={[styles.meterSegment, { flex: 1, backgroundColor: '#EF4444' }]} />
                        </View>
                        <View style={[styles.pointer, { left: `${analysis.percent * 100}%` }]}>
                            <View style={[styles.pointerDot, { backgroundColor: analysis.color }]} />
                        </View>
                    </View>

                    {expanded && (
                        <View style={styles.details}>
                            <View style={styles.statsRow}>
                                <View style={styles.stat}>
                                    <Text style={styles.statLabel}>Calorías</Text>
                                    <Text style={styles.statValue}>{analysis.actual.calories} <Text style={styles.slash}>/</Text> {analysis.target.calories}</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={styles.statLabel}>Proteína</Text>
                                    <Text style={styles.statValue}>{r(analysis.actual.protein)}g <Text style={styles.slash}>/</Text> {r(analysis.target.protein)}g</Text>
                                </View>
                            </View>
                            <View style={styles.statsRow}>
                                <View style={styles.stat}>
                                    <Text style={styles.statLabel}>Carbohidratos</Text>
                                    <Text style={styles.statValue}>{r(analysis.actual.carbs)}g <Text style={styles.slash}>/</Text> {r(analysis.target.carbs)}g</Text>
                                </View>
                                <View style={styles.stat}>
                                    <Text style={styles.statLabel}>Grasas</Text>
                                    <Text style={styles.statValue}>{r(analysis.actual.fat)}g <Text style={styles.slash}>/</Text> {r(analysis.target.fat)}g</Text>
                                </View>
                            </View>
                            <View style={styles.tipContainer}>
                                <Zap size={16} color={colors.accent} />
                                <Text style={styles.tipText}>
                                    {analysis.tip || (analysis.status === 'high'
                                        ? "Tu cuerpo tiene energía de sobra. Trata de quemarla con actividad física."
                                        : analysis.status === 'low'
                                            ? "Para un mejor rendimiento, no dejes que tus depósitos bajen demasiado."
                                            : "¡Equilibrio perfecto! Estas elecciones son las que marcan la diferencia.")}
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.expandRow}>
                        {expanded ? <ChevronUp size={16} color={colors.textSecondary} /> : <ChevronDown size={16} color={colors.textSecondary} />}
                    </View>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

// Error fix: missing useRef
import { useRef } from 'react';

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    coachCard: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    cardGradient: {
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    aiBadge: {
        padding: 6,
        backgroundColor: colors.primary,
        borderRadius: 10,
    },
    coachTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.text,
        letterSpacing: 0.5,
    },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    scoreText: {
        fontSize: 11,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    feedbackText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
        fontWeight: '500',
        marginBottom: 16,
    },
    meterContainer: {
        height: 12,
        position: 'relative',
        justifyContent: 'center',
        marginBottom: 8,
    },
    meterTrack: {
        height: 6,
        flexDirection: 'row',
        borderRadius: 3,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    meterSegment: {
        height: '100%',
    },
    pointer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pointerDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors.white,
    },
    expandRow: {
        alignItems: 'center',
        marginTop: 4,
    },
    details: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    stat: {
        flex: 1,
    },
    statLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '700',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
    },
    slash: {
        color: colors.textSecondary,
        fontWeight: '400',
    },
    tipContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(245,158,11,0.05)',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        alignItems: 'center',
    },
    tipText: {
        flex: 1,
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 16,
        fontWeight: '600',
    }
});

export default MealCoach;
