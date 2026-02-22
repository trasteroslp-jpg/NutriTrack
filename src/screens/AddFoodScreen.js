import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { Search, Filter, Plus, Camera, Sparkles, QrCode, Star, RotateCcw, ChefHat, Save, X } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { foodCatalogue } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import CameraScanner from '../components/CameraScanner';
import BarcodeScanner from '../components/BarcodeScanner';
import VoiceScanner from '../components/VoiceScanner';
import { Mic } from 'lucide-react-native';
import PremiumModal from '../components/PremiumModal';

const categories = ['Todo', 'Favoritos', 'Recetas', 'Proteínas', 'Carbohidratos', 'Vegetales', 'Frutas'];

const AddFoodScreen = () => {
    const { addMeal, user, meals, favorites, customRecipes, addCustomRecipe, toggleFavorite } = useApp();
    const navigation = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todo');
    const [quantity, setQuantity] = useState('100');
    const [selectedFood, setSelectedFood] = useState(null);
    const [scannerVisible, setScannerVisible] = useState(false);
    const [barcodeVisible, setBarcodeVisible] = useState(false);
    const [voiceVisible, setVoiceVisible] = useState(false);
    const [showPremium, setShowPremium] = useState(false);

    // Recipe Creator State
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [recipeName, setRecipeName] = useState('');
    const [recipeIngredients, setRecipeIngredients] = useState([]);
    const [isSearchingIng, setIsSearchingIng] = useState(false);
    const [ingSearchQuery, setIngSearchQuery] = useState('');

    const filteredFood = foodCatalogue.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'Todo' ||
            (selectedCategory === 'Favoritos' ? favorites.find(f => f.id === item.id) :
                selectedCategory === 'Recetas' ? false : item.category === selectedCategory);
        return matchesSearch && matchesCategory;
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

    const handleSelectItem = (item) => {
        setSelectedFood(item);
    };

    const handleAddMeal = (food) => {
        const q = parseInt(quantity);

        if (isNaN(q) || q <= 0) {
            Alert.alert('Error', 'Por favor introduce una cantidad válida en gramos.');
            return;
        }

        if (q > 5000) {
            Alert.alert('Error', 'La cantidad parece demasiado alta. Máximo 5000g.');
            return;
        }

        const ratio = q / 100;

        const newMeal = {
            title: food.name,
            calories: Math.round(food.calories * ratio),
            protein: Math.round(food.protein * ratio),
            carbs: Math.round(food.carbs * ratio),
            fat: Math.round(food.fat * ratio),
            grams: q,
        };

        addMeal(newMeal);
        Alert.alert('¡Éxito!', `${food.name} añadido al diario.`);
        navigation.navigate('Diario');
    };

    const handleSaveRecipe = () => {
        if (!recipeName.trim() || recipeIngredients.length === 0) return;

        const totals = recipeIngredients.reduce((acc, ing) => {
            const ratio = ing.quantity / 100;
            return {
                calories: acc.calories + (ing.calories * ratio),
                protein: acc.protein + (ing.protein * ratio),
                carbs: acc.carbs + (ing.carbs * ratio),
                fat: acc.fat + (ing.fat * ratio),
            };
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        const newRecipe = {
            id: 'rec-' + Date.now(),
            name: recipeName,
            category: 'Recetas',
            ...totals,
            ingredients: recipeIngredients
        };

        addCustomRecipe(newRecipe);
        setRecipeModalVisible(false);
        setRecipeName('');
        setRecipeIngredients([]);
        Alert.alert('¡Éxito!', `Receta "${newRecipe.name}" guardada.`);
    };

    const renderFoodItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.foodItem, selectedFood?.id === item.id && styles.selectedFoodItem]}
            onPress={() => handleSelectItem(item)}
        >
            <TouchableOpacity onPress={() => toggleFavorite(item)} style={styles.listFavBtn}>
                <Star
                    size={18}
                    color={favorites.find(f => f.id === item.id) ? colors.accent : colors.textSecondary}
                    fill={favorites.find(f => f.id === item.id) ? colors.accent : 'transparent'}
                />
            </TouchableOpacity>
            <View style={styles.foodInfo}>
                <Text style={styles.foodName}>{item.name}</Text>
                <Text style={styles.foodCategory}>
                    {item.category} • {item.calories} {item.category === 'Recetas' ? 'kcal total' : 'kcal / 100g'}
                </Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => handleAddMeal(item)}>
                <Plus size={20} color={colors.white} />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <CameraScanner visible={scannerVisible} onClose={() => setScannerVisible(false)} />

            <BarcodeScanner visible={barcodeVisible} onClose={() => setBarcodeVisible(false)} />

            {/* AI and Barcode Headers */}
            <View style={styles.scannerRow}>
                <TouchableOpacity
                    style={[styles.scannerCard, !user.isPro && styles.scannerCardLocked]}
                    onPress={() => {
                        if (user.isPro) {
                            setScannerVisible(true);
                        } else {
                            setShowPremium(true);
                        }
                    }}
                >
                    <Sparkles size={22} color={user.isPro ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.scannerTitle, { color: user.isPro ? colors.primary : colors.textSecondary }]}>IA Vision</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.scannerCard, !user.isPro && styles.scannerCardLocked]}
                    onPress={() => {
                        if (user.isPro) {
                            setVoiceVisible(true);
                        } else {
                            setShowPremium(true);
                        }
                    }}
                >
                    <Mic size={22} color={user.isPro ? colors.macronutrients.carbs : colors.textSecondary} />
                    <Text style={[styles.scannerTitle, { color: user.isPro ? colors.macronutrients.carbs : colors.textSecondary }]}>Voz (AI)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.scannerCard, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
                    onPress={() => setBarcodeVisible(true)}
                >
                    <QrCode size={22} color={colors.accent} />
                    <Text style={[styles.scannerTitle, { color: colors.accent }]}>Barras</Text>
                </TouchableOpacity>
            </View>

            <VoiceScanner visible={voiceVisible} onClose={() => setVoiceVisible(false)} />
            <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Buscar alimento..."
                        placeholderTextColor="rgba(255, 255, 255, 0.5)"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={handleCopyYesterday}
                >
                    <RotateCcw size={20} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Categories */}
            <View style={{ height: 50, marginBottom: 10 }}>
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

            {/* Simulator Card */}
            <View style={styles.calcCard}>
                <Text style={styles.calcTitle}>
                    {selectedFood ? `Cargar: ${selectedFood.name}` : 'Simulador de Carga'}
                </Text>
                <View style={styles.calcRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Cantidad (gramos)</Text>
                        <TextInput
                            style={styles.formInput}
                            keyboardType="numeric"
                            value={quantity}
                            onChangeText={setQuantity}
                        />
                    </View>
                    <View style={styles.calcResult}>
                        <Text style={styles.resultLabel}>Total Calorías</Text>
                        <Text style={styles.resultValue}>
                            {selectedFood
                                ? Math.round((parseInt(quantity) || 0) * (selectedFood.calories / 100))
                                : 0} kcal
                        </Text>
                    </View>
                </View>
                {selectedFood && (
                    <TouchableOpacity
                        style={styles.mainAddButton}
                        onPress={() => handleAddMeal(selectedFood)}
                    >
                        <Text style={styles.mainAddButtonText}>Añadir al Diario</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={displayFood}
                keyExtractor={(item) => item.id || item.title}
                renderItem={renderFoodItem}
                contentContainerStyle={styles.foodList}
                ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron alimentos</Text>}
            />

            {/* Float Button for Recipes */}
            <TouchableOpacity
                style={styles.recipeFab}
                onPress={() => setRecipeModalVisible(true)}
            >
                <ChefHat size={28} color={colors.white} />
            </TouchableOpacity>

            {/* Recipe Creator Modal */}
            <Modal visible={recipeModalVisible} animationType="slide">
                <SafeAreaView style={styles.modalFull}>
                    <View style={styles.recipeHeader}>
                        <TouchableOpacity onPress={() => setRecipeModalVisible(false)}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                        <Text style={styles.recipeModalTitle}>Nueva Receta</Text>
                        <TouchableOpacity onPress={handleSaveRecipe}>
                            <Save size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ padding: 20 }}>
                        <Text style={styles.inputLabel}>Nombre de la Receta</Text>
                        <TextInput
                            style={styles.formInput}
                            placeholder="Ej: Batido Power"
                            placeholderTextColor={colors.textSecondary}
                            value={recipeName}
                            onChangeText={setRecipeName}
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
                                    />
                                    <Text style={styles.ingUnit}>g</Text>
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
                                />
                                <TouchableOpacity onPress={() => setIsSearchingIng(false)}>
                                    <Text style={{ color: colors.primary }}>Cerrar</Text>
                                </TouchableOpacity>
                            </View>
                            <FlatList
                                data={foodCatalogue.filter(f => f.name.toLowerCase().includes(ingSearchQuery.toLowerCase()))}
                                keyExtractor={f => f.id}
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
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scannerRow: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: 8,
        justifyContent: 'space-between',
    },
    scannerCard: {
        flex: 0.31,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
    },
    scannerTitle: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: '700',
    },
    scannerCardLocked: {
        opacity: 0.8,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    iconContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    proBadge: {
        position: 'absolute',
        top: -10,
        right: -35,
        backgroundColor: colors.accent,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    proBadgeText: {
        color: colors.white,
        fontSize: 9,
        fontWeight: '900',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.white,
    },
    filterButton: {
        marginLeft: 12,
        backgroundColor: colors.card,
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryList: {
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    categoryTab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.card,
        marginRight: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    categoryTabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    categoryText: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    categoryTextActive: {
        color: colors.white,
    },
    calcCard: {
        backgroundColor: colors.primaryLight,
        margin: 16,
        borderRadius: 16,
        padding: 16,
    },
    calcTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    calcRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
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
    calcResult: {
        marginLeft: 20,
        alignItems: 'flex-end',
    },
    resultLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    resultValue: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.primary,
    },
    mainAddButton: {
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    mainAddButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 15,
    },
    foodList: {
        padding: 16,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    selectedFoodItem: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    listFavBtn: {
        padding: 8,
        marginRight: 8,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    foodCategory: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    addButton: {
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    },
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
    }
});

export default AddFoodScreen;
