import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AppProvider } from './src/context/AppContext';
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Error Boundary para capturar errores y mostrarlos en pantalla en vez de cerrar la App
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('APP_CRASH:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errStyles.container}>
          <Text style={errStyles.title}>⚠️ Error en NutriTrack</Text>
          <Text style={errStyles.subtitle}>La app encontró un problema:</Text>
          <ScrollView style={errStyles.scrollBox}>
            <Text style={errStyles.errorText}>
              {this.state.error?.toString()}
            </Text>
            <Text style={errStyles.stackText}>
              {this.state.errorInfo?.componentStack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center', padding: 30 },
  title: { color: '#FF6B6B', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { color: '#ccc', fontSize: 14, marginBottom: 15 },
  scrollBox: { backgroundColor: '#16213e', borderRadius: 10, padding: 15, maxHeight: 400, width: '100%' },
  errorText: { color: '#FF6B6B', fontSize: 13, fontFamily: 'monospace', marginBottom: 10 },
  stackText: { color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' },
});

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StripeProvider
          publishableKey={STRIPE_PUBLISHABLE_KEY}
          merchantIdentifier="merchant.com.david.nutritrack"
        >
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </StripeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
