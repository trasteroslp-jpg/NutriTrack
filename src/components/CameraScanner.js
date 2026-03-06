import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ActivityIndicator, Alert, useWindowDimensions, ScrollView, Dimensions, TextInput, Animated, Easing, Vibration } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, X, RotateCcw, Check, Sparkles, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import * as FileSystem from 'expo-file-system';
import { r } from '../utils/formatNumber';
import { useApp } from '../context/AppContext';
import { sanitizeNumber } from '../utils/sanitize';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

import { auth } from '../config/firebase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// CONFIG
const CLOUD_FUNCTION_URL = "https://us-central1-nutritrack-327c1.cloudfunctions.net/analyzeWithGemini";

const CameraScanner = ({ visible, onClose }) => {
    const { width, height } = useWindowDimensions();
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [processingStep, setProcessingStep] = useState(0); // 0: Idle, 1: Detecting, 2: Calculating
    const { addMeal, addToGlobalCatalogue, trackAIUsage } = useApp();
    const cameraRef = useRef(null);

    // Animations
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const cornerPulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible && !capturedImage) {
            startScanAnimations();
        } else {
            stopScanAnimations();
        }
    }, [visible, capturedImage]);

    const startScanAnimations = () => {
        // Scan line animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineAnim, {
                    toValue: 0,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Corner pulse
        Animated.loop(
            Animated.sequence([
                Animated.timing(cornerPulseAnim, {
                    toValue: 1.15,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(cornerPulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const stopScanAnimations = () => {
        scanLineAnim.stopAnimation();
        cornerPulseAnim.stopAnimation();
    };

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide" transparent={false}>
                <View style={styles.permissionContainer}>
                    <Camera size={60} color={colors.primary} />
                    <Text style={styles.permissionText}>Necesitamos acceso a tu cámara para analizar tu comida.</Text>
                    <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                        <Text style={styles.permissionButtonText}>Dar Permiso</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <X size={30} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    quality: 0.5,
                    base64: true,
                });
                Vibration.vibrate(50); // Short haptic for shutter
                setCapturedImage(photo.uri);
                analyzeImage(photo.uri, photo.base64);
            } catch (e) {
                console.log(e);
            }
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            setCapturedImage(result.assets[0].uri);
            analyzeImage(result.assets[0].uri, result.assets[0].base64);
        }
    };

    const analyzeImage = async (uri, base64Data) => {
        setIsAnalyzing(true);
        setProcessingStep(1); // Identifying

        // Obtener usuario actual de forma segura
        const currentUser = auth.currentUser;
        let token = "";
        if (currentUser) {
            token = await currentUser.getIdToken(true); // Forzar actualización para evitar tokens caducados
        } else {
            throw new Error("Sesión no válida. Por favor, reinicia sesión.");
        }

        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'image',
                mimeType: 'image/jpeg',
                data: base64Data
            })
        });

        const data = await response.json();

        if (data.error) {
            const errorMsg = data.details ? `${data.error}: ${data.details} ` : data.error;
            throw new Error(errorMsg || "Error en el servidor de análisis");
        }

        if (data.usage) {
            trackAIUsage('CameraScanner', data.usage.promptTokens, data.usage.responseTokens);
        }

        const items = data.result;
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("La IA no pudo identificar alimentos en esta imagen.");
        }

        setProcessingStep(2); // Calculating

        const withRatios = items.map(item => ({
            ...item,
            originalWeight: item.weight || 100,
            calPerGram: item.calories / (item.weight || 100),
            protPerGram: item.protein / (item.weight || 100),
            carbsPerGram: item.carbs / (item.weight || 100),
            fatPerGram: item.fat / (item.weight || 100),
        }));

        setAnalysisResult(withRatios);
        Vibration.vibrate([0, 100, 50, 100]); // Victory haptic pattern
    } catch (e) {
        console.error(e);
        Alert.alert("Error de IA", e.message || "No se pudo conectar con el servicio de análisis real.");
        setAnalysisResult(null);
        setCapturedImage(null);
    } finally {
        setIsAnalyzing(false);
        setProcessingStep(0);
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
            type: 'IA Vision',
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            grams: item.weight
        });

        const ratio = 100 / (item.weight || 100);
        addToGlobalCatalogue({
            name: item.name,
            calories: Math.round(item.calories * ratio),
            protein: Math.round(item.protein * ratio),
            carbs: Math.round(item.carbs * ratio),
            fat: Math.round(item.fat * ratio),
            category: 'IA Vision'
        });
    });
    Alert.alert('¡Éxito!', 'Alimentos añadidos al diario.');
    resetScanner();
    onClose();
};

const resetScanner = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setProcessingStep(0);
};

const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH * 0.75],
});

