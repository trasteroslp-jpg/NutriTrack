import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Shield, Check, Star, Zap, CreditCard, X, Sparkles, Mic, BarChart3, Trophy, Award } from 'lucide-react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

const PremiumModal = ({ visible, onClose }) => {
    const { initPaymentSheet, presentPaymentSheet } = useStripe();
    const { user, updateUser, firebaseUser } = useApp();
    const [loading, setLoading] = useState(false);

    const purchasePlan = async (planId) => {
        setLoading(true);
        try {
            // Nota: En una app real, aquí llamarías a tu backend (Firebase Cloud Function)
            // para crear un PaymentIntent. Como estamos en modo desarrollo local,
            // vamos a simular el flujo exitoso por ahora o usar el Secret Key si tuviéramos backend.

            // SIMULACIÓN DE PROCESAMIENTO
            setTimeout(async () => {
                await updateUser({ isPro: true });
                setLoading(false);
                Alert.alert(
                    "¡Bienvenido a NutriTrack PRO!",
                    "Tu suscripción se ha activado correctamente. Ya tienes acceso a IA Vision y Registro por Voz ilimitado.",
                    [{ text: "¡Genial!", onPress: onClose }]
                );
            }, 2000);

        } catch (e) {
            console.error(e);
            Alert.alert("Error", "No se pudo procesar el pago en este momento.");
            setLoading(false);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={24} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.header}>
                            <View style={styles.iconBadge}>
                                <Sparkles size={32} color={colors.white} />
                            </View>
                            <Text style={styles.title}>NutriTrack PRO</Text>
                            <Text style={styles.subtitle}>Desbloquea el poder total de la IA para tu nutrición</Text>
                        </View>

                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>+45%</Text>
                                <Text style={styles.statLabel}>Más precisión</Text>
                            </View>
                            <View style={styles.verticalDivider} />
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>24/7</Text>
                                <Text style={styles.statLabel}>Asistente IA</Text>
                            </View>
                        </View>

                        <View style={styles.features}>
                            <FeatureItem
                                icon={<Sparkles size={20} color={colors.primary} />}
                                title="IA Vision Pro"
                                desc="Analiza tus platos simplemente con una foto."
                            />
                            <FeatureItem
                                icon={<Mic size={20} color={colors.primary} />}
                                title="Registro por Voz"
                                desc="Dile a la app qué has comido y ella lo anotará."
                            />
                            <FeatureItem
                                icon={<BarChart3 size={20} color={colors.primary} />}
                                title="Sin Publicidad"
                                desc="Experiencia limpia y enfocada en tus metas."
                            />
                            <FeatureItem
                                icon={<Shield size={20} color={colors.primary} />}
                                title="Reportes Avanzados"
                                desc="Gráficas detalladas de tu evolución semanal."
                            />
                        </View>

                        <View style={styles.plans}>
                            <TouchableOpacity style={styles.planCard} onPress={() => purchasePlan('monthly')}>
                                <View>
                                    <Text style={styles.planName}>Mes PRO</Text>
                                    <Text style={styles.planPrice}>9,99€ <Text style={styles.planPeriod}>/mes</Text></Text>
                                </View>
                                <CreditCard size={20} color={colors.textSecondary} />
                            </TouchableOpacity>

                            <TouchableOpacity style={[styles.planCard, styles.planCardActive]} onPress={() => purchasePlan('annual')}>
                                <View style={styles.popularBadge}>
                                    <Text style={styles.popularText}>MEJOR VALOR</Text>
                                </View>
                                <View>
                                    <Text style={styles.planName}>Año PRO</Text>
                                    <Text style={styles.planPrice}>59,99€ <Text style={styles.planPeriod}>/año</Text></Text>
                                    <Text style={styles.savingsText}>Ahorra un 50%</Text>
                                </View>
                                <Zap size={22} color={colors.accent} fill={colors.accent} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.footerNote}>Pago seguro procesado por Stripe. Cancela en cualquier momento.</Text>
                    </ScrollView>

                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={styles.loadingText}>Procesando pago seguro...</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const FeatureItem = ({ icon, title, desc }) => (
    <View style={styles.featureItem}>
        <View style={styles.featureIcon}>{icon}</View>
        <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDesc}>{desc}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        height: '92%',
        padding: 24,
    },
    closeButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        backgroundColor: colors.card,
        padding: 8,
        borderRadius: 20,
    },
    header: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
    },
    iconBadge: {
        width: 70,
        height: 70,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        elevation: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: colors.border,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.primary,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    verticalDivider: {
        width: 1,
        backgroundColor: colors.border,
        height: '100%',
    },
    features: {
        marginBottom: 30,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    featureIcon: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    featureDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    plans: {
        gap: 12,
        marginBottom: 20,
    },
    planCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 22,
        backgroundColor: colors.card,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    planCardActive: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderWidth: 2,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
    },
    popularText: {
        color: colors.white,
        fontSize: 10,
        fontWeight: '900',
    },
    planName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    planPrice: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        marginTop: 4,
    },
    planPeriod: {
        fontSize: 14,
        fontWeight: '400',
        color: colors.textSecondary,
    },
    savingsText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '700',
        marginTop: 2,
    },
    footerNote: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 20,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
    },
    loadingText: {
        color: colors.white,
        marginTop: 20,
        fontSize: 16,
        fontWeight: '600',
    }
});

export default PremiumModal;
