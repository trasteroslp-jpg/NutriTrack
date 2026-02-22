// Versión 1.1: Notificaciones desactivadas para evitar errores en Expo Go
export const requestNotificationPermissions = async () => {
    return false;
};

export const scheduleReminder = async (title, body, trigger) => {
    return;
};

export const setupDefaultReminders = async () => {
    // Desactivado en v1.1
    return;
};
