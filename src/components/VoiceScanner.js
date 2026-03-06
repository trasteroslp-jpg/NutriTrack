import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, Dimensions, TextInput, ScrollView, Animated, Easing, Vibration } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Mic, X, Check, RotateCcw, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { r } from '../utils/formatNumber';
import { useApp } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import { sanitizeNumber } from '../utils/sanitize';

import { auth } from '../config/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// CONFIG
const CLOUD_FUNCTION_URL = "https://us-central1-nutritrack-327c1.cloudfunctions.net/analyzeWithGemini";

const VoiceScanner = ({ visible, onClose }) => {
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [transcript, setTranscript] = useState("");
    const [processingStep, setProcessingStep] = useState(0); // 0: Idle, 1: Listening, 2: Transcribing, 3: Analyzing
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const { addMeal, addToGlobalCatalogue, trackAIUsage } = useApp();

    // Animations for Waveform
    const animValues = useRef([...Array(8)].map(() => new Animated.Value(0.2))).current;

    // Limpieza al desmontar
    useEffect(() => {
        if (isRecording) {
            startWaveformAnim();
        } else {
            stopWaveformAnim();
        }
    }, [isRecording]);

    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync().catch(() => { });
            }
        };
    }, []);

    const startWaveformAnim = () => {
        animValues.forEach((anim, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 0.8 + Math.random() * 0.2,
                        duration: 400 + Math.random() * 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0.2,
                        duration: 400 + Math.random() * 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        });
    };

    const stopWaveformAnim = () => {
        animValues.forEach(anim => {
            anim.stopAnimation();
            Animated.timing(anim, { toValue: 0.2, duration: 300, useNativeDriver: true }).start();
        });
    };

    const startRecording = async () => {
        try {
            // Limpiar grabaciones previas si existen o quedaron colgadas
            try {
                if (recording) {
                    await recording.stopAndUnloadAsync();
                }
            } catch (e) { }

            setRecording(null);

            if (!permissionResponse || permissionResponse.status !== 'granted') {
                const res = await requestPermission();
                if (res.status !== 'granted') return;
            }

            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });

            const { recording: newRecording } = await Audio.Recording.createAsync(
                Audio.RecordingOptionsPresets.HIGH_QUALITY
            );

            setRecording(newRecording);
            setIsRecording(true);
            Vibration.vibrate(100); // Start listening haptic
            setProcessingStep(1); // Listening
            setAnalysisResult(null);
            setTranscript("");
        } catch (err) {
            console.error('Failed to start recording', err);
            setRecording(null);
            setIsRecording(false);
            Alert.alert("Error", "No se pudo iniciar la grabación.");
        }
    };

    const stopRecording = async () => {
        if (!recording) return;
        try {
            setIsRecording(false);
            const status = await recording.getStatusAsync();
            if (status.canRecord) {
                await recording.stopAndUnloadAsync();
                const uri = recording.getURI();
                setRecording(null);
                setProcessingStep(2);
                if (uri) analyzeAudio(uri);
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            setRecording(null);
        }
    };

    const analyzeAudio = async (uri) => {
        setIsAnalyzing(true);
        setProcessingStep(2); // Analyzing
        try {
            const currentUser = auth.currentUser;
            let token = "";
            if (currentUser) {
                token = await currentUser.getIdToken(true);
            } else {
                throw new Error("Sesión no válida. Por favor, reinicia sesión.");
            }

            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const response = await fetch(CLOUD_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'audio',
                    mimeType: 'audio/mp4',
                    data: base64Audio
                })
            });

            const data = await response.json();

            if (data.error) {
                const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
                throw new Error(errorMsg || "Error en el servidor de análisis");
            }

            if (data.usage) {
                trackAIUsage('VoiceScanner', data.usage.promptTokens, data.usage.responseTokens);
            }

            const { transcript, items } = data.result;

            if (!transcript || !items) {
                throw new Error("La IA no devolvió el formato esperado.");
            }

            setTranscript(transcript);
            setProcessingStep(3);

            // Calcular ratios por gramo para edición proporcional
            const withRatios = items.map(item => {
                const w = item.weight || 100;
                return {
                    ...item,
                    originalWeight: w,
                    calPerGram: item.calories / w,
                    protPerGram: item.protein / w,
                    carbsPerGram: item.carbs / w,
                    fatPerGram: item.fat / w,
                };
            });

            setAnalysisResult(withRatios);
            Vibration.vibrate([0, 100, 50, 100]); // Success pattern
        } catch (e) {
            console.error(e);
            Alert.alert("Error de IA", e.message || "No se pudo analizar el voz.");
        } finally {
            setIsAnalyzing(false);
            if (processingStep === 2) setProcessingStep(0);
        }
    };

    const updateItemWeight = (index, newWeightStr) => {
        const newWeight = parseFloat(newWeightStr) || 0;
        setAnalysisResult(prev => prev.map((item, i) => {
            if (i !== index) return item;
            return {
                ...item,
                weight: newWeight,
                calories: Math.round(newWeight * item.calPerGram),
                protein: Math.round(newWeight * item.protPerGram * 10) / 10,
                carbs: Math.round(newWeight * item.carbsPerGram * 10) / 10,
                fat: Math.round(newWeight * item.fatPerGram * 10) / 10,
            };
        }));
    };

    const confirmAndAdd = () => {
        analysisResult.forEach(item => {
            addMeal({
                title: item.name,
                type: 'Voz (IA)',
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                grams: item.weight
            });

            // Alimentar la base de datos global (normalizar por 100g)
            const ratio = 100 / (item.weight || 100);
            addToGlobalCatalogue({
                name: item.name,
                calories: Math.round(item.calories * ratio),
                protein: Math.round(item.protein * ratio),
                carbs: Math.round(item.carbs * ratio),
                fat: Math.round(item.fat * ratio),
                category: 'Voz (AI)'
            });
        });
        Alert.alert('¡Éxito!', 'Alimentos añadidos correctamente.');
        onClose();
        setAnalysisResult(null);
        setTranscript("");
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={[styles.container, analysisResult && styles.containerExpanded]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>IA Voice Logging</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {!analysisResult ? (
                            <View style={styles.micCard}>
                                <View style={styles.waveformContainer}>
                                    {animValues.map((anim, i) => (
                                        <Animated.View
                                            key={i}
                                            style={[
                                                styles.waveformBar,
                                                { transform: [{ scaleY: anim }] }
                                            ]}
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity
                                    style={[styles.micButton, isRecording && styles.micButtonActive]}
                                    onLongPress={startRecording}
                                    onPressOut={stopRecording}
                                    delayLongPress={50}
                                >
                                    <LinearGradient
                                        colors={isRecording ? ['#FF4D4D', '#EF4444'] : [colors.primary, '#059669']}
                                        style={styles.micGradient}
                                    >
                                        <Mic size={40} color={colors.white} />
                                    </LinearGradient>
                                </TouchableOpacity>

                                {isRecording && (
                                    <View style={styles.listeningOverlay}>
                                        <Text style={styles.listeningText}>Escuchando...</Text>
                                        <Text style={styles.listeningSub}>"Dime qué has comido hoy"</Text>
                                    </View>
                                )}

                                {!isRecording && !isAnalyzing && (
                                    <View style={styles.idleContainer}>
                                        <Text style={styles.micStatus}>Mantén pulsado para hablar</Text>
                                        <Text style={styles.micHint}>
                                            "Acompaña cada alimento con su ración o peso aproximado"
                                        </Text>
                                    </View>
                                )}

                                {isAnalyzing && (
                                    <View style={styles.analyzingBox}>
                                        <View style={styles.aiSphere}>
                                            <Sparkles size={24} color={colors.primary} />
                                        </View>
                                        <Text style={styles.analyzingText}>
                                            {processingStep === 2 ? "Transcribiendo audio..." : "Analizando nutrición con IA..."}
                                        </Text>
                                        <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.resultBox}>
                                <View style={styles.transcriptBox}>
                                    <Text style={styles.transcriptLabel}>Transcripción IA</Text>
                                    <Text style={styles.transcriptText}>"{transcript}"</Text>
                                </View>

                                <View style={styles.resultHeader}>
                                    <Sparkles size={20} color={colors.primary} />
                                    <Text style={styles.resultTitle}>Desglose Nutricional</Text>
                                </View>

                                <ScrollView style={styles.resultList} showsVerticalScrollIndicator={false}>
                                    {analysisResult.map((item, idx) => (
                                        <View key={idx} style={styles.resultItem}>
                                            <View style={styles.itemHeader}>
                                                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                                <Text style={styles.itemCalories}>{r(item.calories)} kcal</Text>
                                            </View>

                                            <View style={styles.itemEditRow}>
                                                <View style={styles.weightEditWrapper}>
                                                    <TextInput
                                                        style={styles.weightEditInput}
                                                        value={item.weight.toString()}
                                                        onChangeText={(val) => updateItemWeight(idx, sanitizeNumber(val))}
                                                        keyboardType="numeric"
                                                        selectTextOnFocus
                                                    />
                                                    <Text style={styles.weightEditUnit}>g</Text>
                                                </View>
                                                <View style={styles.macroChips}>
                                                    <View style={[styles.macroChip, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
                                                        <Text style={[styles.macroChipText, { color: '#EF4444' }]}>P:{r(item.protein)}</Text>
                                                    </View>
                                                    <View style={[styles.macroChip, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
                                                        <Text style={[styles.macroChipText, { color: '#F59E0B' }]}>C:{r(item.carbs)}</Text>
                                                    </View>
                                                    <View style={[styles.macroChip, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
                                                        <Text style={[styles.macroChipText, { color: '#3B82F6' }]}>G:{r(item.fat)}</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>

                                <View style={styles.footerBtns}>
                                    <TouchableOpacity style={styles.retryBtn} onPress={() => setAnalysisResult(null)}>
                                        <RotateCcw size={18} color={colors.textSecondary} />
                                        <Text style={styles.retryText}>Repetir</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.confirmBtn} onPress={confirmAndAdd}>
                                        <Check size={18} color={colors.white} style={{ marginRight: 6 }} />
                                        <Text style={styles.confirmText}>Añadir Todo</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: colors.card,
        borderRadius: 40,
        padding: 24,
        borderWidth: 1,
        borderColor: colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 30,
        elevation: 10
    },
    containerExpanded: {
        maxHeight: SCREEN_HEIGHT * 0.85,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
        letterSpacing: -0.5
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300
    },
    micCard: {
        alignItems: 'center',
        width: '100%'
    },
    waveformContainer: {
        flexDirection: 'row',
        height: 60,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 30
    },
    waveformBar: {
        width: 4,
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 2
    },
    micButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        padding: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30
    },
    micGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15
    },
    listeningOverlay: {
        alignItems: 'center'
    },
    listeningText: {
        color: '#EF4444',
        fontSize: 18,
        fontWeight: '900',
        marginBottom: 5
    },
    listeningSub: {
        color: colors.textSecondary,
        fontSize: 14,
        fontWeight: '600'
    },
    idleContainer: {
        alignItems: 'center'
    },
    micStatus: {
        color: colors.text,
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 10
    },
    micHint: {
        color: colors.textSecondary,
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 30
    },
    analyzingBox: {
        alignItems: 'center'
    },
    aiSphere: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.primary
    },
    analyzingText: {
        color: colors.primary,
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center'
    },
    transcriptBox: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: 15,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    transcriptLabel: {
        color: colors.textSecondary,
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        marginBottom: 5,
        letterSpacing: 1
    },
    transcriptText: {
        color: colors.text,
        fontSize: 15,
        fontStyle: 'italic',
        lineHeight: 22
    },
    resultBox: {
        width: '100%'
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 15,
        paddingLeft: 5
    },
    resultTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: colors.text
    },
    resultList: {
        maxHeight: SCREEN_HEIGHT * 0.4,
        marginBottom: 25
    },
    resultItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 15,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    itemName: {
        color: colors.text,
        fontWeight: '800',
        fontSize: 16,
        flex: 1
    },
    itemCalories: {
        color: colors.primary,
        fontWeight: '900',
        fontSize: 16
    },
    itemEditRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    weightEditWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 38
    },
    weightEditInput: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.text,
        minWidth: 45,
        textAlign: 'right'
    },
    weightEditUnit: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 13,
        marginLeft: 3
    },
    macroChips: {
        flexDirection: 'row',
        gap: 6
    },
    macroChip: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    macroChipText: {
        fontSize: 11,
        fontWeight: '800'
    },
    footerBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 15
    },
    retryText: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 15
    },
    confirmBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8
    },
    confirmText: {
        color: colors.white,
        fontWeight: '900',
        fontSize: 16
    }
});

export default VoiceScanner;
