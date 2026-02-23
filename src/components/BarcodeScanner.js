import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, Alert, useWindowDimensions, TextInput, ScrollView, Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { X, Plus, Minus, Check, ShoppingBag } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

const BarcodeScanner = ({ visible, onClose }) => {
    const { width } = useWindowDimensions();
    const [scanned, setScanned] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [foundProduct, setFoundProduct] = useState(null); // Producto encontrado
    const [quantity, setQuantity] = useState('100');        // Gramos a añadir
    const { addMeal, addToGlobalCatalogue } = useApp();

    const handleBarCodeScanned = async ({ data }) => {
        if (scanned) return;
        setScanned(true);
        setIsSearching(true);

        try {
            const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
            const result = await response.json();
            setIsSearching(false);

            if (result.status === 1 && result.product) {
                const product = result.product;
                const nutriments = product.nutriments || {};

                const realProduct = {
                    name: product.product_name || 'Producto desconocido',
                    brand: product.brands || '',
                    calories100g: Math.round(nutriments['energy-kcal_100g'] || 0),
                    protein100g: Math.round(nutriments['proteins_100g'] || 0),
                    carbs100g: Math.round(nutriments['carbohydrates_100g'] || 0),
                    fat100g: Math.round(nutriments['fat_100g'] || 0),
                    servingSize: product.serving_size || null,
                };

                if (realProduct.calories100g === 0 && realProduct.protein100g === 0) {
                    Alert.alert('Datos incompletos', 'El producto fue encontrado pero no tiene información nutricional disponible.');
                    setScanned(false);
                    return;
                }

                setFoundProduct(realProduct);
                setQuantity('100');
            } else {
                Alert.alert('No encontrado', `Código: ${data}\nNo está en la base de datos global.`);
                setScanned(false);
            }
        } catch (error) {
            setIsSearching(false);
            Alert.alert('Error', 'Error al conectar con la base de datos.');
            setScanned(false);
        }
    };

    const adjustQuantity = (delta) => {
        const current = parseInt(quantity) || 0;
        const next = Math.max(1, current + delta);
        setQuantity(String(next));
    };

    const handleConfirm = () => {
        if (!foundProduct) return;
        const q = parseInt(quantity) || 0;
        if (q <= 0) {
            Alert.alert('Error', 'Introduce una cantidad válida.');
            return;
        }
        const ratio = q / 100;
        addMeal({
            title: foundProduct.name,
            type: 'Escáner',
            calories: Math.round(foundProduct.calories100g * ratio),
            protein: Math.round(foundProduct.protein100g * ratio),
            carbs: Math.round(foundProduct.carbs100g * ratio),
            fat: Math.round(foundProduct.fat100g * ratio),
        });

        // Alimentar la base de datos global
        addToGlobalCatalogue({
            name: foundProduct.name,
            calories: foundProduct.calories100g,
            protein: foundProduct.protein100g,
            carbs: foundProduct.carbs100g,
            fat: foundProduct.fat100g,
            category: 'Escáner'
        });

        setFoundProduct(null);
        setScanned(false);
        onClose();
    };

    const handleCancel = () => {
        setFoundProduct(null);
        setScanned(false);
    };

    // Calcular macros en tiempo real según la cantidad
    const q = parseInt(quantity) || 0;
    const ratio = q / 100;
    const calcCalories = foundProduct ? Math.round(foundProduct.calories100g * ratio) : 0;
    const calcProtein = foundProduct ? Math.round(foundProduct.protein100g * ratio) : 0;
    const calcCarbs = foundProduct ? Math.round(foundProduct.carbs100g * ratio) : 0;
    const calcFat = foundProduct ? Math.round(foundProduct.fat100g * ratio) : 0;

    return (
        <Modal visible={visible} animationType="slide">
            <View style={styles.container}>

                {/* ── PANTALLA DE AJUSTE DE CANTIDAD ── */}
                {foundProduct ? (
                    <ScrollView contentContainerStyle={styles.adjustContainer}>
                        {/* Cabecera */}
                        <View style={styles.adjustHeader}>
                            <ShoppingBag size={32} color={colors.primary} />
                            <Text style={styles.productName}>{foundProduct.name}</Text>
                            {foundProduct.brand ? (
                                <Text style={styles.productBrand}>{foundProduct.brand}</Text>
                            ) : null}
                            <Text style={styles.per100}>Valores por 100g: {foundProduct.calories100g} kcal | P:{foundProduct.protein100g}g C:{foundProduct.carbs100g}g G:{foundProduct.fat100g}g</Text>
                        </View>

                        {/* Selector de cantidad */}
                        <View style={styles.quantityCard}>
                            <Text style={styles.quantityLabel}>Cantidad consumida (gramos)</Text>
                            <View style={styles.quantityRow}>
                                <TouchableOpacity style={styles.qBtn} onPress={() => adjustQuantity(-10)}>
                                    <Minus size={20} color={colors.white} />
                                </TouchableOpacity>
                                <TextInput
                                    style={styles.quantityInput}
                                    keyboardType="numeric"
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    selectTextOnFocus
                                />
                                <TouchableOpacity style={styles.qBtn} onPress={() => adjustQuantity(10)}>
                                    <Plus size={20} color={colors.white} />
                                </TouchableOpacity>
                            </View>
                            {/* Accesos rápidos */}
                            <View style={styles.quickRow}>
                                {[50, 100, 150, 200, 250].map(g => (
                                    <TouchableOpacity
                                        key={g}
                                        style={[styles.quickBtn, quantity === String(g) && styles.quickBtnActive]}
                                        onPress={() => setQuantity(String(g))}
                                    >
                                        <Text style={[styles.quickBtnText, quantity === String(g) && styles.quickBtnTextActive]}>
                                            {g}g
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Resultado calculado */}
                        <View style={styles.resultCard}>
                            <Text style={styles.resultTitle}>Total para {q}g</Text>
                            <Text style={styles.resultCalories}>{calcCalories} kcal</Text>
                            <View style={styles.macroRow}>
                                <View style={styles.macroBox}>
                                    <View style={[styles.macroDot, { backgroundColor: colors.macronutrients?.protein || '#4CAF50' }]} />
                                    <Text style={styles.macroValue}>{calcProtein}g</Text>
                                    <Text style={styles.macroLabel}>Proteína</Text>
                                </View>
                                <View style={styles.macroBox}>
                                    <View style={[styles.macroDot, { backgroundColor: colors.macronutrients?.carbs || '#2196F3' }]} />
                                    <Text style={styles.macroValue}>{calcCarbs}g</Text>
                                    <Text style={styles.macroLabel}>Carbos</Text>
                                </View>
                                <View style={styles.macroBox}>
                                    <View style={[styles.macroDot, { backgroundColor: colors.macronutrients?.fat || '#FF9800' }]} />
                                    <Text style={styles.macroValue}>{calcFat}g</Text>
                                    <Text style={styles.macroLabel}>Grasa</Text>
                                </View>
                            </View>
                        </View>

                        {/* Botones de acción */}
                        <View style={styles.actionRow}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                                <X size={20} color={colors.textSecondary} />
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                                <Check size={20} color={colors.white} />
                                <Text style={styles.confirmText}>Añadir al Diario</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                ) : (
                    /* ── PANTALLA DE ESCÁNER ── */
                    <View style={{ flex: 1 }}>
                        <CameraView
                            style={StyleSheet.absoluteFillObject}
                            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            barcodeScannerSettings={{
                                barcodeTypes: ['qr', 'ean13', 'ean8', 'upc_a', 'upc_e'],
                            }}
                        />
                        <View style={styles.overlay}>
                            <View style={styles.header}>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <X size={28} color={colors.white} />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Escáner de Código de Barras</Text>
                                <View style={{ width: 28 }} />
                            </View>

                            <View style={styles.scanContainer}>
                                <View style={styles.scanFrame}>
                                    <View style={[styles.corner, styles.topLeft]} />
                                    <View style={[styles.corner, styles.topRight]} />
                                    <View style={[styles.corner, styles.bottomLeft]} />
                                    <View style={[styles.corner, styles.bottomRight]} />
                                    <View style={styles.laserLine} />
                                </View>
                                <Text style={styles.instructionText}>Apunta al código de barras del producto</Text>
                            </View>

                            {isSearching && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                    <Text style={styles.loadingText}>Buscando producto...</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </Modal>
    );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // ── Escáner ──
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 60,
        paddingHorizontal: 20,
    },
    closeButton: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)' },
    headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },
    scanContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: SCREEN_WIDTH * 0.8, height: 200, position: 'relative' },
    corner: { position: 'absolute', width: 30, height: 30, borderColor: colors.primary },
    topLeft: { top: 0, left: 0, borderLeftWidth: 4, borderTopWidth: 4 },
    topRight: { top: 0, right: 0, borderRightWidth: 4, borderTopWidth: 4 },
    bottomLeft: { bottom: 0, left: 0, borderLeftWidth: 4, borderBottomWidth: 4 },
    bottomRight: { bottom: 0, right: 0, borderRightWidth: 4, borderBottomWidth: 4 },
    laserLine: { position: 'absolute', top: '50%', left: '10%', right: '10%', height: 2, backgroundColor: colors.primary },
    instructionText: {
        color: '#FFF',
        marginTop: 40,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#FFF', marginTop: 20, fontSize: 16, fontWeight: '600' },

    // ── Ajuste de cantidad ──
    adjustContainer: {
        padding: 24,
        paddingTop: 60,
    },
    adjustHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    productName: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginTop: 12,
    },
    productBrand: {
        fontSize: 14,
        color: colors.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    per100: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 10,
        textAlign: 'center',
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quantityCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    quantityLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    qBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityInput: {
        width: 100,
        textAlign: 'center',
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        marginHorizontal: 20,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
        paddingBottom: 4,
    },
    quickRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickBtn: {
        flex: 1,
        marginHorizontal: 3,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.background,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    quickBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    quickBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    quickBtnTextActive: {
        color: colors.white,
    },
    resultCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    resultTitle: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
        marginBottom: 8,
    },
    resultCalories: {
        fontSize: 40,
        fontWeight: '900',
        color: colors.primary,
        marginBottom: 16,
    },
    macroRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    macroBox: {
        alignItems: 'center',
        flex: 1,
    },
    macroDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginBottom: 6,
    },
    macroValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    macroLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 0.4,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    confirmBtn: {
        flex: 0.6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: colors.primary,
        gap: 8,
    },
    confirmText: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.white,
    },
});

export default BarcodeScanner;
