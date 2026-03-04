export const MEAL_DISTRIBUTION = {
    'Desayuno': 0.25,
    'Almuerzo': 0.35,
    'Merienda': 0.15,
    'Cena': 0.25,
    'Snack': 0.10, // Los snacks son extras o parte de las otras comidas
};

import { r } from './formatNumber';

/**
 * Calcula los objetivos específicos para una comida basada en el perfil del usuario
 */
export const calculateMealTargets = (user, mealType) => {
    const ratio = MEAL_DISTRIBUTION[mealType] || 0.15;

    const targetCalories = user.goalCalories * ratio;
    const proteinTarget = (user.goalCalories * (user.macros?.protein / 100)) / 4 * ratio;
    const carbsTarget = (user.goalCalories * (user.macros?.carbs / 100)) / 4 * ratio;
    const fatTarget = (user.goalCalories * (user.macros?.fat / 100)) / 9 * ratio;

    return {
        calories: Math.round(targetCalories),
        protein: Math.round(proteinTarget),
        carbs: Math.round(carbsTarget),
        fat: Math.round(fatTarget),
    };
};

/**
 * Analiza una comida y devuelve un score y feedback
 */
export const analyzeMealGroup = (meals, user, mealType) => {
    if (!meals || meals.length === 0) return null;

    const actual = meals.reduce((acc, m) => ({
        calories: acc.calories + (m.calories || 0),
        protein: acc.protein + (m.protein || 0),
        carbs: acc.carbs + (m.carbs || 0),
        fat: acc.fat + (m.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const target = calculateMealTargets(user, mealType);

    // Calcular desviación
    const calDiff = (actual.calories / target.calories);

    let scoring = 'Excelente';
    let color = '#10B981'; // Green
    let percent = 0.5;
    let status = 'perfect'; // perfect, low, high

    if (calDiff < 0.8) {
        scoring = 'Bajo en Cal';
        color = '#F59E0B';
        percent = 0.15;
        status = 'low';
    } else if (calDiff > 1.2) {
        scoring = 'Excesivo';
        color = '#EF4444';
        percent = 0.85;
        status = 'high';
    }

    // Feedback Profundo de Macros
    let feedback = "";
    const pDiff = actual.protein / target.protein;
    const cDiff = actual.carbs / target.carbs;
    const fDiff = actual.fat / target.fat;

    // 1. Mensaje Principal de Calorías (Estilo más cercano y mediterráneo)
    if (status === 'high') {
        feedback = `Tu ${mealType.toLowerCase()} ha sido un poco más contundente de lo planeado. `;
    } else if (status === 'low') {
        feedback = `Tu ${mealType.toLowerCase()} ha sido bastante ligero, ideal si buscas una digestión fácil. `;
    } else {
        feedback = `¡Clavado! Este ${mealType.toLowerCase()} encaja perfectamente en tu plan mediterráneo. `;
    }

    // 2. Análisis de Macros Específicos
    const warnings = [];
    if (pDiff < 0.8) warnings.push("proteína");
    if (cDiff > 1.25) warnings.push("carbohidratos");
    if (fDiff > 1.25) warnings.push("grasas");

    if (warnings.length > 0) {
        feedback += `Podríamos ajustar un poco el aporte de ${warnings.join(' y ')} para equilibrar el plato. `;
    } else if (pDiff > 1.1) {
        feedback += "¡Excelente aporte proteico para mantener tus músculos! ";
    }

    // 3. Consejos específicos según Contexto de Comida y Dieta
    const dietType = user.dietType || 'omnivore';
    const isEarly = ['Desayuno', 'Merienda', 'Snack'].includes(mealType);

    if (pDiff < 0.8) {
        const pGap = target.protein - actual.protein;
        const eggUnits = Math.max(1, Math.round(pGap / 7)); // 1 huevo ≈ 7g proteína

        if (dietType === 'vegan') {
            if (isEarly) {
                feedback += "Para un extra de proteína matutina, prueba con crema de cacahuete, tofu revuelto o levadura nutricional. ";
            } else {
                feedback += "En la dieta mediterránea vegana, las lentejas, el garbanzo o el tempeh son tus mejores aliados ahora. ";
            }
        } else if (dietType === 'vegetarian') {
            if (isEarly) {
                feedback += `Un poco de yogur griego, queso fresco o ${eggUnits} ${eggUnits === 1 ? 'huevo' : 'huevos'} completarían genial este momento. `;
            } else {
                feedback += "Prueba a añadir legumbres, soja texturizada o una tortilla de verduras. ";
            }
        } else {
            // Omnívoro / Otros
            if (mealType === 'Desayuno') {
                feedback += `Para desayunar, busca proteínas añadiendo ${eggUnits} ${eggUnits === 1 ? 'huevo' : 'huevos'}, queso light o incluso un poco de salmón ahumado. `;
            } else if (mealType === 'Merienda' || mealType === 'Snack') {
                feedback += "Un puñado de frutos secos o un lácteo kéfir te darán el empuje proteico que falta. ";
            } else if (mealType === 'Cena') {
                feedback += "Para cenar, el pescado blanco o el pavo son opciones ligeras y ricas en proteína. ";
            } else {
                feedback += "Añade una fuente de proteína magra como pollo o legumbres para saciarte más. ";
            }
        }
    }

    if (cDiff > 1.3 && mealType === 'Cena') {
        feedback += "Como es la cena, intenta priorizar verduras sobre hidratos pesados para descansar mejor. ";
    }

    if (fDiff > 1.3) {
        feedback += "Recuerda priorizar grasas saludables como el aceite de oliva virgen o el aguacate, controlando las cantidades. ";
    }

    // 4. Conclusión y Tip Mediterráneo
    let tip = "La dieta mediterránea es equilibrio: prioriza siempre el producto fresco.";
    if (mealType === 'Desayuno') tip = "Un chorrito de aceite de oliva virgen extra en tu tostada es el mejor inicio mediterráneo.";
    else if (mealType === 'Almuerzo') tip = "Acompaña tus proteínas con una buena base de hortalizas de temporada.";
    else if (mealType === 'Cena') tip = "Las cenas ligeras ayudan a que tu cuerpo se recupere mejor durante el sueño.";
    else if (meals.some(m => m.title.toLowerCase().includes('legumbre') || m.title.toLowerCase().includes('lenteja'))) tip = "¡Excelente! Las legumbres son el pilar de la longevidad mediterránea.";

    if (status === 'high') feedback += "Intenta compensar con algo más ligero en la siguiente toma.";
    else if (status === 'low') feedback += "No olvides hidratarte bien y disfrutar de la variedad mediterránea.";
    else feedback += "¡Gran trabajo! Mantén este equilibrio el resto del día.";

    return {
        scoring,
        color,
        percent,
        feedback,
        tip,
        status,
        actual,
        target,
        mealType,
        macros: {
            pDiff, cDiff, fDiff
        }
    };
};
