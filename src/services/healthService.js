import {
    initialize,
    requestPermission,
    readRecords,
    getSdkStatus,
    SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { Platform, Alert, Linking } from 'react-native';

/**
 * Small helper: wait ms milliseconds
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Servicio para gestionar la sincronización con Health Connect (Android)
 */
export const HealthService = {
    /**
     * Verifica si Health Connect está disponible en el dispositivo
     */
    checkAvailability: async () => {
        if (Platform.OS !== 'android') return false;
        try {
            const status = await getSdkStatus();
            if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
                Alert.alert(
                    'Health Connect no disponible',
                    'Tu dispositivo no soporta Health Connect. Necesitas Android 14+ o instalar la app Health Connect desde Play Store.',
                    [
                        { text: 'Instalar', onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata') },
                        { text: 'Cancelar', style: 'cancel' }
                    ]
                );
                return false;
            }
            if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) {
                Alert.alert(
                    'Actualización requerida',
                    'Necesitas actualizar Health Connect desde Play Store.',
                    [
                        { text: 'Actualizar', onPress: () => Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata') },
                        { text: 'Cancelar', style: 'cancel' }
                    ]
                );
                return false;
            }
            return status === SdkAvailabilityStatus.SDK_AVAILABLE;
        } catch (error) {
            console.error('Error checking Health Connect availability:', error);
            return false;
        }
    },

    /**
     * Inicializa el cliente y solicita permisos para leer y escribir peso.
     * Includes retry logic to handle the infamous lateinit crash
     * when the Activity hasn't fully registered the permission launcher yet.
     */
    requestWeightPermissions: async () => {
        if (Platform.OS !== 'android') return false;

        // Retry up to 3 times with increasing delays
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                const isInitialized = await initialize();
                if (!isInitialized) {
                    console.warn(`Health Connect init failed on attempt ${attempt}`);
                    if (attempt < 3) { await wait(800 * attempt); continue; }
                    return false;
                }

                // Small delay to let the Activity register the permission launcher
                await wait(500 * attempt);

                const permissions = [
                    { accessType: 'read', recordType: 'Weight' },
                    { accessType: 'write', recordType: 'Weight' },
                ];

                const grantedPermissions = await requestPermission(permissions);
                // Al menos el permiso de lectura tiene que estar concedido
                const hasRead = grantedPermissions.some(
                    p => p.recordType === 'Weight' && p.accessType === 'read'
                );
                return hasRead || grantedPermissions.length > 0;
            } catch (error) {
                console.warn(`Health Connect permission attempt ${attempt} failed:`, error?.message || error);
                if (attempt < 3) {
                    await wait(1000 * attempt);
                } else {
                    console.error('All Health Connect permission attempts failed:', error);
                    return false;
                }
            }
        }
        return false;
    },

    /**
     * Lee el último registro de peso de los últimos 30 días
     */
    getLatestWeight: async () => {
        if (Platform.OS !== 'android') return null;
        try {
            const now = new Date();
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);

            const result = await readRecords('Weight', {
                timeRangeFilter: {
                    operator: 'between',
                    startTime: thirtyDaysAgo.toISOString(),
                    endTime: now.toISOString(),
                },
            });

            if (result && result.records && result.records.length > 0) {
                // Ordenar por fecha descendente para obtener el más reciente
                const sorted = result.records.sort(
                    (a, b) => new Date(b.time || b.startTime) - new Date(a.time || a.startTime)
                );
                const latest = sorted[0];
                // La API v3 usa weight.inKilograms, pero verificamos ambas estructuras
                const weightKg = latest.weight?.inKilograms
                    ?? latest.weight?.value
                    ?? latest.mass?.inKilograms
                    ?? null;
                if (weightKg === null) {
                    console.warn('Health Connect: peso encontrado pero formato inesperado:', JSON.stringify(latest));
                    return null;
                }
                return {
                    weight: Math.round(weightKg * 10) / 10, // Redondear a 1 decimal
                    date: latest.time || latest.startTime,
                };
            }
            return null;
        } catch (error) {
            console.error('Error reading weight from Health Connect:', error);
            return null;
        }
    },

    /**
     * Escribe un registro de peso en Health Connect
     * para que otras apps (Google Fit, Samsung Health) lo vean.
     * @param {number} weightKg - Peso en kilogramos
     */
    writeWeight: async (weightKg) => {
        if (Platform.OS !== 'android') return false;
        try {
            const { insertRecords } = require('react-native-health-connect');
            const now = new Date().toISOString();
            await insertRecords([
                {
                    recordType: 'Weight',
                    time: now,
                    weight: { value: weightKg, unit: 'kilograms' },
                },
            ]);
            console.log(`✅ Peso ${weightKg} kg escrito en Health Connect`);
            return true;
        } catch (error) {
            console.warn('Error writing weight to Health Connect:', error);
            return false;
        }
    }
};
