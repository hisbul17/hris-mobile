import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoadingScreen() {
  return (
    <LinearGradient
      colors={['#2563eb', '#1d4ed8', '#1e40af']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>HRIS Mobile</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#e5e7eb',
  },
});