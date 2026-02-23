import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { Home, ClipboardList, PlusCircle, BarChart2, User, ChefHat } from 'lucide-react-native';

import DashboardScreen from '../screens/DashboardScreen';
import DiaryScreen from '../screens/DiaryScreen';
import AddFoodScreen from '../screens/AddFoodScreen';
import ProgressScreen from '../screens/ProgressScreen';
import ProfileScreen from '../screens/ProfileScreen';
import DietsScreen from '../screens/DietsScreen';
import { colors } from '../theme/colors';
import { useApp } from '../context/AppContext';
import LoginScreen from '../screens/LoginScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';

const Tab = createMaterialTopTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
    const { isNewUser } = useApp();
    return (
        <Tab.Navigator
            initialRouteName={isNewUser ? 'Perfil' : 'Inicio'}
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color }) => {
                    const size = 20;
                    if (route.name === 'Inicio') return <Home color={color} size={size} />;
                    if (route.name === 'Diario') return <ClipboardList color={color} size={size} />;
                    if (route.name === 'Dietas') return <ChefHat color={color} size={size} />;
                    if (route.name === 'Añadir') return <PlusCircle color={color} size={size} />;
                    if (route.name === 'Stats') return <BarChart2 color={color} size={size} />;
                    if (route.name === 'Perfil') return <User color={color} size={size} />;
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textSecondary,
                tabBarIndicatorStyle: {
                    backgroundColor: colors.primary,
                    height: 3,
                    borderRadius: 3,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    textTransform: 'none',
                },
                tabBarShowIcon: true,
                tabBarStyle: {
                    backgroundColor: colors.background,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    elevation: 0,
                    shadowOpacity: 0,
                },
            })}
        >
            <Tab.Screen name="Inicio" component={DashboardScreen} />
            <Tab.Screen name="Diario" component={DiaryScreen} />
            <Tab.Screen name="Dietas" component={DietsScreen} />
            <Tab.Screen name="Añadir" component={AddFoodScreen} />
            <Tab.Screen name="Stats" component={ProgressScreen} />
            <Tab.Screen name="Perfil" component={ProfileScreen} />
        </Tab.Navigator>
    );
};

const AppNavigator = () => {
    const { isLoggedIn, isLoading } = useApp();

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle="light-content" backgroundColor={colors.background} />
            <NavigationContainer>
                {!isLoggedIn ? (
                    <LoginScreen />
                ) : (
                    <Stack.Navigator screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="Main" component={MainTabs} />
                        <Stack.Screen
                            name="Subscription"
                            component={SubscriptionScreen}
                            options={{
                                animation: 'slide_from_bottom'
                            }}
                        />
                    </Stack.Navigator>
                )}
            </NavigationContainer>
        </SafeAreaView>
    );
};

export default AppNavigator;
