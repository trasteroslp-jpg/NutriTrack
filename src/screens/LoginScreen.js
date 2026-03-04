import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    View, Text, StyleSheet, TouchableOpacity, Image,
    StatusBar, TextInput, KeyboardAvoidingView,
    Platform, ScrollView, ActivityIndicator, Alert, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { LogIn, UserPlus, Mail, Lock, Eye, EyeOff, Sparkles, ShieldCheck, User } from 'lucide-react-native';

// ── Modos de la pantalla ──
const MODE = { LOGIN: 'login', REGISTER: 'register' };

const LoginScreen = () => {
    const { loginWithEmail, registerWithEmail, resetPassword, authError, setAuthError } = useApp();

    const [mode, setMode] = useState(MODE.LOGIN);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailAuth = async () => {
        setAuthError(null);
        if (!email.trim() || !password.trim()) {
            Alert.alert('Campos requeridos', 'Por favor, rellena todos los campos.');
            return;
        }
        if (mode === MODE.REGISTER) {
            if (!name.trim()) {
                Alert.alert('Nombre requerido', 'Por favor, introduce tu nombre.');
                return;
            }
            if (password !== confirmPassword) {
                Alert.alert('Error', 'Las contraseñas no coinciden.');
                return;
            }
            if (password.length < 6) {
                Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
                return;
            }
        }

        setIsLoading(true);
        let result;
        if (mode === MODE.LOGIN) {
            result = await loginWithEmail(email.trim(), password);
        } else {
            result = await registerWithEmail(email.trim(), password, name.trim());
        }
        setIsLoading(false);

        if (!result.success) {
            Alert.alert('Error', result.error);
        }
    };

    const handleForgotPassword = async () => {
        if (!email.trim() || !email.includes('@')) {
            Alert.alert('Email necesario', 'Por favor, introduce tu correo electrónico para enviarte las instrucciones.');
            return;
        }
        setIsLoading(true);
        const result = await resetPassword(email.trim());
        setIsLoading(false);
        if (result.success) {
            Alert.alert('Correo enviado', 'Revisa tu bandeja de entrada para restablecer tu contraseña.');
        } else {
            Alert.alert('Error', result.error);
        }
    };

    const switchMode = () => {
        setMode(m => m === MODE.LOGIN ? MODE.REGISTER : MODE.LOGIN);
        setAuthError(null);
        setName('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
    };

    const isLogin = mode === MODE.LOGIN;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Logo */}
                    <View style={styles.logoContainer}>
                        <View style={styles.iconCircle}>
                            <Sparkles size={44} color={colors.primary} />
                        </View>
                        <Text style={styles.appName}>NutriTrack</Text>
                        <Text style={styles.tagline}>
                            {isLogin ? 'Bienvenido de vuelta 👋' : 'Crea tu cuenta gratuita ✨'}
                        </Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.formCard}>
                        {/* Selector Login / Registro */}
                        <View style={styles.modeSelector}>
                            <TouchableOpacity
                                style={[styles.modeBtn, isLogin && styles.modeBtnActive]}
                                onPress={() => setMode(MODE.LOGIN)}
                            >
                                <LogIn size={16} color={isLogin ? colors.white : colors.textSecondary} />
                                <Text style={[styles.modeBtnText, isLogin && styles.modeBtnTextActive]}>
                                    Iniciar sesión
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeBtn, !isLogin && styles.modeBtnActive]}
                                onPress={() => setMode(MODE.REGISTER)}
                            >
                                <UserPlus size={16} color={!isLogin ? colors.white : colors.textSecondary} />
                                <Text style={[styles.modeBtnText, !isLogin && styles.modeBtnTextActive]}>
                                    Registrarse
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Campo Nombre (solo en registro) */}
                        {!isLogin && (
                            <View style={styles.inputWrapper}>
                                <User size={18} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu nombre"
                                    placeholderTextColor={colors.textSecondary}
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                            </View>
                        )}

                        {/* Campo Email */}
                        <View style={styles.inputWrapper}>
                            <Mail size={18} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Correo electrónico"
                                placeholderTextColor={colors.textSecondary}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="done"
                                onSubmitEditing={Keyboard.dismiss}
                            />
                        </View>

                        {/* Campo Contraseña */}
                        <View style={styles.inputWrapper}>
                            <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Contraseña"
                                placeholderTextColor={colors.textSecondary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={Keyboard.dismiss}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
                                {showPassword
                                    ? <EyeOff size={18} color={colors.textSecondary} />
                                    : <Eye size={18} color={colors.textSecondary} />
                                }
                            </TouchableOpacity>
                        </View>

                        {/* Confirmar contraseña (solo en registro) */}
                        {!isLogin && (
                            <View style={styles.inputWrapper}>
                                <Lock size={18} color={colors.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="Confirmar contraseña"
                                    placeholderTextColor={colors.textSecondary}
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showPassword}
                                    autoCapitalize="none"
                                    returnKeyType="done"
                                    onSubmitEditing={Keyboard.dismiss}
                                />
                            </View>
                        )}

                        {/* Botón ¿Olvidaste tu contraseña? (solo en login) */}
                        {isLogin && (
                            <TouchableOpacity style={styles.forgotBtn} onPress={handleForgotPassword}>
                                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                            </TouchableOpacity>
                        )}

                        {/* Botón principal */}
                        <TouchableOpacity
                            style={[styles.mainButton, isLoading && styles.mainButtonDisabled]}
                            onPress={handleEmailAuth}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color={colors.white} />
                            ) : (
                                <Text style={styles.mainButtonText}>
                                    {isLogin ? 'Entrar' : 'Crear cuenta'}
                                </Text>
                            )}
                        </TouchableOpacity>


                        {/* 
                        // Temporalmente oculto: Continuar con Google
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>o continúa con</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.googleButton}
                            disabled={!request || isLoading}
                            onPress={() => promptAsync()}
                        >
                            <Image
                                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/2991/2991148.png' }}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.googleButtonText}>Google</Text>
                        </TouchableOpacity> 
                        */}
                    </View>

                    {/* Features */}
                    <View style={styles.features}>
                        <FeatureItem icon={<ShieldCheck size={16} color={colors.primary} />} text="Datos seguros y privados" />
                        <FeatureItem icon={<Sparkles size={16} color={colors.primary} />} text="Sincronización en la nube" />
                    </View>

                    <Text style={styles.privacyNote}>
                        Al continuar, aceptas nuestros Términos y Política de Privacidad.
                    </Text>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const FeatureItem = ({ icon, text }) => (
    <View style={styles.featureItem}>
        {icon}
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },

    logoContainer: { alignItems: 'center', marginTop: 40, marginBottom: 32 },
    iconCircle: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1, borderColor: colors.primary,
    },
    appName: { fontSize: 30, fontWeight: '900', color: colors.text, letterSpacing: 1 },
    tagline: { fontSize: 15, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },

    formCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20,
    },

    // Selector de modo
    modeSelector: {
        flexDirection: 'row',
        backgroundColor: colors.background,
        borderRadius: 14,
        padding: 4,
        marginBottom: 20,
    },
    modeBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 10, gap: 6,
    },
    modeBtnActive: { backgroundColor: colors.primary },
    modeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    modeBtnTextActive: { color: colors.white },

    // Inputs
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 14,
        marginBottom: 12,
        height: 52,
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: colors.text },
    eyeBtn: { padding: 4 },
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: 20,
        marginTop: -4,
    },
    forgotText: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '600',
    },

    // Botón principal
    mainButton: {
        backgroundColor: colors.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
        marginBottom: 16,
    },
    mainButtonDisabled: { opacity: 0.6 },
    mainButtonText: { color: colors.white, fontSize: 16, fontWeight: '700' },

    // Separador
    divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { marginHorizontal: 12, fontSize: 12, color: colors.textSecondary },

    // Botón Google
    googleButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        backgroundColor: colors.white,
        borderRadius: 14, paddingVertical: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
        gap: 10,
    },
    googleIcon: { width: 20, height: 20 },
    googleButtonText: { color: '#333', fontSize: 15, fontWeight: '700' },

    // Features
    features: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 16,
    },
    featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    featureText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },

    privacyNote: {
        fontSize: 11, color: colors.textSecondary,
        textAlign: 'center', opacity: 0.6,
    },
});

export default LoginScreen;
