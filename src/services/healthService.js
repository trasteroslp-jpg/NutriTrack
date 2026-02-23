import {
    initialize,
    requestPermission,
    readRecords,
    getSdkStatus,
    SdkAvailabilityStatus,
} from 'react-native-health-connect';
import { Platform } from 'react-native';

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
            return status === SdkAvailabilityStatus.SDK_AVAILABLE;
        } catch (error) {
            console.error('Error checking Health Connect availability:', error);
            return false;
        }
    },

    /**
     * Inicializa el cliente y solicita permisos para leer el peso
     */
    requestWeightPermissions: async () => {
        if (Platform.OS !== 'android') return false;
        try {
            const isInitialized = await initialize();
            if (!isInitialized) return false;

            const permissions = [
                { accessType: 'read', recordType: 'Weight' },
            ];

            const grantedPermissions = await requestPermission(permissions);
            return grantedPermissions.length > 0;
        } catch (error) {
            console.error('Error requesting Health Connect permissions:', error);
            return false;
        }
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
                const sorted = result.records.sort((a, b) => new Date(b.time) - new Date(a.time));
                return {
                    weight: sorted[0].weight.inKilograms,
                    date: sorted[0].time,
                };
            }
            return null;
        } catch (error) {
            console.error('Error reading weight from Health Connect:', error);
            return null;
        }
    }
};
