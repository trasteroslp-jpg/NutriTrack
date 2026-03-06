import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { Alert, Linking } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

const ENTITLEMENT_ID = 'Libunca 2002 SL Pro';

/**
 * Inicializa el SDK de RevenueCat
 */
export const configurePurchases = async () => {
    if (isExpoGo) return;
    if (process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY) {
        Purchases.configure({
            apiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY,
        });
        // Opcional: configurar nivel de log
        if (__DEV__) {
            await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
        }
    }
};

/**
 * Identifica al usuario en el sistema de RevenueCat
 */
export const identifyUser = async (userId) => {
    if (isExpoGo) return;
    try {
        await Purchases.logIn(userId);
    } catch (e) {
        console.error('Error al identificar usuario en RevenueCat:', e);
    }
};

/**
 * Verifica si el usuario tiene una suscripción activa
 */
export const checkProStatus = async () => {
    if (isExpoGo) return false;
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e) {
        console.error('Error al verificar estado PRO:', e);
        return false;
    }
};

/**
 * Muestra el Paywall pre-diseñado de RevenueCat
 */
export const showPaywall = async () => {
    if (isExpoGo) {
        Alert.alert('Modo Desarrollo', 'El Paywall de RevenueCat no está disponible en Expo Go. Requiere una build nativa.');
        return null;
    }
    try {
        const result = await RevenueCatUI.presentPaywall({
            displayCloseButton: true,
        });

        // El resultado indica si se realizó una compra o si el usuario cerró el paywall
        console.log('Resultado del Paywall:', result);
        return result;
    } catch (e) {
        console.error('Error al mostrar el Paywall:', e);
        return null;
    }
};

/**
 * Muestra el Customer Center para gestionar suscripciones
 */
export const showCustomerCenter = async () => {
    if (isExpoGo) {
        Alert.alert('Modo Desarrollo', 'El Customer Center no está disponible en Expo Go.');
        return;
    }
    try {
        // El Customer Center es la forma más moderna de permitir cancelaciones, refunds, etc.
        await RevenueCatUI.presentCustomerCenter();
    } catch (e) {
        console.error('Error al mostrar Customer Center:', e);
        // Fallback a la URL de gestión si falla el componente nativo
        const customerInfo = await Purchases.getCustomerInfo();
        if (customerInfo.managementURL) {
            await Linking.openURL(customerInfo.managementURL);
        } else {
            Alert.alert('Info', 'Por favor, gestiona tu suscripción desde la configuración de Google Play.');
        }
    }
};

/**
 * Restaura las compras previas del usuario
 */
export const restorePurchases = async () => {
    if (isExpoGo) return false;
    try {
        const customerInfo = await Purchases.restorePurchases();
        return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    } catch (e) {
        console.error('Error al restaurar compras:', e);
        return false;
    }
};
