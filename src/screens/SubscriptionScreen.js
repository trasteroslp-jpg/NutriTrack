import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Zap, CheckCircle2, AlertCircle, Calendar, ShieldCheck, XCircle, CreditCard } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';

const SubscriptionScreen = () => {
    const { user, updateUser } = useApp();
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const handleCancelSubscription = () => {
        Alert.alert(
            "Cancelar Suscripción",
            "¿Estás seguro de que quieres cancelar tu suscripción PRO? Perderás el acceso a IA Vision y Registro por Voz.",
            [
                { text: "Mantener PRO", style: "cancel" },
                {
                    text: "Sí, cancelar",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Simulación de cancelación
                            setTimeout(async () => {
                                await updateUser({ isPro: false });
                                setLoading(false);
                                Alert.alert("Suscripción Cancelada", "Tu cuenta ha vuelto al plan gratuito.");
                            }, 1500);
                        } catch (e) {
                            setLoading(false);
                            Alert.alert("Error", "No se pudo procesar la cancelación.");
                        }
                    }
                }
            ]
        );
    };

    const handleActivateSubscription = () => {
        // En una app real, esto abriría el modal de pago o pasarela
        Alert.alert(
            "Activar PRO",
            "Serás redirigido a la pantalla de selección de plan.",
            [{ text: "Continuar", onPress: () => navigation.goBack() }] // El usuario puede activarlo desde el modal que ya existe
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Suscripción</Text>
                <View style={{ width: 28 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Card */}
                <View style={[styles.statusCard, user.isPro ? styles.statusCardPro : styles.statusCardFree]}>
                    <View style={styles.statusInfo}>
                        <View style={[styles.iconCircle, { backgroundColor: user.isPro ? colors.accent : colors.border }]}>
                            {user.isPro ? <Zap size={24} color={colors.white} fill={colors.white} /> : <AlertCircle size={24} color={colors.textSecondary} />}
                        </View>
                        <View>
                            <Text style={styles.statusLabel}>Estado Actual</Text>
                            <Text style={styles.statusValue}>{user.isPro ? 'NutriTrack PRO' : 'Plan Gratuito'}</Text>
                        </View>
                    </View>
                    <View style={styles.badge}>
                        <Text style={[styles.badgeText, { color: user.isPro ? colors.accent : colors.textSecondary }]}>
                            {user.isPro ? 'ACTIVO' : 'LIMITADO'}
                        </Text>
                    </View>
                </View>

                {user.isPro && (
                    <View style={styles.detailsCard}>
                        <Text style={styles.sectionTitle}>Detalles de facturación</Text>
                        <View style={styles.detailRow}>
                            <Calendar size={18} color={colors.textSecondary} />
                            <Text style={styles.detailText}>Próximo pago: 22 de Marzo, 2026</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <CreditCard size={18} color={colors.textSecondary} />
                            <Text style={styles.detailText}>Método: •••• 4242</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <ShieldCheck size={18} color={colors.primary} />
                            <Text style={styles.detailText}>Gestionado de forma segura por Stripe</Text>
                        </View>
                    </View>
                )}

                {/* Features List */}
                <View style={styles.featuresCard}>
                    <Text style={styles.sectionTitle}>Tus Beneficios {user.isPro ? 'PRO' : ''}</Text>

                    <FeatureItem
                        title="IA Vision Pro"
                        desc="Escaneo de platos mediante fotos ilimitado."
                        enabled={user.isPro}
                    />
                    <FeatureItem
                        title="Registro por Voz (AI)"
                        desc="Dicta tus comidas y deja que la IA haga el resto."
                        enabled={user.isPro}
                    />
                    <FeatureItem
                        title="Sin Anuncios"
                        desc="Experiencia limpia y sin interrupciones."
                        enabled={user.isPro}
                    />
                    <FeatureItem
                        title="Reportes Avanzados"
                        desc="Exportación de datos y análisis profundo."
                        enabled={user.isPro}
                    />
                </View>

                {/* Actions */}
                <View style={styles.actionsContainer}>
                    {user.isPro ? (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelSubscription}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={colors.danger} />
                            ) : (
                                <>
                                    <XCircle size={20} color={colors.danger} />
                                    <Text style={styles.cancelButtonText}>Cancelar Suscripción</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.activateButton} onPress={() => navigation.goBack()}>
                            <Zap size={20} color={colors.white} fill={colors.white} />
                            <Text style={styles.activateButtonText}>Mejorar a PRO ahora</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={styles.footerNote}>
                        Al cancelar, seguirás teniendo acceso PRO hasta el final del periodo de facturación actual.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

const FeatureItem = ({ title, desc, enabled }) => (
    <View style={styles.featureItem}>
        <CheckCircle2 size={20} color={enabled ? colors.primary : colors.border} />
        <View style={styles.featureText}>
            <Text style={[styles.featureTitle, !enabled && styles.disabledText]}>{title}</Text>
            <Text style={styles.featureDesc}>{desc}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 15,
        backgroundColor: colors.card,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    backButton: {
        padding: 4,
    },
    scrollContent: {
        padding: 20,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
    },
    statusCardPro: {
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        borderColor: colors.accent,
    },
    statusCardFree: {
        backgroundColor: colors.card,
        borderColor: colors.border,
    },
    statusInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    statusValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    detailsCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    detailText: {
        fontSize: 14,
        color: colors.text,
        fontWeight: '500',
    },
    featuresCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: colors.border,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 15,
        marginBottom: 18,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    disabledText: {
        color: colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    actionsContainer: {
        alignItems: 'center',
    },
    activateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        width: '100%',
        padding: 16,
        borderRadius: 18,
        gap: 10,
    },
    activateButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        width: '100%',
        padding: 16,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.2)',
        gap: 10,
    },
    cancelButtonText: {
        color: colors.danger,
        fontSize: 15,
        fontWeight: '700',
    },
    footerNote: {
        fontSize: 11,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 15,
        paddingHorizontal: 20,
    }
});

export default SubscriptionScreen;
