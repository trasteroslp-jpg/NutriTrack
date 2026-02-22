import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, useWindowDimensions, Linking } from 'react-native';
import { Dumbbell, Award, ChevronRight, Info, Play, CheckCircle2, Circle } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { trainingExercises, weeklyTrainingPlan } from '../data/mockData';
import { useApp } from '../context/AppContext';

const TrainingScreen = () => {
    const { completedWorkouts, toggleWorkoutCompletion } = useApp();
    const { width } = useWindowDimensions();

    // Get today's ISO date string
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCompleted = completedWorkouts[todayStr] || [];

    const openVideo = (url) => {
        if (url) {
            Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    const renderExercise = ({ item }) => (
        <View style={styles.exerciseCard}>
            <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.name}</Text>
                <Text style={styles.exerciseDesc}>{item.description}</Text>
                <View style={styles.badgeRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.sets} series</Text>
                    </View>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.reps} reps</Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity
                style={styles.playButton}
                onPress={() => openVideo(item.videoUrl)}
            >
                <Play size={20} color={colors.white} fill={colors.white} />
                <Text style={styles.playText}>Ver Video</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerCard}>
                <View style={styles.headerTextContainer}>
                    <Text style={styles.headerTitle}>Mi Entrenamiento Semanal</Text>
                    <Text style={styles.headerSubtitle}>Sigue tu progreso y mejora tu técnica</Text>
                </View>
                <Dumbbell size={40} color={colors.white} />
            </View>

            <Text style={styles.sectionTitle}>Repertorio & Videoguía</Text>
            <FlatList
                data={trainingExercises}
                keyExtractor={(item) => item.id}
                renderItem={renderExercise}
                scrollEnabled={false}
                contentContainerStyle={styles.listContainer}
            />

            <Text style={styles.sectionTitle}>Plan Semanal Interactivo</Text>
            <View style={styles.planContainer}>
                {weeklyTrainingPlan.map((item, index) => {
                    const isDone = todayCompleted.includes(item.id);
                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.planItem, isDone && styles.planItemDone]}
                            onPress={() => toggleWorkoutCompletion(item.id)}
                        >
                            <View style={[styles.dayBadge, isDone && styles.dayBadgeDone]}>
                                <Text style={[styles.dayText, isDone && styles.dayTextDone]}>{item.day}</Text>
                            </View>
                            <Text style={[styles.focusText, isDone && styles.focusTextDone]}>{item.focus}</Text>
                            {isDone ? (
                                <CheckCircle2 size={24} color={colors.primary} />
                            ) : (
                                <Circle size={24} color={colors.border} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.tipCard}>
                <Info size={24} color={colors.primary} />
                <Text style={styles.tipText}>
                    Toca cada día para marcarlo como completado. ¡Usa los videos para corregir tu técnica!
                </Text>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        padding: 16,
    },
    headerCard: {
        backgroundColor: colors.primary,
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.white,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
        marginTop: 8,
    },
    listContainer: {
        marginBottom: 16,
    },
    exerciseCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    exerciseDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: 10,
    },
    badgeRow: {
        flexDirection: 'row',
    },
    badge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary,
    },
    playButton: {
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 90,
    },
    playText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
    },
    planContainer: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 8,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    planItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    planItemDone: {
        backgroundColor: colors.primaryLight,
    },
    dayBadge: {
        width: 80,
        paddingVertical: 4,
        backgroundColor: colors.background,
        borderRadius: 10,
        alignItems: 'center',
        marginRight: 15,
    },
    dayBadgeDone: {
        backgroundColor: colors.primary,
    },
    dayText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    dayTextDone: {
        color: colors.white,
    },
    focusText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    focusTextDone: {
        color: colors.primary,
        textDecorationLine: 'line-through',
    },
    tipCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    tipText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 13,
        color: colors.macronutrients.carbs,
        fontStyle: 'italic',
    },
});

export default TrainingScreen;
