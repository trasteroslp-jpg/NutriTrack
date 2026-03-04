/**
 * Sistema de Gamificación 2.0 - NutriTrack
 * Basado en una curva exponencial de dificultad.
 * XP requerida = 500 * (Nivel - 1)^1.8
 */

export const XP_ACTIONS = {
    LOG_MEAL: 10,
    COMPLETE_DAILY_GOAL: 50, // Cumplimiento de kcal
    STREAK_7_DAYS: 200,
    STREAK_30_DAYS: 1000,
    ADD_RECIPE: 30,
    DAILY_LOGIN: 15, // Por entrar a la app
};

const getRankName = (level) => {
    if (level <= 3) return `Hierro ${'I'.repeat(4 - level)}`;
    if (level <= 6) return `Bronce ${'I'.repeat(7 - level)}`;
    if (level <= 9) return `Plata ${'I'.repeat(10 - level)}`;
    if (level <= 12) return `Oro ${'I'.repeat(13 - level)}`;
    if (level <= 15) return `Platino ${'I'.repeat(16 - level)}`;
    if (level <= 20) return 'Esmeralda';
    if (level <= 25) return 'Rubí';
    if (level <= 35) return 'Diamante';
    if (level <= 45) return 'Maestro';
    return 'Leyenda NutriTrack';
};

const getRankColor = (level) => {
    if (level <= 3) return '#94A3B8'; // Hierro
    if (level <= 6) return '#B45309'; // Bronce
    if (level <= 9) return '#94A3B8'; // Plata
    if (level <= 12) return '#F59E0B'; // Oro
    if (level <= 15) return '#2DD4BF'; // Platino
    if (level <= 20) return '#10B981'; // Esmeralda
    if (level <= 25) return '#EF4444'; // Rubí
    if (level <= 35) return '#3B82F6'; // Diamante
    if (level <= 45) return '#8B5CF6'; // Maestro
    return '#F472B6'; // Leyenda
};

const getRankIcon = (level) => {
    if (level <= 3) return '🛡️';
    if (level <= 6) return '🥉';
    if (level <= 9) return '🥈';
    if (level <= 12) return '🥇';
    if (level <= 15) return '💠';
    if (level <= 20) return '💚';
    if (level <= 25) return '❤️';
    if (level <= 35) return '💎';
    if (level <= 45) return '🎓';
    return '👑';
};

export const getXPForLevel = (level) => {
    if (level <= 1) return 0;
    // Nivel 1 más asequible: Ajustamos la base y bajamos el exponente inicial
    if (level === 2) return 150; // De 1 a 2 con solo 150 XP
    return Math.floor(400 * Math.pow(level - 1, 1.7));
};

export const getLevelInfo = (xpInput) => {
    const totalXP = Number(xpInput) || 0;
    let level = 1;
    while (totalXP >= getXPForLevel(level + 1) && level < 100) {
        level++;
    }

    const currentLevelXP = getXPForLevel(level);
    const nextLevelXP = getXPForLevel(level + 1);
    const progress = (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);

    return {
        level,
        name: getRankName(level),
        color: getRankColor(level),
        icon: getRankIcon(level),
        currentLevelXP,
        nextLevelXP,
        progress: Math.min(progress, 0.99)
    };
};

export const LEGEND = [
    { action: 'Entrar a la app hoy', points: '+15 XP', icon: '✨' },
    { action: 'Registrar alimento', points: '+10 XP', icon: '🍎' },
    { action: 'Calorías objetivo (±10%)', points: '+50 XP', icon: '🎯' },
    { action: 'Racha de 7 días', points: '+200 XP', icon: '⚡' },
    { action: 'Racha de 30 días', points: '+1000 XP', icon: '🔥' },
    { action: 'Crear receta propia', points: '+30 XP', icon: '👨‍🍳' },
];
