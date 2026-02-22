import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, Alert, Modal, TextInput } from 'react-native';
import { Plus, Coffee, Utensils, Moon, Apple, Calendar, Clock, ChevronRight, X, Edit2, Save, Star } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';

const DiaryScreen = () => {
    const { meals, deleteMeal, updateMeal, favorites, toggleFavorite } = useApp();
    const navigation = useNavigation();

    // Edit State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editGrams, setEditGrams] = useState('');
    const [editDate, setEditDate] = useState('');

    const handleDelete = (item) => {
        Alert.alert(
            'Eliminar Registro',
            `¿Estás seguro de que quieres eliminar "${item.title}"?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => deleteMeal(item.id) }
            ]
        );
    };

    const handleEdit = (item) => {
        setEditingMeal(item);
        setEditTitle(item.title);
        setEditGrams(item.grams?.toString() || '100');
        setEditDate(item.date);
        setEditModalVisible(true);
    };

    const saveEdit = () => {
        if (!editingMeal) return;

        const newGrams = parseInt(editGrams);
        if (isNaN(newGrams) || newGrams <= 0) {
            Alert.alert('Error', 'Introduce una cantidad válida.');
            return;
        }

        // Si tenemos los gramos originales, escalamos macros
        let updates = {
            title: editTitle,
            date: editDate,
            grams: newGrams
        };

        if (editingMeal.grams && editingMeal.grams > 0) {
            const ratio = newGrams / editingMeal.grams;
            updates.calories = Math.round(editingMeal.calories * ratio);
            updates.protein = Math.round(editingMeal.protein * ratio);
            updates.carbs = Math.round(editingMeal.carbs * ratio);
            updates.fat = Math.round(editingMeal.fat * ratio);
        }

        updateMeal(editingMeal.id, updates);
        setEditModalVisible(false);
        setEditingMeal(null);
    };

    const getMealType = (time) => {
        if (!time) return 'Snack';
        // Format can be "HH:MM" or "HH:MM AM/PM"
        let hour = 0;
        if (time.includes('AM') || time.includes('PM')) {
            let [hhmm, period] = time.split(' ');
            hour = parseInt(hhmm.split(':')[0]);
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
        } else {
            hour = parseInt(time.split(':')[0]);
        }

        if (hour >= 6 && hour < 12) return 'Desayuno';
        if (hour >= 12 && hour < 17) return 'Almuerzo';
        if (hour >= 17 && hour < 21) return 'Merienda';
        if (hour >= 21 || hour < 6) return 'Cena';
        return 'Snack';
    };

    const renderIcon = (time) => {
        const type = getMealType(time);
        switch (type) {
            case 'Desayuno': return <Coffee size={24} color={colors.primary} />;
            case 'Almuerzo': return <Utensils size={24} color={colors.secondary} />;
            case 'Merienda': return <Apple size={24} color={colors.accent} />;
            case 'Cena': return <Moon size={24} color="#A78BFA" />;
            default: return <Apple size={24} color={colors.textSecondary} />;
        }
    };

    const today = new Date().toISOString().split('T')[0];

    // Split and group meals
    const todayMeals = meals.filter(m => m.date === today);
    const historyMeals = meals.filter(m => m.date !== today);

    // Group history by date
    const historyGrouped = historyMeals.reduce((acc, meal) => {
        const dateStr = new Date(meal.date).toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(meal);
        return acc;
    }, {});

    const historySections = Object.keys(historyGrouped).map(date => ({
        title: date,
        data: historyGrouped[date],
        isHistory: true
    }));

    const sections = [
        { title: 'Hoy', data: todayMeals, isHistory: false },
        ...historySections
    ];

    const renderItem = ({ item, section }) => (
        <TouchableOpacity
            style={[styles.mealItem, section.isHistory && styles.historyItem]}
            onLongPress={() => handleDelete(item)}
            activeOpacity={0.7}
        >
            <View style={styles.mealHeader}>
                <View style={styles.iconCircle}>
                    {renderIcon(item.time)}
                </View>
                <View style={styles.mealInfo}>
                    <View style={styles.titleRow}>
                        <TouchableOpacity onPress={() => toggleFavorite(item)} style={{ marginRight: 8 }}>
                            <Star
                                size={16}
                                color={favorites.find(f => f.id === item.id) ? colors.accent : colors.textSecondary}
                                fill={favorites.find(f => f.id === item.id) ? colors.accent : 'transparent'}
                            />
                        </TouchableOpacity>
                        <Text style={styles.mealTitle}>{item.title}</Text>
                    </View>
                    <View style={styles.timeRow}>
                        <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                        <Text style={styles.mealTime}>
                            {item.time} • <Text style={{ color: colors.primary, fontWeight: '700' }}>{getMealType(item.time)}</Text>
                        </Text>
                    </View>
                </View>
                <View style={styles.rightActionRow}>
                    <View style={styles.calWrapper}>
                        <Text style={styles.mealCalories}>{item.calories}</Text>
                        <Text style={styles.calUnit}>kcal</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.editIconButton}
                        onPress={() => handleEdit(item)}
                    >
                        <Edit2 size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.deleteIconButton}
                        onPress={() => item.isHistory ? handleDelete(item) : handleDelete(item)} // Consistency
                    >
                        <X size={18} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            {!section.isHistory && (
                <View style={styles.macroRow}>
                    <View style={styles.macroTag}>
                        <View style={[styles.dot, { backgroundColor: colors.macronutrients.protein }]} />
                        <Text style={styles.macroText}>P: {item.protein}g</Text>
                    </View>
                    <View style={styles.macroTag}>
                        <View style={[styles.dot, { backgroundColor: colors.macronutrients.carbs }]} />
                        <Text style={styles.macroText}>C: {item.carbs}g</Text>
                    </View>
                    <View style={styles.macroTag}>
                        <View style={[styles.dot, { backgroundColor: colors.macronutrients.fat }]} />
                        <Text style={styles.macroText}>G: {item.fat}g</Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section }) => (
        <View style={[styles.sectionHeader, section.isHistory && styles.historyHeader]}>
            <View style={styles.sectionTitleRow}>
                {section.isHistory ? <Calendar size={18} color={colors.textSecondary} /> : <View style={styles.todayIndicator} />}
                <Text style={[styles.sectionTitle, section.isHistory && styles.historyTitle]}>
                    {section.title}
                </Text>
            </View>
            {section.isHistory && <ChevronRight size={20} color={colors.textSecondary} />}
        </View>
    );

    return (
        <View style={styles.container}>
            <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.listContent}
                stickySectionHeadersEnabled={false}
                ListEmptyComponent={<Text style={styles.emptyText}>No hay registros aún</Text>}
            />

            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('Añadir')}
            >
                <Plus size={30} color={colors.white} />
            </TouchableOpacity>

            {/* Modal de Edición */}
            <Modal
                visible={editModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Editar Registro</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Nombre del Alimento</Text>
                        <TextInput
                            style={styles.input}
                            value={editTitle}
                            onChangeText={setEditTitle}
                        />

                        <Text style={styles.label}>Cantidad (gramos)</Text>
                        <TextInput
                            style={styles.input}
                            value={editGrams}
                            onChangeText={setEditGrams}
                            keyboardType="numeric"
                        />

                        <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                        <TextInput
                            style={styles.input}
                            value={editDate}
                            onChangeText={setEditDate}
                        />

                        <TouchableOpacity style={styles.saveButton} onPress={saveEdit}>
                            <Save size={20} color={colors.white} />
                            <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.deleteLink}
                            onPress={() => {
                                setEditModalVisible(false);
                                handleDelete(editingMeal);
                            }}
                        >
                            <Text style={styles.deleteLinkText}>Eliminar este registro</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    listContent: {
        padding: 16,
        paddingBottom: 100,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    todayIndicator: {
        width: 4,
        height: 24,
        backgroundColor: colors.primary,
        borderRadius: 2,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        textTransform: 'capitalize',
    },
    historyHeader: {
        marginTop: 32,
        paddingHorizontal: 8,
    },
    historyTitle: {
        fontSize: 18,
        color: colors.textSecondary,
        marginLeft: 10,
    },
    mealItem: {
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    historyItem: {
        opacity: 0.8,
        paddingVertical: 12,
    },
    iconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealInfo: {
        flex: 1,
        marginLeft: 15,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    mealTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    mealTime: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    calWrapper: {
        alignItems: 'flex-end',
    },
    mealCalories: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.primary,
    },
    rightActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    editIconButton: {
        marginLeft: 10,
        padding: 5,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderRadius: 8,
    },
    deleteIconButton: {
        marginLeft: 10,
        padding: 5,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderRadius: 8,
    },
    calUnit: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '700',
        marginTop: -4,
    },
    macroRow: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 12,
        marginTop: 12,
        justifyContent: 'space-between',
    },
    macroTag: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    macroText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: colors.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 60,
        color: colors.textSecondary,
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    label: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: colors.text,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    saveButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 15,
        marginTop: 10,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    deleteLink: {
        alignItems: 'center',
        marginTop: 20,
    },
    deleteLinkText: {
        color: colors.danger,
        fontSize: 14,
        fontWeight: '600',
    }
});

export default DiaryScreen;
