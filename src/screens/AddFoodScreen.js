import React, { useState, useMemo, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Alert, Modal, Animated, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Search, Plus, Camera, Sparkles, QrCode, Star, RotateCcw, ChefHat, Save, X, Clock, TrendingUp, Mic, ChevronDown, ChevronUp, Hash, Leaf, AlertCircle, Wheat, Milk, Trash2, Pencil } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { r } from '../utils/formatNumber';
import { foodCatalogue } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import CameraScanner from '../components/CameraScanner';
import BarcodeScanner from '../components/BarcodeScanner';
import VoiceScanner from '../components/VoiceScanner';
import PremiumModal from '../components/PremiumModal';

const categories = ['Todo', 'Favoritos', 'Recetas', 'Proteínas', 'Carbohidratos', 'Vegetales', 'Frutas'];

const QUICK_GRAMS = [50, 100, 150, 200, 250];

const getMealTypeLabel = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return '🌅 Desayuno';
    if (hour >= 12 && hour < 17) return '☀️ Almuerzo';
    if (hour >= 17 && hour < 20) return '🌇 Merienda';
    return '🌙 Cena';
};

const getMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'Desayuno';
    if (hour >= 12 && hour < 17) return 'Almuerzo';
    if (hour >= 17 && hour < 20) return 'Merienda';
    return 'Cena';
};

