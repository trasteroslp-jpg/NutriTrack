import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Alert, Image, TextInput } from 'react-native';
import { ChefHat, Settings, Info, CheckCircle2, XCircle, RotateCcw, UtensilsCrossed, Sparkles, Plus } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';

const DIETARY_RESTRICTIONS = [
    'Carne Roja', 'Pescado', 'Marisco', 'Pollo', 'Huevos', 'Lácteos',
    'Gluten', 'Frutos Secos', 'Legumbres', 'Champiñones', 'Cebolla', 'Ajo'
];

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const DietsScreen = () => {
    const { user, weeklyDiet, setWeeklyDiet, toggleDislikedFood, addMeal } = useApp();
    const { width } = useWindowDimensions();
    const [activeDay, setActiveDay] = useState('Lunes');
    const [mode, setMode] = useState('plan'); // 'plan' or 'settings'
    const [expandedMeal, setExpandedMeal] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const [customDisliked, setCustomDisliked] = useState('');

    const getMacrosFromCals = (cals, ratios) => {
        const p = Math.round((cals * (ratios.protein / 100)) / 4);
        const c = Math.round((cals * (ratios.carbs / 100)) / 4);
        const f = Math.round((cals * (ratios.fat / 100)) / 9);
        return { p, c, f };
    };

    const generateDiet = () => {
        setLoading(true);
        // Pequeño delay artificial para dar sensación de cálculo inteligente
        setTimeout(() => {
            const diet = {};
            const totalGoal = user.goalCalories;
            const ratios = user.macros || { protein: 30, carbs: 40, fat: 30 };
            const dist = { Desayuno: 0.20, Almuerzo: 0.35, Merienda: 0.15, Cena: 0.20, Snack: 0.10 };

            const library = {
                Desayuno: [
                    { title: 'Tostada con Aguacate y Huevo', ing: [{ n: 'Pan Integral', b: 60 }, { n: 'Aguacate', b: 50 }, { n: 'Huevo', b: 60 }], steps: ['Tostar el pan.', 'Aplastar el aguacate.', 'Poner el huevo encima.'], tags: ['vegetarian'] },
                    { title: 'Bol de Avena y Frutos Rojos', ing: [{ n: 'Avena', b: 50 }, { n: 'Bebida de Almendras', b: 200 }, { n: 'Arándanos', b: 40 }], steps: ['Cocer la avena con leche.', 'Añadir frutos rojos.'], tags: ['vegan', 'vegetarian', 'lactose-free'] },
                    { title: 'Tortitas de Plátano y Avena', ing: [{ n: 'Plátano', b: 100 }, { n: 'Huevo', b: 60 }, { n: 'Avena', b: 30 }], steps: ['Chafar el plátano.', 'Mezclar con huevo y avena.', 'Hacer a la plancha.'], tags: ['vegetarian'] },
                    { title: 'Yogur de Coco con Granola', ing: [{ n: 'Yogur Coco', b: 125 }, { n: 'Granola sin gluten', b: 30 }, { n: 'Kiwi', b: 80 }], steps: ['Mezclar en un bol.'], tags: ['vegan', 'vegetarian', 'lactose-free', 'gluten-free'] },
                    { title: 'Revuelto de Tofu con Cúrcuma', ing: [{ n: 'Tofu firme', b: 150 }, { n: 'Espinacas', b: 50 }, { n: 'Pan sin gluten', b: 40 }], steps: ['Desmigar el tofu.', 'Saltear con cúrcuma y espinacas.'], tags: ['vegan', 'vegetarian', 'lactose-free', 'gluten-free'] }
                ],
                Almuerzo: [
                    { title: 'Pollo Asado con Verduras', ing: [{ n: 'Pechuga de Pollo', b: 150 }, { n: 'Brócoli', b: 100 }, { n: 'Patata', b: 120 }], steps: ['Sazonar el pollo.', 'Hornear 20 min a 200°C.', 'Hacer verduras al vapor.'], tags: ['omnivore', 'gluten-free', 'lactose-free'] },
                    { title: 'Salmón a la Plancha', ing: [{ n: 'Salmón', b: 150 }, { n: 'Espárragos', b: 100 }, { n: 'Arroz Integral', b: 70 }], steps: ['Hacer el salmón a la plancha.', 'Cocer el arroz.', 'Saltear espárragos.'], tags: ['omnivore', 'gluten-free', 'lactose-free'] },
                    { title: 'Lentejas con Verduras y Arroz', ing: [{ n: 'Lentejas cocidas', b: 200 }, { n: 'Espinacas', b: 50 }, { n: 'Arroz', b: 30 }], steps: ['Saltear verduras.', 'Añadir lentejas y calentar.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] },
                    { title: 'Pavo con Quinoa y Calabaza', ing: [{ n: 'Solomillo de Pavo', b: 150 }, { n: 'Quinoa', b: 60 }, { n: 'Calabaza', b: 100 }], steps: ['Hacer pavo a la plancha.', 'Cocer quinoa.', 'Asar calabaza.'], tags: ['omnivore', 'gluten-free', 'lactose-free'] },
                    { title: 'Curry de Garbanzos y Coco', ing: [{ n: 'Garbanzos', b: 200 }, { n: 'Leche de Coco', b: 100 }, { n: 'Espinacas', b: 80 }], steps: ['Cocinar garbanzos con coco y especias.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] }
                ],
                Merienda: [
                    { title: 'Proteína Vegetal con Fruta', ing: [{ n: 'Proteína de Guisante', b: 30 }, { n: 'Agua/Bebida soja', b: 200 }, { n: 'Nueces', b: 20 }], steps: ['Mezclar en un shaker.'], tags: ['vegan', 'vegetarian', 'lactose-free', 'gluten-free'] },
                    { title: 'Hummus con Bastones de Pepino', ing: [{ n: 'Hummus', b: 80 }, { n: 'Pepino', b: 150 }], steps: ['Cortar y mojar.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] },
                    { title: 'Manzana con Crema de Almendras', ing: [{ n: 'Manzana', b: 150 }, { n: 'Crema Almendras', b: 15 }], steps: ['Cortar manzana y untar.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] },
                    { title: 'Tortitas de Arroz con Aguacate', ing: [{ n: 'Tortita arroz', b: 20 }, { n: 'Aguacate', b: 50 }], steps: ['Montar y servir.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] }
                ],
                Cena: [
                    { title: 'Ensalada de Tempeh y Canónigos', ing: [{ n: 'Tempeh a la plancha', b: 120 }, { n: 'Nueces', b: 15 }, { n: 'Canónigos', b: 100 }], steps: ['Hacer el tempeh.', 'Mezclar con ensalada.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] },
                    { title: 'Merluza al Horno con Patatas', ing: [{ n: 'Merluza', b: 180 }, { n: 'Calabacín', b: 150 }], steps: ['Hornear y servir.'], tags: ['omnivore', 'gluten-free', 'lactose-free'] },
                    { title: 'Revuelto de Claras y Champiñones', ing: [{ n: 'Claras de huevo', b: 200 }, { n: 'Champiñones', b: 100 }], steps: ['Saltear todo.'], tags: ['vegetarian', 'gluten-free', 'lactose-free'] },
                    { title: 'Crema de Calabaza y Semillas', ing: [{ n: 'Calabaza', b: 250 }, { n: 'Semillas de Girasol', b: 15 }], steps: ['Triturar y añadir semillas.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] }
                ],
                Snack: [
                    { title: 'Fruta de Temporada', ing: [{ n: 'Pieza de fruta', b: 100 }], steps: ['Lavar y comer.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] },
                    { title: 'Almendras Naturales', ing: [{ n: 'Almendras', b: 20 }], steps: ['Comer crudas.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] },
                    { title: 'Edamames al vapor', ing: [{ n: 'Edamames', b: 100 }], steps: ['Cocer 5 min.'], tags: ['vegan', 'vegetarian', 'gluten-free', 'lactose-free'] }
                ]
            };

            DAYS.forEach((day, i) => {
                const dayMeals = [];
                const types = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena', 'Snack'];

                types.forEach(type => {
                    let options = library[type];

                    // SMART FILTERING
                    const diet = user.dietType || 'omnivore';
                    const restr = user.restrictions || [];

                    // Filter by DIET TYPE
                    if (diet === 'vegan') {
                        options = options.filter(o => o.tags?.includes('vegan'));
                    } else if (diet === 'vegetarian') {
                        options = options.filter(o => o.tags?.includes('vegetarian'));
                    }

                    // Filter by RESTRICTIONS (Celiac, Lactose)
                    if (restr.includes('celiac')) {
                        options = options.filter(o => o.tags?.includes('gluten-free'));
                    }
                    if (restr.includes('lactose')) {
                        options = options.filter(o => o.tags?.includes('lactose-free'));
                    }

                    // Fallback si no hay opciones para esa dieta extrema
                    const template = options.length > 0 ? options[i % options.length] : library[type][0];

                    const mealCals = Math.round(totalGoal * dist[type]);
                    const macros = getMacrosFromCals(mealCals, ratios);
                    const scale = mealCals / 400; // Base para escalado

                    dayMeals.push({
                        id: `${day}-${type}`,
                        time: type,
                        title: template.title,
                        cals: mealCals,
                        p: macros.p,
                        c: macros.c,
                        f: macros.f,
                        isAdapted: options.length > 0,
                        ingredients: template.ing.map(item => {
                            const name = item.n.toLowerCase();
                            const isLiquid = ['leche', 'bebida', 'zumo', 'agua', 'caldo', 'aceite', 'batido', 'kefir', 'clara'].some(l => name.includes(l)) && !name.includes('aguacate');

                            // Caso especial para Huevos: unidades en lugar de gramos
                            if (name.includes('huevo') && !name.includes('clara')) {
                                const units = Math.max(1, Math.round((item.b * scale) / 60));
                                return {
                                    n: item.n,
                                    q: `${units} ${units === 1 ? 'unidad' : 'unidades'}`
                                };
                            }

                            const unit = (item.n.includes('Pieza') && Math.round(item.b * scale) < 10) ? 'u' : (isLiquid ? 'ml' : 'g');
                            return {
                                n: item.n,
                                q: Math.round(item.b * scale) + unit
                            };
                        }),
                        steps: template.steps
                    });
                });
                diet[day] = dayMeals;
            });

            setWeeklyDiet(diet);
            setLoading(false);
            Alert.alert('¡Plan Optimizado!', 'Hemos calculado tu dieta de 5 comidas basada en tus objetivos.');
        }, 1200);
    };

    const handleEatMeal = (meal) => {
        const newMeal = {
            title: meal.title,
            calories: meal.cals,
            protein: meal.p,
            carbs: meal.c,
            fat: meal.f,
            type: meal.time,
            grams: 1,
            isRecipe: true,
        };
        addMeal(newMeal);
        Alert.alert('¡Buen provecho!', `Has registrado "${meal.title}" en tu diario de hoy.`);
    };

    const getShoppingList = () => {
        const list = {};
        if (!weeklyDiet) return [];
        Object.values(weeklyDiet).forEach(dayMeals => {
            if (!dayMeals) return;
            dayMeals.forEach(meal => {
                if (!meal || !meal.ingredients) return;
                meal.ingredients.forEach(ing => {
                    const name = ing.n.toLowerCase();
                    if (list[name]) {
                        // Un poco rudimentario pero efectivo: si es la misma unidad sumamos
                        list[name].q = ing.q; // Simplificamos por ahora
                    } else {
                        list[name] = { n: ing.n, q: ing.q };
                    }
                });
            });
        });
        return Object.values(list);
    };

    const handleAddCustomDisliked = () => {
        if (!customDisliked.trim()) return;
        toggleDislikedFood(customDisliked.trim());
        setCustomDisliked('');
    };

    if (!user.isPro) {
        return (
            <View style={styles.emptyContainer}>
                <Sparkles size={60} color={colors.primary} />
                <Text style={styles.emptyTitle}>Planes NutriTrack PRO</Text>
                <Text style={styles.emptyDesc}>
                    La gestión de dietas personalizadas y lista de la compra es una funcionalidad exclusiva para usuarios PRO.
                </Text>
                <TouchableOpacity style={styles.mainButton} onPress={() => Alert.alert('NutriTrack PRO', 'Próximamente podrás suscribirte para desbloquear esta función.')}>
                    <ChefHat size={20} color={colors.white} />
                    <Text style={styles.mainButtonText}>Hacerme PRO</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!weeklyDiet && mode === 'plan') {
        return (
            <View style={styles.emptyContainer}>
                <ChefHat size={60} color={colors.primary} />
                <Text style={styles.emptyTitle}>Tu Dieta Personalizada</Text>
                <Text style={styles.emptyDesc}>
                    Generaremos un plan de lunes a viernes basado en tus {user.goalCalories} kcal diarias y tus preferencias.
                </Text>
                <TouchableOpacity style={styles.mainButton} onPress={generateDiet} disabled={loading}>
                    <Sparkles size={20} color={colors.white} />
                    <Text style={styles.mainButtonText}>{loading ? 'Calculando Nutrición...' : 'Generar Mi Plan de 5 Comidas'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.settingsLink} onPress={() => setMode('settings')}>
                    <Settings size={18} color={colors.textSecondary} />
                    <Text style={styles.settingsLinkLabel}>Ajustar mis gustos antes</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header Switch */}
            <View style={styles.modeSwitch}>
                <TouchableOpacity
                    style={[styles.modeTab, mode === 'plan' && styles.modeTabActive]}
                    onPress={() => setMode('plan')}
                >
                    <ChefHat size={20} color={mode === 'plan' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.modeTabText, mode === 'plan' && styles.modeTabTextActive]}>Mi Dieta</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.modeTab, mode === 'settings' && styles.modeTabActive]}
                    onPress={() => setMode('settings')}
                >
                    <Settings size={20} color={mode === 'settings' ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.modeTabText, mode === 'settings' && styles.modeTabTextActive]}>Preferencias</Text>
                </TouchableOpacity>
            </View>

            {mode === 'plan' ? (
                <View style={{ flex: 1 }}>
                    {/* Days Selector */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                        {DAYS.map(day => (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayChip, activeDay === day && styles.dayChipActive]}
                                onPress={() => setActiveDay(day)}
                            >
                                <Text style={[styles.dayChipText, activeDay === day && styles.dayChipTextActive]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView style={styles.content}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryVal}>{user.goalCalories}</Text>
                                <Text style={styles.summaryLab}>Objetivo Cal</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <Text style={styles.summaryVal}>5</Text>
                                <Text style={styles.summaryLab}>Comidas/día</Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <TouchableOpacity style={styles.summaryItem} onPress={() => setShowShoppingList(!showShoppingList)}>
                                <UtensilsCrossed size={18} color={colors.primary} />
                                <Text style={[styles.summaryLab, { color: colors.primary }]}>Lista Compra</Text>
                            </TouchableOpacity>
                        </View>

                        {showShoppingList && (
                            <View style={styles.shoppingListCard}>
                                <Text style={styles.shoppingTitle}>📦 Tu Lista de la Semana</Text>
                                {getShoppingList().map((item, idx) => (
                                    <View key={idx} style={styles.shoppingItem}>
                                        <View style={styles.shoppingDot} />
                                        <Text style={styles.shoppingText}>{item.n}</Text>
                                        <Text style={styles.shoppingQty}>{item.q}</Text>
                                    </View>
                                ))}
                                <TouchableOpacity style={styles.closeShop} onPress={() => setShowShoppingList(false)}>
                                    <Text style={styles.closeShopText}>Cerrar Lista</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {weeklyDiet[activeDay]?.map((meal, index) => (
                            <View key={index} style={styles.mealCard}>
                                <View style={styles.mealHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <View style={styles.timeTag}>
                                            <Text style={styles.timeTagText}>{meal.time}</Text>
                                        </View>
                                        {meal.isAdapted && (
                                            <View style={[styles.timeTag, { backgroundColor: colors.primaryLight }]}>
                                                <Text style={[styles.timeTagText, { color: colors.primary }]}>🌱 Dieta Adaptada</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.mealMacros}>
                                        <MacroSmall label="P" val={meal.p} color={colors.macronutrients.protein} />
                                        <MacroSmall label="C" val={meal.c} color={colors.macronutrients.carbs} />
                                        <MacroSmall label="G" val={meal.f} color={colors.macronutrients.fat} />
                                    </View>
                                </View>

                                <View style={styles.mealBody}>
                                    <View style={styles.titleRow}>
                                        <Text style={styles.mealTitle}>{meal.title}</Text>
                                        <TouchableOpacity
                                            style={[styles.recipeButton, expandedMeal === meal.id && styles.recipeButtonActive]}
                                            onPress={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                                        >
                                            <Sparkles size={14} color={expandedMeal === meal.id ? colors.white : colors.primary} />
                                            <Text style={[styles.recipeButtonText, expandedMeal === meal.id && styles.recipeButtonTextActive]}>
                                                {expandedMeal === meal.id ? 'Ocultar' : 'Receta'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    <View style={styles.ingredientsList}>
                                        {meal.ingredients?.map((ing, idx) => (
                                            <View key={idx} style={styles.ingredientBadge}>
                                                <Text style={styles.ingredientText}>
                                                    {ing.n}: <Text style={{ fontWeight: '800' }}>{ing.q}</Text>
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {expandedMeal === meal.id && (
                                        <View style={styles.stepsContainer}>
                                            <Text style={styles.stepsTitle}>Preparación:</Text>
                                            {meal.steps?.map((step, idx) => (
                                                <View key={idx} style={styles.stepItem}>
                                                    <View style={styles.stepNumber}>
                                                        <Text style={styles.stepNumberText}>{idx + 1}</Text>
                                                    </View>
                                                    <Text style={styles.stepText}>{step}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}

                                    <View style={styles.mealFooter}>
                                        <Text style={styles.mealCals}>{meal.cals} kcal</Text>
                                        <TouchableOpacity style={styles.checkButton} onPress={() => handleEatMeal(meal)}>
                                            <CheckCircle2 size={18} color={colors.primary} />
                                            <Text style={styles.checkButtonText}>Ya lo he comido</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity style={styles.regenerateButton} onPress={generateDiet} disabled={loading}>
                            <RotateCcw size={16} color={colors.textSecondary} />
                            <Text style={styles.regenerateText}>{loading ? 'Actualizando...' : 'Cambiar menú semanal'}</Text>
                        </TouchableOpacity>
                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            ) : (
                <ScrollView style={styles.content}>
                    <View style={styles.settingsHeader}>
                        <UtensilsCrossed size={32} color={colors.primary} />
                        <Text style={styles.settingsTitle}>Ajusta tus gustos</Text>
                        <Text style={styles.settingsDesc}>
                            Marca o escribe los alimentos que NO quieres ver en tus dietas recomendadas. NutriTrack los excluirá.
                        </Text>
                    </View>

                    <View style={styles.customAddContainer}>
                        <TextInput
                            style={styles.customInput}
                            placeholder="Ejem: Brócoli, Lentejas..."
                            placeholderTextColor={colors.textSecondary}
                            value={customDisliked}
                            onChangeText={setCustomDisliked}
                        />
                        <TouchableOpacity style={styles.addIconButton} onPress={handleAddCustomDisliked}>
                            <Plus size={20} color={colors.white} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.dislikedContainer}>
                        {DIETARY_RESTRICTIONS.map(food => {
                            const isDisliked = user.dislikedFoods?.includes(food);
                            return (
                                <TouchableOpacity
                                    key={food}
                                    style={[styles.dislikedChip, isDisliked && styles.dislikedChipActive]}
                                    onPress={() => toggleDislikedFood(food)}
                                >
                                    {isDisliked ? (
                                        <XCircle size={16} color={colors.white} style={{ marginRight: 6 }} />
                                    ) : (
                                        <View style={styles.dot} />
                                    )}
                                    <Text style={[styles.dislikedText, isDisliked && styles.dislikedTextActive]}>
                                        {food}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}

                        {user.dislikedFoods?.filter(f => !DIETARY_RESTRICTIONS.includes(f)).map(food => (
                            <TouchableOpacity
                                key={food}
                                style={[styles.dislikedChip, styles.dislikedChipActive]}
                                onPress={() => toggleDislikedFood(food)}
                            >
                                <XCircle size={16} color={colors.white} style={{ marginRight: 6 }} />
                                <Text style={[styles.dislikedText, styles.dislikedTextActive]}>
                                    {food}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.infoBox}>
                        <Info size={18} color={colors.primary} />
                        <Text style={styles.infoBoxText}>
                            Actualizamos los menús cada domingo basándonos en tu peso actual y tus gustos marcados aquí.
                        </Text>
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const MacroSmall = ({ label, val, color }) => (
    <View style={styles.macroSmallRow}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroSmallText}>{label}: {val}g</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: colors.background
    },
    emptyTitle: { fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 20 },
    emptyDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 20
    },
    mainButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 30,
        gap: 10
    },
    mainButtonText: { color: colors.white, fontWeight: '700', fontSize: 16 },
    settingsLink: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 8 },
    settingsLinkLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },

    modeSwitch: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    modeTab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        gap: 8,
        borderRadius: 12
    },
    modeTabActive: { backgroundColor: colors.primaryLight },
    modeTabText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    modeTabTextActive: { color: colors.primary },

    daysScroll: { padding: 16, flexGrow: 0 },
    dayChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.card,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border
    },
    dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    dayChipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
    dayChipTextActive: { color: colors.white },

    content: { flex: 1, padding: 16 },
    summaryRow: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center'
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryVal: { fontSize: 20, fontWeight: '800', color: colors.primary },
    summaryLab: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
    summaryDivider: { width: 1, height: 30, backgroundColor: colors.border, marginHorizontal: 5 },
    shoppingListCard: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: colors.primary,
        borderStyle: 'dashed'
    },
    shoppingTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 15 },
    shoppingItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
    shoppingDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary },
    shoppingText: { flex: 1, fontSize: 13, color: colors.text },
    shoppingQty: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
    closeShop: { marginTop: 15, alignItems: 'center', padding: 10, backgroundColor: colors.primaryLight, borderRadius: 10 },
    closeShopText: { fontSize: 12, color: colors.primary, fontWeight: '700' },

    mealCard: {
        backgroundColor: colors.card,
        borderRadius: 24,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden'
    },
    mealImage: { width: '100%', height: 180 },
    mealBody: { padding: 20 },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 20,
        paddingTop: 15
    },
    timeTag: { backgroundColor: colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    timeTagText: { fontSize: 10, color: colors.textSecondary, fontWeight: '800', textTransform: 'uppercase' },
    mealMacros: { flexDirection: 'row', gap: 10 },
    macroSmallRow: { flexDirection: 'row', alignItems: 'center' },
    macroDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
    macroSmallText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    mealTitle: { fontSize: 20, fontWeight: '800', color: colors.text, flex: 1, marginRight: 10 },
    recipeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.primary
    },
    recipeButtonActive: { backgroundColor: colors.primary },
    recipeButtonText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
    recipeButtonTextActive: { color: colors.white },
    ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
    ingredientBadge: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border
    },
    ingredientText: { fontSize: 12, color: colors.textSecondary },
    stepsContainer: {
        backgroundColor: colors.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border
    },
    stepsTitle: { fontSize: 14, fontWeight: '800', color: colors.text, marginBottom: 12 },
    stepItem: { flexDirection: 'row', gap: 12, marginBottom: 10 },
    stepNumber: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center'
    },
    stepNumberText: { fontSize: 11, color: colors.white, fontWeight: '800' },
    stepText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    mealFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 16
    },
    mealCals: { fontSize: 18, fontWeight: '800', color: colors.primary },
    checkButton: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    checkButtonText: { fontSize: 14, color: colors.primary, fontWeight: '700' },

    regenerateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        gap: 8
    },
    regenerateText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },

    settingsHeader: { alignItems: 'center', marginTop: 10, marginBottom: 30 },
    settingsTitle: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 12 },
    settingsDesc: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 20, marginTop: 8, lineHeight: 20 },

    customAddContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: 8,
        borderWidth: 1,
        borderColor: colors.border
    },
    customInput: { flex: 1, color: colors.text, paddingHorizontal: 15, fontSize: 15 },
    addIconButton: { backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    dislikedContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
    dislikedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border
    },
    dislikedChipActive: { backgroundColor: colors.danger, borderColor: colors.danger },
    dislikedText: { fontSize: 13, color: colors.text, fontWeight: '600' },
    dislikedTextActive: { color: colors.white },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginRight: 10 },

    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        padding: 16,
        borderRadius: 20,
        gap: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.primary
    },
    infoBoxText: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 18, fontStyle: 'italic' }
});

export default DietsScreen;
