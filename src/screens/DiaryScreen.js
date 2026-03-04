import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SectionList, Alert, Modal, TextInput, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { Plus, Coffee, Utensils, Moon, Apple, Calendar, Clock, ChevronRight, X, Edit2, Save, Star, Search, ChevronDown, ChevronUp, History } from 'lucide-react-native';
import { colors } from '../theme/colors';
import { r } from '../utils/formatNumber';
import { useApp } from '../context/AppContext';
import { useNavigation } from '@react-navigation/native';
import { analyzeMealGroup } from '../utils/coachLogic';
import MealCoach from '../components/MealCoach';
import { Calendar as RNCalendar, LocaleConfig } from 'react-native-calendars';

// Configurar locale español para el calendario
LocaleConfig.locales['es'] = {
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
    dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const DiaryScreen = () => {
    const { meals, deleteMeal, updateMeal, favorites, toggleFavorite, user } = useApp();
    const navigation = useNavigation();

    // Edit State
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingMeal, setEditingMeal] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editGrams, setEditGrams] = useState('');
    const [editDate, setEditDate] = useState('');

    // History State
    const [historySearch, setHistorySearch] = useState('');
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const [calendarModalVisible, setCalendarModalVisible] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

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

        const isRecipe = editingMeal.isRecipe || editingMeal.category === 'Recetas';
        const newQty = parseFloat(editGrams);
        if (isNaN(newQty) || newQty <= 0) {
            Alert.alert('Error', 'Introduce una cantidad válida.');
            return;
        }

        // Si tenemos la cantidad original, escalamos macros
        let updates = {
            title: editTitle,
            date: editDate,
            grams: newQty
        };

        const oldQty = editingMeal.grams || (isRecipe ? 1 : 100);
        if (oldQty > 0) {
            const ratio = newQty / oldQty;
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
        if (hour >= 17 && hour < 20) return 'Merienda';
        if (hour >= 20 || hour < 6) return 'Cena';
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

    const todayDate = new Date();
    const today = todayDate.toISOString().split('T')[0];

    const yesterdayDate = new Date();
    yesterdayDate.setDate(todayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // Split and group meals
    const todayMealsRaw = meals.filter(m => m.date === today);
    const yesterdayMeals = meals.filter(m => m.date === yesterday);
    const olderMeals = meals.filter(m => m.date !== today && m.date !== yesterday);

    const onDayPress = (day) => {
        if (!startDate || (startDate && endDate)) {
            setStartDate(day.dateString);
            setEndDate(null);
        } else if (!endDate && day.dateString > startDate) {
            setEndDate(day.dateString);
        } else {
            setStartDate(day.dateString);
            setEndDate(null);
        }
    };

    const clearDateFilter = () => {
        setStartDate(null);
        setEndDate(null);
        setHistorySearch('');
    };

    const getMarkedDates = () => {
        let marked = {};
        if (startDate) {
            marked[startDate] = { startingDay: true, color: colors.primary, textColor: 'white' };
        }
        if (endDate) {
            marked[endDate] = { endingDay: true, color: colors.primary, textColor: 'white' };
            // Llenar el rango
            let start = new Date(startDate);
            let end = new Date(endDate);
            let current = new Date(start);
            current.setDate(current.getDate() + 1);

            while (current < end) {
                const dateString = current.toISOString().split('T')[0];
                marked[dateString] = { color: colors.primary + '30', textColor: colors.primary };
                current.setDate(current.getDate() + 1);
            }
        }
        return marked;
    };

    // Group Today by Type (Reversed order for recent first)
    const mealTypesOrder = ['Snack', 'Cena', 'Merienda', 'Almuerzo', 'Desayuno'];
    const todayGrouped = todayMealsRaw.reduce((acc, meal) => {
        const type = getMealType(meal.time);
        if (!acc[type]) acc[type] = [];
        acc[type].push(meal);
        return acc;
    }, {});

    const todaySections = mealTypesOrder
        .filter(type => todayGrouped[type])
        .map(type => ({
            title: `Hoy - ${type}`,
            type,
            data: todayGrouped[type],
            isHistory: false,
            isOlder: false,
            analysis: analyzeMealGroup(todayGrouped[type], user, type)
        }));

    // Ayer section
    const yesterdaySections = yesterdayMeals.length > 0 ? [{
        title: 'Ayer',
        data: yesterdayMeals,
        isHistory: true, // Show macros but simpler
        isOlder: false
    }] : [];

    // Filtered Older Meals (Search by range or search bar)
    const filteredOlder = olderMeals.filter(m => {
        // Range Filter priority
        if (startDate && endDate) {
            return m.date >= startDate && m.date <= endDate;
        } else if (startDate && !endDate) {
            return m.date === startDate;
        }

        // Search Bar Fallback
        if (historySearch === '') return true;

        const dateObj = new Date(m.date);
        const localizedDate = dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).toLowerCase();

        return m.date.includes(historySearch) || localizedDate.includes(historySearch.toLowerCase());
    });

    // History section
    const historySection = {
        title: 'Historial',
        data: isHistoryExpanded ? filteredOlder : [],
        isHistory: true,
        isOlder: true
    };

    const sections = [
        ...todaySections,
        ...yesterdaySections,
        historySection
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
                            <Text style={{ color: colors.textSecondary }}> • {item.grams}{(item.isRecipe || item.category === 'Recetas') ? ' ración' : (item.title?.toLowerCase().includes('leche') || item.title?.toLowerCase().includes('bebida') || item.title?.toLowerCase().includes('zumo') ? 'ml' : 'g')}</Text>
                        </Text>
                    </View>
                </View>
                <View style={styles.rightActionRow}>
                    <View style={styles.calWrapper}>
                        <Text style={styles.mealCalories}>{Math.round(item.calories)}</Text>
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
                        <Text style={styles.macroText}>P: {r(item.protein)}g</Text>
                    </View>
                    <View style={styles.macroTag}>
                        <View style={[styles.dot, { backgroundColor: colors.macronutrients.carbs }]} />
                        <Text style={styles.macroText}>C: {r(item.carbs)}g</Text>
                    </View>
                    <View style={styles.macroTag}>
                        <View style={[styles.dot, { backgroundColor: colors.macronutrients.fat }]} />
                        <Text style={styles.macroText}>G: {r(item.fat)}g</Text>
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    const renderSectionHeader = ({ section }) => {
        const isToday = !section.isHistory;
        const isHistoryGroup = section.isOlder;

        if (isHistoryGroup) {
            return (
                <View style={styles.historyGroupContainer}>
                    <TouchableOpacity
                        style={styles.historyToggle}
                        onPress={() => setIsHistoryExpanded(!isHistoryExpanded)}
                    >
                        <View style={styles.historyHeaderLeft}>
                            <History size={20} color={colors.primary} />
                            <Text style={styles.historyGroupTitle}>Historial Completo</Text>
                        </View>
                        {isHistoryExpanded ? <ChevronUp size={20} color={colors.textSecondary} /> : <ChevronDown size={20} color={colors.textSecondary} />}
                    </TouchableOpacity>

                    {isHistoryExpanded && (
                        <View style={styles.historyControls}>
                            <View style={styles.searchContainer}>
                                <Search size={16} color={colors.textSecondary} />
                                <TextInput
                                    style={styles.searchInput}
                                    placeholder="Filtrar por fecha o mes..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={historySearch}
                                    onChangeText={setHistorySearch}
                                />
                                {(historySearch !== '' || startDate) && (
                                    <TouchableOpacity onPress={clearDateFilter}>
                                        <X size={16} color={colors.textSecondary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            <TouchableOpacity
                                style={[styles.calendarTrigger, startDate && styles.activeTrigger]}
                                onPress={() => setCalendarModalVisible(true)}
                            >
                                <Calendar size={20} color={startDate ? colors.white : colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            );
        }

        return (
            <View style={styles.sectionHeaderContainer}>
                <View style={[styles.sectionHeader, section.isHistory && styles.historyHeader]}>
                    <View style={styles.sectionTitleRow}>
                        {section.isHistory ? <Calendar size={18} color={colors.textSecondary} /> : <View style={styles.todayIndicator} />}
                        <Text style={[styles.sectionTitle, section.isHistory && styles.historyTitle]}>
                            {section.title}
                        </Text>
                    </View>
                    {section.isHistory && <ChevronRight size={20} color={colors.textSecondary} />}
                </View>

                {isToday && section.analysis && (
                    <MealCoach analysis={section.analysis} />
                )}
            </View>
        );
    };

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
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.modalOverlay}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={{ width: '100%' }}
                        >
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
                                    returnKeyType="done"
                                />

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={styles.label}>
                                        {(editingMeal?.isRecipe || editingMeal?.category === 'Recetas') ? 'Cantidad (raciones)' : 'Cantidad (gramos/ml)'}
                                    </Text>
                                    {(editingMeal?.isRecipe || editingMeal?.category === 'Recetas') && (
                                        <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '700' }}>RECETA</Text>
                                    )}
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={editGrams}
                                    onChangeText={setEditGrams}
                                    keyboardType="numeric"
                                    returnKeyType="done"
                                />

                                <Text style={styles.label}>Fecha (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editDate}
                                    onChangeText={setEditDate}
                                    returnKeyType="done"
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
                        </KeyboardAvoidingView>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
            {/* Modal de Calendario */}
            <Modal
                visible={calendarModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setCalendarModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.calendarModalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filtrar por Periodo</Text>
                            <TouchableOpacity onPress={() => setCalendarModalVisible(false)}>
                                <X size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <RNCalendar
                            theme={{
                                backgroundColor: colors.card,
                                calendarBackground: colors.card,
                                textSectionTitleColor: colors.textSecondary,
                                selectedDayBackgroundColor: colors.primary,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: colors.primary,
                                dayTextColor: colors.text,
                                textDisabledColor: 'rgba(255,255,255,0.1)',
                                monthTextColor: colors.text,
                                indicatorColor: colors.primary,
                                textDayFontWeight: '600',
                                textMonthFontWeight: '800',
                                textDayHeaderFontWeight: '700',
                            }}
                            markingType={'period'}
                            markedDates={getMarkedDates()}
                            onDayPress={onDayPress}
                        />

                        <View style={styles.rangeInfo}>
                            <Text style={styles.rangeText}>
                                {startDate ? `Desde: ${startDate}` : 'Selecciona inicio'}
                                {endDate ? ` • Hasta: ${endDate}` : ''}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.applyButton}
                            onPress={() => setCalendarModalVisible(false)}
                        >
                            <Text style={styles.applyButtonText}>Aplicar Filtro</Text>
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
    historyGroupContainer: {
        marginTop: 32,
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: 4,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    historyToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    historyHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historyGroupTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    historyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        gap: 8,
        marginBottom: 12,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 44,
        borderWidth: 1,
        borderColor: colors.border,
    },
    calendarTrigger: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeTrigger: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 14,
        color: colors.text,
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
    calendarModalContent: {
        backgroundColor: colors.card,
        borderRadius: 30,
        padding: 24,
        margin: 20,
        width: '90%',
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    rangeInfo: {
        marginVertical: 20,
        padding: 12,
        backgroundColor: colors.background,
        borderRadius: 12,
        alignItems: 'center',
    },
    rangeText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '700',
    },
    applyButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 15,
        alignItems: 'center',
    },
    applyButtonText: {
        color: 'white',
        fontWeight: '800',
        fontSize: 16,
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
