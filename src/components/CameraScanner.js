import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Image, ActivityIndicator, Alert, useWindowDimensions, ScrollView, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Camera, X, RefreshCw, Check, Sparkles } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
// import * as FileSystem from 'expo-file-system'; // Removed to avoid platform issues
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

// GEMINI CONFIG
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const CameraScanner = ({ visible, onClose }) => {
    const { width, height } = useWindowDimensions();
    const [permission, requestPermission] = useCameraPermissions();
    const [capturedImage, setCapturedImage] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const { addMeal } = useApp();
    const cameraRef = useRef(null);

    if (!permission) return <View />;

    if (!permission.granted) {
        return (
            <Modal visible={visible} animationType="slide">
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
        if (GEMINI_API_KEY === "TU_API_KEY_AQUI") {
            // Fallback to simulation if no key provided
            setTimeout(() => {
                const mockResult = [
                    { name: 'Ensalada Mixta', weight: 200, calories: 120, protein: 4, carbs: 12, fat: 8 },
                    { name: 'Pollo Parrilla', weight: 150, calories: 250, protein: 35, carbs: 0, fat: 12 },
                ];
                setAnalysisResult(mockResult);
                setIsAnalyzing(false);
            }, 2500);
            return;
        }

        try {
            const base64 = base64Data;

            if (!base64) {
                throw new Error("No se pudo obtener la información de la imagen");
            }

            const response = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: "Identifica los alimentos de este plato. Estima peso, calorías y macros (P/C/G) para cada ingrediente. Responde SOLO en JSON plano: [{\"name\": \"...\", \"weight\": 100, \"calories\": 200, \"protein\": 10, \"carbs\": 20, \"fat\": 5}]" },
                            { inline_data: { mime_type: "image/jpeg", data: base64 } }
                        ]
                    }]
                })
            });

            const data = await response.json();

            // Check for API errors
            if (data.error) {
                console.error("Gemini API Error:", data.error);
                throw new Error(data.error.message || "Error en la API de Gemini");
            }

            if (!data.candidates || data.candidates.length === 0) {
                console.error("No candidates in response:", data);
                throw new Error("La IA no pudo generar una respuesta para esta imagen.");
            }

            const aiText = data.candidates[0].content.parts[0].text;

            // Mas robusto: buscar el primer '[' y el último ']'
            const jsonStart = aiText.indexOf('[');
            const jsonEnd = aiText.lastIndexOf(']') + 1;

            if (jsonStart === -1 || jsonEnd === 0) {
                throw new Error("La IA no devolvió un formato de datos válido.");
            }

            const cleanedJson = aiText.substring(jsonStart, jsonEnd);
            const result = JSON.parse(cleanedJson);

            setAnalysisResult(result);
        } catch (e) {
            console.error(e);
            Alert.alert("Error de IA", "No se pudo conectar con el servicio de análisis real.");
            setAnalysisResult(null);
        } finally {
            setIsAnalyzing(false);
        }
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
    };

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.container}>
                {!capturedImage ? (
                    <View style={styles.cameraContainer}>
                        <CameraView style={styles.camera} ref={cameraRef} />
                        <View style={styles.overlay} pointerEvents="none">
                            <View style={styles.scanTarget}>
                                <View style={[styles.corner, styles.topLeft]} />
                                <View style={[styles.corner, styles.topRight]} />
                                <View style={[styles.corner, styles.bottomLeft]} />
                                <View style={[styles.corner, styles.bottomRight]} />
                            </View>
                            <Text style={styles.scanText}>Escanea tu comida</Text>
                        </View>
                        <View style={styles.cameraControls}>
                            <TouchableOpacity onPress={pickImage} style={styles.iconButton}>
                                <RefreshCw size={24} color={colors.white} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={takePicture} style={styles.captureButton}>
                                <View style={styles.captureInner} />
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
                            <View style={styles.analyzingOverlay}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={styles.analyzingText}>Detectando alimentos con IA...</Text>
                            </View>
                        ) : analysisResult ? (
                            <View style={styles.resultContainer}>
                                <View style={styles.resultHeader}>
                                    <Sparkles size={24} color={colors.primary} />
                                    <Text style={styles.resultTitle}>Análisis Real</Text>
                                </View>
                                <ScrollView style={styles.resultList}>
                                    {analysisResult.map((item, index) => (
                                        <View key={index} style={styles.resultItem}>
                                            <View style={styles.itemMain}>
                                                <Text style={styles.itemName}>{item.name}</Text>
                                                <Text style={styles.itemWeight}>{item.weight}g estimado</Text>
                                            </View>
                                            <View style={styles.itemValues}>
                                                <Text style={styles.itemCalories}>{item.calories} kcal</Text>
                                                <Text style={styles.macroMini}>P:{item.protein} C:{item.carbs} G:{item.fat}</Text>
                                            </View>
                                        </View>
                                    ))}
                                </ScrollView>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity style={styles.retryButton} onPress={resetScanner}>
                                        <Text style={styles.retryText}>Repetir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.confirmButton} onPress={confirmAndAdd}>
                                        <Text style={styles.confirmText}>Confirmar todo</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null}
                    </View>
                )}
            </View>
        </Modal >
    );
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    cameraContainer: { flex: 1 },
    camera: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', zIndex: 1 },
    scanTarget: { width: SCREEN_WIDTH * 0.7, height: SCREEN_WIDTH * 0.7, position: 'relative' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: colors.primary },
    topLeft: { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4 },
    topRight: { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4 },
    bottomLeft: { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4 },
    bottomRight: { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4 },
    scanText: { color: '#FFF', marginTop: 30, fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
    cameraControls: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 40, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
    captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.white },
    iconButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
    previewContainer: { flex: 1 },
    previewImage: { flex: 1, resizeMode: 'cover' },
    analyzingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    analyzingText: { color: '#FFF', marginTop: 20, fontSize: 18, fontWeight: '700' },
    resultContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 24, maxHeight: SCREEN_HEIGHT * 0.6 },
    resultHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    resultTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginLeft: 10 },
    resultList: { maxHeight: SCREEN_HEIGHT * 0.35 },
    resultItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemName: { fontSize: 16, fontWeight: '700', color: colors.text },
    itemWeight: { fontSize: 13, color: colors.textSecondary },
    itemValues: { alignItems: 'flex-end' },
    itemCalories: { fontSize: 16, fontWeight: '800', color: colors.primary },
    macroMini: { fontSize: 11, color: colors.textSecondary },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    retryButton: { padding: 15, borderRadius: 12, backgroundColor: colors.border, flex: 0.4, alignItems: 'center' },
    retryText: { fontWeight: '600', color: colors.text },
    confirmButton: { padding: 15, borderRadius: 12, backgroundColor: colors.primary, flex: 0.55, alignItems: 'center' },
    confirmText: { fontWeight: '700', color: colors.white },
    permissionContainer: { flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    permissionText: { textAlign: 'center', fontSize: 16, color: colors.text, marginVertical: 20 },
    permissionButton: { backgroundColor: colors.primary, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
    permissionButtonText: { color: colors.white, fontWeight: '700' },
    closeBtn: { position: 'absolute', top: 50, right: 30 }
});

export default CameraScanner;