return (
    <Modal visible={visible} animationType="fade" transparent={false}>
        <View style={styles.container}>
            {!capturedImage ? (
                <View style={styles.cameraContainer}>
                    <CameraView style={styles.camera} ref={cameraRef} />

                    {/* Scanner UI */}
                    <View style={styles.overlay} pointerEvents="none">
                        <Animated.View style={[styles.scanTarget, { transform: [{ scale: cornerPulseAnim }] }]}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />

                            {/* Animated Scan Line */}
                            <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]}>
                                <LinearGradient
                                    colors={['transparent', 'rgba(16, 185, 129, 0.4)', 'transparent']}
                                    style={{ flex: 1 }}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                />
                            </Animated.View>
                        </Animated.View>

                        <View style={styles.scanTextContainer}>
                            <Sparkles size={16} color={colors.primary} />
                            <Text style={styles.scanText}>Enfoca tu plato para el análisis IA</Text>
                        </View>
                    </View>

                    <View style={styles.cameraControls}>
                        <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
                            <ImageIcon size={24} color={colors.white} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                            <LinearGradient
                                colors={[colors.primary, '#059669']}
                                style={styles.captureInnerGradient}
                            >
                                <Camera size={32} color={colors.white} />
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                            <X size={24} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.previewContainer}>
                    <Image source={{ uri: capturedImage }} style={styles.previewImage} />

                    {isAnalyzing ? (
                        <BlurView intensity={20} style={styles.analyzingOverlay}>
                            <View style={styles.analyzingCard}>
                                <View style={styles.aiRing}>
                                    <Sparkles size={30} color={colors.primary} />
                                </View>
                                <Text style={styles.analyzingTitle}>
                                    {processingStep === 1 ? "Identificando..." : "Calculando..."}
                                </Text>
                                <Text style={styles.analyzingSub}>
                                    NutriTrack está analizando los macros de tu plato
                                </Text>
                                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
                            </View>
                        </BlurView>
                    ) : analysisResult ? (
                        <View style={styles.resultContainer}>
                            <View style={styles.resultHeader}>
                                <View style={styles.resultHeaderLeft}>
                                    <Sparkles size={20} color={colors.primary} />
                                    <Text style={styles.resultTitle}>Escaneo IA Finalizado</Text>
                                </View>
                                <TouchableOpacity style={styles.miniRetry} onPress={resetScanner}>
                                    <RotateCcw size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.resultList} showsVerticalScrollIndicator={false}>
                                {analysisResult.map((item, index) => (
                                    <View key={index} style={styles.resultItem}>
                                        <View style={styles.itemHeader}>
                                            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                                            <Text style={styles.itemCalories}>{r(item.calories)} kcal</Text>
                                        </View>

                                        <View style={styles.itemEditRow}>
                                            <View style={styles.weightEditWrapper}>
                                                <TextInput
                                                    style={styles.weightEditInput}
                                                    value={item.weight.toString()}
                                                    onChangeText={(val) => updateItemWeight(index, sanitizeNumber(val))}
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

                                <View style={styles.totalBox}>
                                    <Text style={styles.totalLabel}>Resumen Total</Text>
                                    <Text style={styles.totalValue}>
                                        {Math.round(analysisResult.reduce((s, i) => s + i.calories, 0))} kcal
                                    </Text>
                                </View>
                            </ScrollView>

                            <View style={styles.footerBtns}>
                                <TouchableOpacity style={styles.confirmBtn} onPress={confirmAndAdd}>
                                    <Check size={20} color={colors.white} style={{ marginRight: 8 }} />
                                    <Text style={styles.confirmText}>Añadir al Diario</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : null}
                </View>
            )}
        </View>
    </Modal>
);
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    cameraContainer: { flex: 1 },
    camera: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    scanTarget: { width: SCREEN_WIDTH * 0.75, height: SCREEN_WIDTH * 0.75, position: 'relative' },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: colors.primary },
    topLeft: { top: 0, left: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 15 },
    topRight: { top: 0, right: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 15 },
    bottomLeft: { bottom: 0, left: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 15 },
    bottomRight: { bottom: 0, right: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 15 },
    scanLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        zIndex: 2,
    },
    scanTextContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 40,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    scanText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    cameraControls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 50,
        paddingHorizontal: 30,
        backgroundColor: 'transparent'
    },
    captureButton: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.3)'
    },
    captureInnerGradient: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center'
    },
    iconButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    previewContainer: { flex: 1, backgroundColor: '#000' },
    previewImage: { flex: 1, resizeMode: 'cover' },
    analyzingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    analyzingCard: {
        width: SCREEN_WIDTH * 0.8,
        backgroundColor: 'rgba(0,0,0,0.85)',
        borderRadius: 30,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)'
    },
    aiRing: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: colors.primary
    },
    analyzingTitle: { color: colors.primary, fontSize: 20, fontWeight: '900', marginBottom: 10 },
    analyzingSub: { color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 18 },
    resultContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.card,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: 24,
        maxHeight: SCREEN_HEIGHT * 0.7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingHorizontal: 4
    },
    resultHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    resultTitle: { fontSize: 18, fontWeight: '900', color: colors.text },
    miniRetry: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
    resultList: { maxHeight: SCREEN_HEIGHT * 0.4 },
    resultItem: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border
    },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    itemName: { fontSize: 16, fontWeight: '800', color: colors.text, flex: 1 },
    itemCalories: { fontSize: 16, fontWeight: '900', color: colors.primary },
    itemEditRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    weightEditWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 38
    },
    weightEditInput: { fontSize: 15, fontWeight: '800', color: colors.text, minWidth: 45, textAlign: 'right' },
    weightEditUnit: { color: colors.textSecondary, fontWeight: '700', fontSize: 13, marginLeft: 3 },
    macroChips: { flexDirection: 'row', gap: 6 },
    macroChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    macroChipText: { fontSize: 11, fontWeight: '800' },
    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 20,
        marginTop: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border
    },
    totalLabel: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
    totalValue: { fontSize: 22, fontWeight: '900', color: colors.primary },
    footerBtns: { paddingTop: 20 },
    confirmBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 18,
        borderRadius: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8
    },
    confirmText: { color: colors.white, fontWeight: '900', fontSize: 16 },
    permissionContainer: { flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    permissionText: { textAlign: 'center', fontSize: 16, color: colors.text, marginVertical: 20, lineHeight: 24 },
    permissionButton: { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
    permissionButtonText: { color: colors.white, fontWeight: '700' },
    closeBtn: { position: 'absolute', top: 50, right: 30 }
});

export default CameraScanner;