const AddFoodScreen = () => {
    const {
        addMeal, user, meals, favorites, customRecipes,
        addCustomRecipe, updateCustomRecipe, deleteCustomRecipe, toggleFavorite, globalFoodCatalogue,
        recentFoods, dismissRecentFood, setShowRecentSuggestions
    } = useApp();
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todo');
    const [quantity, setQuantity] = useState('100');
    const [selectedFood, setSelectedFood] = useState(null);
    const [expandedItemId, setExpandedItemId] = useState(null);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [barcodeVisible, setBarcodeVisible] = useState(false);
    const [voiceVisible, setVoiceVisible] = useState(false);
    const [showPremium, setShowPremium] = useState(false);
    const [showAllFoods, setShowAllFoods] = useState(false); // New state to toggle filter

    // Recipe Creator State
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [recipeName, setRecipeName] = useState('');
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [isSearchingIng, setIsSearchingIng] = useState(false);
    const [ingSearchQuery, setIngSearchQuery] = useState('');
    const [editingRecipeId, setEditingRecipeId] = useState(null);

    const getUnit = (food) => {
        if (!food) return 'g';
        const category = (food.category || '').toLowerCase();
        if (category === 'recetas') return 'ración';

        const name = (food.name || food.title || '').toLowerCase();
        const liquids = ['leche', 'zumo', 'agua', 'batido', 'bebida', 'aceite', 'vino', 'cerveza', 'caldo', 'sopa', 'kefir', 'clara de huevo', 'yogur líquido', 'café', 'te ', 'infusión', 'smoothie', 'refresco', 'cola', 'fanta', 'sprite', 'monster', 'redbull', 'sirope', 'vinagre'];
        if (name.includes('aguacate')) return 'g';
        if (liquids.some(l => name.includes(l)) || category === 'bebidas' || category === 'líquidos') {
            return 'ml';
        }
        return 'g';
    };

    // Time-aware suggestions
    const currentMealType = getMealType();
    const currentMealLabel = getMealTypeLabel();

    // Get recent foods for current time slot
    const timeAwareSuggestions = useMemo(() => {
        if (!recentFoods || recentFoods.length === 0) return [];
        const hiddenIds = user.hiddenRecentFoodIds || [];

        // Filter out hidden ones and by meal type
        const filtered = recentFoods.filter(f => !hiddenIds.includes(f.title));

        const relevant = filtered
            .filter(f => f.mealType === currentMealType)
            .sort((a, b) => (b.useCount || 1) - (a.useCount || 1))
            .slice(0, 6);

        // If not enough for current meal type, fill with most used overall
        if (relevant.length < 3) {
            const others = filtered
                .filter(f => !relevant.find(r => r.title === f.title))
                .sort((a, b) => (b.useCount || 1) - (a.useCount || 1))
                .slice(0, 6 - relevant.length);
            return [...relevant, ...others];
        }
        return relevant;
    }, [recentFoods, currentMealType, user.hiddenRecentFoodIds]);

    const checkSuitability = (food) => {
        const warnings = [];
        const dietType = user.dietType || 'omnivore';
        const userRestrictions = user.restrictions || [];

        const name = (food.name || food.title || '').toLowerCase();
        const category = (food.category || '').toLowerCase();

        // Diet Type Checks
        if (dietType === 'vegan') {
            const animalProducts = [
                'carne', 'pollo', 'pescado', 'huevo', 'leche', 'queso', 'yogur', 'miel', 'cerdo', 'ternera', 'jamón', 'filete', 'bistec', 'atún', 'salmón', 'pavo', 'merluza',
                'lubina', 'bacalao', 'gamba', 'langostino', 'pulpo', 'sepia', 'calamar', 'trucha', 'sardina', 'boquerón', 'anchoa', 'dorada', 'lenguado', 'marisco', 'molusco', 'cordero', 'conejo'
            ];
            if (animalProducts.some(p => name.includes(p))) {
                warnings.push({ type: 'danger', message: 'No es Vegano', icon: <Leaf size={12} /> });
            }
        } else if (dietType === 'vegetarian') {
            const meatProducts = [
                'carne', 'pollo', 'pescado', 'cerdo', 'ternera', 'jamón', 'filete', 'bistec', 'atún', 'salmón', 'pavo', 'merluza',
                'lubina', 'bacalao', 'gamba', 'langostino', 'pulpo', 'sepia', 'calamar', 'trucha', 'sardina', 'boquerón', 'anchoa', 'dorada', 'lenguado', 'marisco', 'molusco', 'cordero', 'conejo'
            ];
            if (meatProducts.some(p => name.includes(p))) {
                warnings.push({ type: 'danger', message: 'No es Vegetariano', icon: <AlertCircle size={12} /> });
            }
        }

        // Restrictions Checks
        if (userRestrictions.includes('celiac')) {
            const glutenProducts = ['pan', 'pasta', 'harina', 'trigo', 'centeno', 'cebada', 'galletas', 'bizcocho', 'pizza', 'pasta', 'espaguetis', 'macarrones'];
            if (glutenProducts.some(p => name.includes(p))) {
                warnings.push({ type: 'warning', message: 'Contiene Gluten', icon: <Wheat size={12} /> });
            }
        }

        if (userRestrictions.includes('lactose')) {
            const dairyProducts = ['leche', 'queso', 'yogur', 'nata', 'mantequilla', 'quesito', 'leche', 'yogurt', 'batido', 'whey'];
            if (dairyProducts.some(p => name.includes(p))) {
                warnings.push({ type: 'warning', message: 'Contiene Lactosa', icon: <Milk size={12} /> });
            }
        }

        return warnings;
    };

    const isItemSuitable = (food) => {
        if (showAllFoods) return true;
        const warnings = checkSuitability(food);
        // If there are "danger" (diet type) warnings, hide it. 
        // We can also hide "warning" (restrictions) to be stricter.
        return warnings.length === 0;
    };

    const filteredFood = globalFoodCatalogue.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todo' ||
            (selectedCategory === 'Favoritos' ? favorites.find(f => f.id === item.id) :
                selectedCategory === 'Recetas' ? false : item.category === selectedCategory);

        const matchesDiet = isItemSuitable(item);

        return matchesSearch && matchesCategory && matchesDiet;
    });

    const displayFood = selectedCategory === 'Favoritos'
        ? favorites.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : selectedCategory === 'Recetas'
            ? customRecipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()))
            : filteredFood;

    const handleCopyYesterday = () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const yesterdayMeals = meals.filter(m => m.date === yesterday);

        if (yesterdayMeals.length === 0) {
            Alert.alert('Aviso', 'No hay registros de ayer para copiar.');
            return;
        }

        Alert.alert(
            'Copiar de Ayer',
            `¿Quieres añadir los ${yesterdayMeals.length} registros de ayer a tu diario de hoy?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Copiar Todo',
                    onPress: () => {
                        yesterdayMeals.forEach(m => {
                            const { id, date, createdAt, ...mealData } = m;
                            addMeal(mealData);
                        });
                        Alert.alert('¡Éxito!', 'Registros copiados correctamente.');
                        navigation.navigate('Diario');
                    }
                }
            ]
        );
    };

    const handleToggleExpand = (item) => {
        const isRecipe = item.category === 'Recetas';
        if (expandedItemId === (item.id || item.title)) {
            setExpandedItemId(null);
            setQuantity(isRecipe ? '1' : '100');
        } else {
            setExpandedItemId(item.id || item.title);
            setSelectedFood(item);
            setQuantity(isRecipe ? '1' : '100');
        }
    };

    const handleAddMeal = (food, customGrams) => {
        const suitabilityWarnings = checkSuitability(food);

        if (suitabilityWarnings.length > 0) {
            const warningMessages = suitabilityWarnings.map(w => `• ${w.message}`).join('\n');
            Alert.alert(
                '⚠️ Conflictos Dietéticos',
                `Este alimento no coincide con tu perfil:\n\n${warningMessages}\n\n¿Quieres añadirlo de todas formas?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Añadir de todos modos', onPress: () => processAddMeal(food, customGrams) }
                ]
            );
        } else {
            processAddMeal(food, customGrams);
        }
    };

    const processAddMeal = (food, customGrams) => {
        const isRecipe = food.category === 'Recetas';
        const q = parseFloat(customGrams || quantity);

        if (isNaN(q) || q <= 0) {
            Alert.alert('Error', `Por favor introduce una cantidad válida en ${getUnit(food)}.`);
            return;
        }

        if (!isRecipe && q > 5000) {
            Alert.alert('Error', 'La cantidad parece demasiado alta. Máximo 5000g.');
            return;
        }

        const ratio = isRecipe ? q : (q / 100);

        const newMeal = {
            title: food.name || food.title,
            calories: Math.round((food.calories || 0) * ratio),
            protein: Math.round((food.protein || 0) * ratio),
            carbs: Math.round((food.carbs || 0) * ratio),
            fat: Math.round((food.fat || 0) * ratio),
            grams: q,
            isRecipe: isRecipe,
        };

        addMeal(newMeal);
        Alert.alert('✅ Añadido', `${food.name || food.title} (${q}${getUnit(food)}) al diario.`);
        setExpandedItemId(null);
        Keyboard.dismiss();
    };

    const handleQuickAddRecent = (item) => {
        const newMeal = {
            title: item.title,
            calories: item.calories || 0,
            protein: item.protein || 0,
            carbs: item.carbs || 0,
            fat: item.fat || 0,
            grams: item.grams || 100,
        };
        addMeal(newMeal);
        Alert.alert('✅ Añadido', `${item.title} al diario.`);
    };

    const handleSaveRecipe = () => {
        if (!recipeName.trim() || recipeIngredients.length === 0) return;

        const totals = recipeIngredients.reduce((acc, ing) => {
            const ratio = (ing.quantity || 100) / 100;
            return {
                calories: acc.calories + ((ing.calories || 0) * ratio),
                protein: acc.protein + ((ing.protein || 0) * ratio),
                carbs: acc.carbs + ((ing.carbs || 0) * ratio),
                fat: acc.fat + ((ing.fat || 0) * ratio),
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const recipeData = {
            name: recipeName,
            category: 'Recetas',
            ...totals,
            ingredients: recipeIngredients
        };

        if (editingRecipeId) {
            updateCustomRecipe(editingRecipeId, recipeData);
            Alert.alert('¡Actualizada!', `Receta "${recipeName}" actualizada correctamente.`);
        } else {
            const newRecipe = {
                id: 'rec-' + Date.now(),
                ...recipeData
            };
            addCustomRecipe(newRecipe);
            Alert.alert('¡Éxito!', `Receta "${newRecipe.name}" guardada.`);
        }

        setRecipeModalVisible(false);
        setRecipeName('');
        setRecipeIngredients([]);
        setEditingRecipeId(null);
    };

    const handleEditRecipe = (recipe) => {
        setEditingRecipeId(recipe.id);
        setRecipeName(recipe.name);
        setRecipeIngredients(recipe.ingredients || []);
        setRecipeModalVisible(true);
    };

    const handleDeleteRecipe = (recipe) => {
        Alert.alert(
            'Eliminar Receta',
            `¿Estás seguro de que quieres eliminar la receta "${recipe.name}"? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: () => {
                        deleteCustomRecipe(recipe.id);
                        if (expandedItemId === recipe.id) setExpandedItemId(null);
                    }
                }
            ]
        );
    };

    const openScanner = (type) => {
        if (type === 'barcode') {
            setBarcodeVisible(true);
        } else if (!user.isPro) {
            setShowPremium(true);
        } else if (type === 'camera') {
            setScannerVisible(true);
        } else if (type === 'voice') {
            setVoiceVisible(true);
        }
    };

    const renderFoodItem = ({ item }) => {
        const isExpanded = expandedItemId === (item.id || item.title);
        const isFav = favorites.find(f => f.id === item.id);
        const q = parseInt(quantity) || 100;
        const ratio = q / 100;

        return (
            <View style={[styles.foodItem, isExpanded && styles.foodItemExpanded]}>
                <TouchableOpacity
                    style={styles.foodItemHeader}
                    onPress={() => handleToggleExpand(item)}
                    activeOpacity={0.7}
                >
                    <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.listFavBtn}>
                        <Star
                            size={16}
                            color={isFav ? colors.accent : colors.textSecondary}
                            fill={isFav ? colors.accent : 'transparent'}
                        />
                    </TouchableOpacity>
                    <View style={styles.foodInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.foodName}>{item.name}</Text>
                            {/* Suitability Icons */}
                            {checkSuitability(item).map((w, idx) => (
                                <View key={idx} style={[styles.dietBadge, { backgroundColor: w.type === 'danger' ? colors.danger + '20' : colors.warning + '20' }]}>
                                    <View style={{ marginRight: 4 }}>
                                        {React.cloneElement(w.icon, { color: w.type === 'danger' ? colors.danger : colors.warning })}
                                    </View>
                                    <Text style={[styles.dietBadgeText, { color: w.type === 'danger' ? colors.danger : colors.warning }]}>
                                        {w.message}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.foodCategory}>
                            {item.category} • {r(item.calories)} {item.category === 'Recetas' ? 'kcal total' : `kcal/100${getUnit(item)}`}
                        </Text>
                    </View>
                    {isExpanded ? (
                        <ChevronUp size={18} color={colors.primary} />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            {item.category === 'Recetas' && (
                                <TouchableOpacity
                                    style={styles.deleteRecipeBtn}
                                    onPress={() => handleDeleteRecipe(item)}
                                >
                                    <Trash2 size={16} color={colors.danger} />
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.quickPlusBtn} onPress={() => handleToggleExpand(item)}>
                                <Plus size={16} color={colors.white} />
                            </TouchableOpacity>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Expanded Quick-Add Panel */}
                {isExpanded && (
                    <View style={styles.quickAddPanel}>
                        {item.category === 'Recetas' && (
                            <View style={styles.recipeActions}>
                                <TouchableOpacity
                                    style={styles.actionBtn}
                                    onPress={() => handleEditRecipe(item)}
                                >
                                    <Pencil size={14} color={colors.primary} />
                                    <Text style={styles.actionBtnText}>Editar Receta</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        {/* Macro preview */}
                        <View style={styles.macroPreviewRow}>
                            <View style={styles.macroChip}>
                                <Text style={[styles.macroChipValue, { color: colors.primary }]}>{Math.round((item.calories || 0) * ratio)}</Text>
                                <Text style={styles.macroChipLabel}>kcal</Text>
                            </View>
                            <View style={styles.macroChip}>
                                <Text style={[styles.macroChipValue, { color: colors.macronutrients.protein }]}>{Math.round((item.protein || 0) * ratio)}g</Text>
                                <Text style={styles.macroChipLabel}>Prot</Text>
                            </View>
                            <View style={styles.macroChip}>
                                <Text style={[styles.macroChipValue, { color: colors.macronutrients.carbs }]}>{Math.round((item.carbs || 0) * ratio)}g</Text>
                                <Text style={styles.macroChipLabel}>Carbs</Text>
                            </View>
                            <View style={styles.macroChip}>
                                <Text style={[styles.macroChipValue, { color: colors.macronutrients.fat }]}>{Math.round((item.fat || 0) * ratio)}g</Text>
                                <Text style={styles.macroChipLabel}>Grasa</Text>
                            </View>
                        </View>

                        {/* Servings row (human-friendly portions) */}
                        {item.servings && item.servings.length > 0 && (
                            <>
                                <Text style={styles.sectionMiniLabel}>Porciones</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servingsScroll}>
                                    {item.servings.map((s, idx) => {
                                        const isActive = parseInt(quantity) === s.grams;
                                        return (
                                            <TouchableOpacity
                                                key={`srv-${idx}`}
                                                style={[styles.servingChip, isActive && styles.servingChipActive]}
                                                onPress={() => setQuantity(String(s.grams))}
                                            >
                                                <Text style={styles.servingIcon}>{s.icon}</Text>
                                                <Text style={[styles.servingLabel, isActive && styles.servingLabelActive]}>{s.label}</Text>
                                                <Text style={[styles.servingGrams, isActive && styles.servingGramsActive]}>{s.grams}{getUnit(item)}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </>
                        )}

                        {/* Quick gram/portion selection */}
                        <Text style={styles.sectionMiniLabel}>{item.category === 'Recetas' ? 'Raciones' : 'Gramos'}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickGramsScroll}>
                            {(item.category === 'Recetas' ? [0.5, 1, 1.5, 2] : QUICK_GRAMS).map(g => (
                                <TouchableOpacity
                                    key={g}
                                    style={[styles.gramChip, parseFloat(quantity) === g && styles.gramChipActive]}
                                    onPress={() => setQuantity(String(g))}
                                >
                                    <Text style={[styles.gramChipText, parseFloat(quantity) === g && styles.gramChipTextActive]}>{g}{getUnit(item)}</Text>
                                </TouchableOpacity>
                            ))}
                            <View style={styles.customGramInput}>
                                <TextInput
                                    style={styles.customGramText}
                                    value={quantity}
                                    onChangeText={setQuantity}
                                    keyboardType="numeric"
                                    placeholder="..."
                                    placeholderTextColor={colors.textSecondary}
                                />
                                <Text style={styles.customGramUnit}>{getUnit(item).length > 2 ? getUnit(item).substring(0, 3) : getUnit(item)}</Text>
                            </View>
                        </ScrollView>

                        <TouchableOpacity
                            style={styles.confirmAddBtn}
                            onPress={() => handleAddMeal(item)}
                        >
                            <Plus size={16} color={colors.white} />
                            <Text style={styles.confirmAddText}>Añadir {quantity}{getUnit(item)} al Diario</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    // Decide what to show as the header: suggestions or nothing
    const showSuggestions = user.showRecentSuggestions !== false && searchQuery.length === 0 && selectedCategory === 'Todo' && timeAwareSuggestions.length > 0;

    const ListHeader = () => (
        <>
            {showSuggestions && (
                <View style={styles.suggestionsSection}>
                    <View style={styles.suggestionsHeader}>
                        <Clock size={16} color={colors.accent} />
                        <Text style={styles.suggestionsTitle}>Comunes para {currentMealLabel}</Text>
                        <TouchableOpacity onPress={() => setShowRecentSuggestions(false)} style={styles.dismissBtn}>
                            <X size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
                        {timeAwareSuggestions.map((item, idx) => (
                            <TouchableOpacity
                                key={`sug-${idx}`}
                                style={styles.suggestionCard}
                                onPress={() => handleQuickAddRecent(item)}
                                onLongPress={() => Alert.alert(item.title, `${r(item.calories)} kcal • ${item.grams || 100}${getUnit({ title: item.title, category: '' })}\nP: ${r(item.protein)}g | C: ${r(item.carbs)}g | G: ${r(item.fat)}g`)}
                            >
                                <TouchableOpacity
                                    style={styles.removeSugBtn}
                                    onPress={() => dismissRecentFood(item.title)}
                                >
                                    <X size={12} color={colors.textSecondary} />
                                </TouchableOpacity>
                                <Text style={styles.suggestionName} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.suggestionCals}>{r(item.calories)} kcal</Text>
                                {(item.useCount || 0) > 1 && (
                                    <View style={styles.useCountBadge}>
                                        <TrendingUp size={10} color={colors.primary} />
                                        <Text style={styles.useCountText}>×{item.useCount}</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </>
    );

    return (
        <View style={styles.container}>
            <CameraScanner visible={scannerVisible} onClose={() => setScannerVisible(false)} />
            <BarcodeScanner visible={barcodeVisible} onClose={() => setBarcodeVisible(false)} />
            <VoiceScanner visible={voiceVisible} onClose={() => setVoiceVisible(false)} />
            <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />

            {/* Omni Search Bar with integrated scanner icons */}
            <View style={styles.omniSearchContainer}>
                <View style={styles.omniSearchBar}>
                    <Search size={18} color={colors.textSecondary} />
                    <TextInput
                        style={styles.omniSearchInput}
                        placeholder="Buscar alimento..."
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                            <X size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                    <View style={styles.omniDivider} />
                    <TouchableOpacity style={styles.omniIconBtn} onPress={() => openScanner('camera')}>
                        <Sparkles size={18} color={user.isPro ? colors.primary : colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.omniIconBtn} onPress={() => openScanner('voice')}>
                        <Mic size={18} color={user.isPro ? colors.macronutrients.carbs : colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.omniIconBtn} onPress={() => openScanner('barcode')}>
                        <QrCode size={18} color={colors.accent} />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyYesterday}>
                    <RotateCcw size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={{ height: 44, marginBottom: 4 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
                    {categories.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            style={[
                                styles.categoryTab,
                                selectedCategory === cat && styles.categoryTabActive
                            ]}
                            onPress={() => setSelectedCategory(cat)}
                        >
                            <Text style={[
                                styles.categoryText,
                                selectedCategory === cat && styles.categoryTextActive
                            ]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                    {displayFood.length} {displayFood.length === 1 ? 'alimento encontrado' : 'alimentos encontrados'}
                </Text>
                {(user.dietType !== 'omnivore' || user.restrictions?.length > 0) && (
                    <TouchableOpacity
                        style={[styles.filterToggle, showAllFoods && styles.filterToggleActive]}
                        onPress={() => setShowAllFoods(!showAllFoods)}
                    >
                        <Text style={[styles.filterToggleText, showAllFoods && styles.filterToggleTextActive]}>
                            {showAllFoods ? 'Ver filtrados' : 'Ver todos'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={displayFood}
                keyExtractor={(item) => item.id || item.title || String(Math.random())}
                renderItem={renderFoodItem}
                contentContainerStyle={styles.foodList}
                ListHeaderComponent={ListHeader}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron alimentos</Text>}
                keyboardShouldPersistTaps="handled"
            />

            {/* Float Button for Recipes */}
            <TouchableOpacity
                style={styles.recipeFab}
                onPress={() => setRecipeModalVisible(true)}
            >
                <ChefHat size={26} color={colors.white} />
            </TouchableOpacity>

            {/* Recipe Creator Modal */}
            <Modal visible={recipeModalVisible} animationType="slide">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <SafeAreaView style={styles.modalFull}>
                        <View style={styles.recipeHeader}>
                            <TouchableOpacity onPress={() => {
                                setRecipeModalVisible(false);
                                setEditingRecipeId(null);
                                setRecipeName('');
                                setRecipeIngredients([]);
                            }}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                            <Text style={styles.recipeModalTitle}>
                                {editingRecipeId ? 'Editar Receta' : 'Nueva Receta'}
                            </Text>
                            <TouchableOpacity onPress={handleSaveRecipe}>
                                <Save size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ padding: 20 }} keyboardShouldPersistTaps="handled">
                            <Text style={styles.inputLabel}>Nombre de la Receta</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="Ej: Batido Power"
                                placeholderTextColor={colors.textSecondary}
                                value={recipeName}
                                onChangeText={setRecipeName}
                                returnKeyType="done"
                            />

                            <View style={styles.ingSectionHeader}>
                                <Text style={styles.ingSectionTitle}>Ingredientes</Text>
                                <TouchableOpacity style={styles.addIngBtn} onPress={() => setIsSearchingIng(true)}>
                                    <Plus size={18} color={colors.white} />
                                    <Text style={styles.addIngText}>Añadir</Text>
                                </TouchableOpacity>
                            </View>

                            {recipeIngredients.map(ing => (
                                <View key={ing.id} style={styles.ingItem}>
                                    <Text style={styles.ingName}>{ing.name}</Text>
                                    <View style={styles.ingRight}>
                                        <TextInput
                                            style={styles.ingInput}
                                            keyboardType="numeric"
                                            value={ing.quantity.toString()}
                                            onChangeText={(v) => setRecipeIngredients(prev => prev.map(i => i.id === ing.id ? { ...i, quantity: parseInt(v) || 0 } : i))}
                                            returnKeyType="done"
                                        />
                                        <Text style={styles.ingUnit}>{getUnit(ing)}</Text>
                                        <TouchableOpacity onPress={() => setRecipeIngredients(prev => prev.filter(i => i.id !== ing.id))}>
                                            <X size={16} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        {isSearchingIng && (
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, paddingTop: 50 }]}>
                                <View style={styles.searchHeader}>
                                    <TextInput
                                        style={styles.searchInputIng}
                                        placeholder="Buscar ingrediente..."
                                        autoFocus
                                        value={ingSearchQuery}
                                        onChangeText={setIngSearchQuery}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity onPress={() => setIsSearchingIng(false)}>
                                        <Text style={{ color: colors.primary }}>Cerrar</Text>
                                    </TouchableOpacity>
                                </View>
                                <FlatList
                                    data={globalFoodCatalogue.filter(f => f.name.toLowerCase().includes(ingSearchQuery.toLowerCase()) && isItemSuitable(f))}
                                    keyExtractor={f => f.id}
                                    keyboardShouldPersistTaps="handled"
                                    renderItem={({ item }) => (
                                        <TouchableOpacity
                                            style={styles.searchRes}
                                            onPress={() => {
                                                setRecipeIngredients([...recipeIngredients, { ...item, quantity: 100 }]);
                                                setIsSearchingIng(false);
                                                setIngSearchQuery('');
                                            }}
                                        >
                                            <Text style={styles.resName}>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                />
                            </View>
                        )}
                    </SafeAreaView>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    // ── Omni Search Bar ──
    omniSearchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    omniSearchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingHorizontal: 14,
        height: 50,
        borderWidth: 1,
        borderColor: colors.border,
    },
    omniSearchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
        marginLeft: 8,
    },
    clearBtn: {
        padding: 4,
    },
    omniDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
        marginHorizontal: 8,
    },
    omniIconBtn: {
        padding: 6,
    },
    copyBtn: {
        marginLeft: 10,
        backgroundColor: colors.card,
        width: 46,
        height: 46,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    // ── Categories ──
    categoryList: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    categoryTab: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 14,
        backgroundColor: colors.card,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryTabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: colors.white,
    },
    // ── Suggestions Section ──
    suggestionsSection: {
        marginBottom: 16,
    },
    suggestionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    suggestionsTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
    },
    dismissBtn: {
        padding: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    suggestionsScroll: {
        flexDirection: 'row',
    },
    suggestionCard: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: 12,
        marginRight: 10,
        minWidth: 110,
        maxWidth: 140,
        borderWidth: 1,
        borderColor: colors.border,
        position: 'relative',
    },
    removeSugBtn: {
        position: 'absolute',
        top: 6,
        right: 6,
        padding: 4,
        zIndex: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
    },
    suggestionName: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    suggestionCals: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    useCountBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 6,
        opacity: 0.7,
    },
    useCountText: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: '700',
    },
    // ── Food List ──
    foodList: {
        padding: 16,
        paddingBottom: 100,
    },
    foodItem: {
        backgroundColor: colors.card,
        borderRadius: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    foodItemExpanded: {
        borderColor: colors.primary,
        backgroundColor: 'rgba(16, 185, 129, 0.04)',
    },
    foodItemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    listFavBtn: {
        padding: 6,
        marginRight: 6,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    foodCategory: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    quickPlusBtn: {
        backgroundColor: colors.primary,
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ── Quick Add Panel ──
    quickAddPanel: {
        paddingHorizontal: 14,
        paddingBottom: 14,
    },
    macroPreviewRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        padding: 10,
    },
    macroChip: {
        alignItems: 'center',
    },
    macroChipValue: {
        fontSize: 15,
        fontWeight: '800',
    },
    macroChipLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600',
        marginTop: 2,
    },
    // ── Servings (Porciones Inteligentes) ──
    sectionMiniLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
        marginTop: 4,
    },
    servingsScroll: {
        marginBottom: 10,
    },
    servingChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        borderWidth: 1.5,
        borderColor: colors.border,
        gap: 5,
    },
    servingChipActive: {
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderColor: colors.accent,
    },
    servingIcon: {
        fontSize: 16,
    },
    servingLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.text,
    },
    servingLabelActive: {
        color: colors.accent,
    },
    servingGrams: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    servingGramsActive: {
        color: colors.accent,
    },
    quickGramsScroll: {
        marginBottom: 12,
    },
    gramChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.background,
        marginRight: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    gramChipActive: {
        backgroundColor: colors.primaryLight,
        borderColor: colors.primary,
    },
    gramChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
    },
    gramChipTextActive: {
        color: colors.primary,
    },
    customGramInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 10,
        paddingHorizontal: 10,
        borderWidth: 1,
        borderColor: colors.border,
        minWidth: 70,
    },
    customGramText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary,
        width: 40,
        textAlign: 'center',
    },
    customGramUnit: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '700',
    },
    confirmAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: colors.primary,
        borderRadius: 12,
        paddingVertical: 12,
    },
    confirmAddText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 14,
    },
    // ── Empty & Misc ──
    emptyText: {
        textAlign: 'center',
        marginTop: 40,
        color: colors.textSecondary,
    },
    recipeFab: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    // ── Recipe Modal ──
    modalFull: {
        flex: 1,
        backgroundColor: colors.background,
    },
    recipeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.card,
    },
    recipeModalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    inputLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    formInput: {
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 8,
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ingSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    ingSectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    addIngBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 5,
    },
    addIngText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    ingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
    },
    ingName: {
        color: colors.text,
        fontWeight: '600',
    },
    ingRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    ingInput: {
        backgroundColor: colors.background,
        color: colors.primary,
        fontWeight: '800',
        paddingHorizontal: 8,
        borderRadius: 5,
        width: 50,
        textAlign: 'center',
    },
    ingUnit: {
        color: colors.textSecondary,
        fontSize: 12,
    },
    searchHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        gap: 15,
    },
    searchInputIng: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 10,
        color: colors.text,
    },
    searchRes: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    resName: {
        color: colors.text,
    },
    dietBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    dietBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    deleteRecipeBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: colors.danger + '10',
    },
    resultsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    resultsCount: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    filterToggle: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterToggleActive: {
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
    },
    filterToggleText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '700',
    },
    filterToggleTextActive: {
        color: colors.primary,
    },
    recipeActions: {
        flexDirection: 'row',
        marginBottom: 15,
        gap: 10,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: colors.primary + '15',
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    actionBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
    },
});

export default AddFoodScreen;
