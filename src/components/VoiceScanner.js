import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Mic, X, Check, RotateCcw, Sparkles } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// GEMINI CONFIG
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const VoiceScanner = ({ visible, onClose }) => {
    const [recording, setRecording] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const { addMeal } = useApp();

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if (recording) {
                recording.stopAndUnloadAsync().catch(() => { });
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            // Limpiar grabaciones previas si existen o quedaron colgadas
            try {
                const status = await recording?.getStatusAsync();
                if (status?.canRecord || status?.isDoneRecording) {
                    await recording.stopAndUnloadAsync();
                }
            } catch (e) { }

            setRecording(null);

            if (permissionResponse.status !== 'granted') {
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
            setAnalysisResult(null);
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
                if (uri) analyzeAudio(uri);
            }
        } catch (err) {
            console.error('Failed to stop recording', err);
            setRecording(null);
        }
    };

    const analyzeAudio = async (uri) => {
        setIsAnalyzing(true);
        try {
            if (!GEMINI_API_KEY) {
                throw new Error("API Key de Gemini no encontrada");
            }

            // Error de Base64 corregido usando string literal
            const base64Audio = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Analiza este audio donde el usuario describe lo que ha comido. Identifica los alimentos y estima sus gramos, calorías y macronutrientes (proteínas, carbohidratos, grasas). Responde SOLO en formato JSON plano como una lista de objetos: [{\"name\": \"...\", \"weight\": 100, \"calories\": 200, \"protein\": 10, \"carbs\": 20, \"fat\": 5}]" },
                            { inline_data: { mime_type: "audio/mp4", data: base64Audio } }
                        ]
                    }]
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || "Error en la API de Gemini");
            }

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error("No se pudo procesar el audio.");
            }

            const aiText = data.candidates[0].content.parts[0].text;
            const jsonStart = aiText.indexOf('[');
            const jsonEnd = aiText.lastIndexOf(']') + 1;

            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error("La IA no devolvió un formato válido.");
            }

            const result = JSON.parse(aiText.substring(jsonStart, jsonEnd));
            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
            Alert.alert("Error de IA", e.message || "No se pudo analizar el voz.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const confirmAndAdd = () => {
        analysisResult.forEach(item => {
            addMeal({
                title: item.name,
                type: 'Registro por Voz',
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fat: item.fat,
                grams: item.weight
            });
        });
        Alert.alert('¡Éxito!', 'Alimentos añadidos correctamente.');
        onClose();
        setAnalysisResult(null);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Registro por Voz</Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {!analysisResult ? (
                            <View style={styles.micCard}>
                                <TouchableOpacity
                                    style={[styles.micButton, isRecording && styles.micButtonActive]}
                                    onPressIn={startRecording}
                                    onPressOut={stopRecording}
                                >
                                    <View style={styles.micOuter}>
                                        <View style={[styles.micInner, isRecording && styles.micInnerActive]}>
                                            <Mic size={40} color={colors.white} />
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <Text style={styles.micStatus}>
                                    {isRecording ? "Suelte para finalizar" : "Mantenga pulsado para hablar"}
                                </Text>
                                <Text style={styles.micHint}>
                                    "Ej: He comido un filete de pollo de 150g y una ensalada"
                                </Text>

                                {isAnalyzing && (
                                    <View style={styles.analyzingBox}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={styles.analyzingText}>Procesando con IA...</Text>
                                    </View>
                                )}
                            </View>
                        ) : (
                            <View style={styles.resultBox}>
                                <View style={styles.resultHeader}>
                                    <Sparkles size={20} color={colors.primary} />
                                    <Text style={styles.resultTitle}>Alimentos Detectados</Text>
                                </View>

                                <View style={styles.resultList}>
                                    {analysisResult.map((item, idx) => (
                                        <View key={idx} style={styles.resultItem}>
                                            <View style={styles.itemInfo}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemSub}>{item.weight}g • {item.calories} kcal</Text>
                                            </View>
                                            <Check size={18} color={colors.primary} />
                                        </View>
                                    ))}
                                </View>

                                <View style={styles.footerBtns}>
                                    <TouchableOpacity style={styles.retryBtn} onPress={() => setAnalysisResult(null)}>
                                        <RotateCcw size={18} color={colors.textSecondary} />
                                        <Text style={styles.retryText}>Repetir</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.confirmBtn} onPress={confirmAndAdd}>
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
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20
    },
    container: {
        backgroundColor: colors.card,
        borderRadius: 30,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 250
    },
    micCard: {
        alignItems: 'center',
        width: '100%'
    },
    micButton: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    micOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    micInner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6
    },
    micInnerActive: {
        backgroundColor: colors.danger,
        transform: [{ scale: 1.1 }]
    },
    micStatus: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10
    },
    micHint: {
        color: colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
        paddingHorizontal: 20
    },
    analyzingBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        gap: 10
    },
    analyzingText: {
        color: colors.primary,
        fontSize: 13,
        fontWeight: '600'
    },
    resultBox: {
        width: '100%'
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 15
    },
    resultTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text
    },
    resultList: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 15,
        padding: 15,
        maxHeight: 200,
        marginBottom: 20
    },
    resultItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    itemName: {
        color: colors.text,
        fontWeight: '600',
        fontSize: 14
    },
    itemSub: {
        color: colors.textSecondary,
        fontSize: 12
    },
    footerBtns: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    retryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12
    },
    retryText: {
        color: colors.textSecondary,
        fontWeight: '600'
    },
    confirmBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12
    },
    confirmText: {
        color: colors.white,
        fontWeight: '700'
    }
});

export default VoiceScanner;
