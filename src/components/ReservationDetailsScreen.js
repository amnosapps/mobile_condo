// ReservationDetailsScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ReservationDetailsScreen = ({ route }) => {
  const { reservation } = route.params; // Retrieve reservation details from route parameters

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes da Reserva</Text>
      <Text style={styles.detail}>Nome: {reservation.name}</Text>
      <Text style={styles.detail}>Apto: {reservation.room}</Text>
      <Text style={styles.detail}>Check-in: {reservation.checkIn}</Text>
      <Text style={styles.detail}>Check-out: {reservation.checkOut}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  detail: { fontSize: 16, marginBottom: 8 },
});

export default ReservationDetailsScreen;
