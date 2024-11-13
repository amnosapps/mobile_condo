// ReservationForm.js
import React from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const ReservationForm = ({ apartments, reservationData, updateReservationData }) => {
  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.post(`${API_URL}/api/reservations/`, reservationData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert("Success", "Reservation created successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to create reservation. Please try again.");
      console.error("Failed to create reservation", error);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text>Apartamento:</Text>
      <Picker
        selectedValue={reservationData.apartment}
        style={styles.picker}
        onValueChange={(value) => updateReservationData('apartment', value)}
      >
        <Picker.Item label="Seleciona o Apartamento" value="" />
        {apartments.map((apartment) => (
          <Picker.Item key={apartment.id} label={apartment.id} value={apartment.id} />
        ))}
      </Picker>

      <Text>Nome do Hóspede:</Text>
      <TextInput
        style={styles.input}
        value={reservationData.guest_name}
        onChangeText={(value) => updateReservationData('guest_name', value)}
      />
      <Text>Documento do Hóspede:</Text>
      <TextInput
        style={styles.input}
        value={reservationData.guest_document}
        onChangeText={(value) => updateReservationData('guest_document', value)}
      />
      <Text>Quantidade de Hóspedes:</Text>
      <TextInput
        style={styles.input}
        value={String(reservationData.guests)}
        onChangeText={(value) => updateReservationData('guests', value)}
      />
      <Text>Há Crianças:</Text>
      <Picker
        selectedValue={reservationData.has_children ? "Sim" : "Não"}
        style={styles.picker}
        onValueChange={(value) => updateReservationData('has_children', value === "Sim")}
      >
        <Picker.Item label="Sim" value="Sim" />
        <Picker.Item label="Não" value="Não" />
      </Picker>
      <Button title="Registrar Reserva" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: { height: 50, width: '100%', marginBottom: 16 },
});

export default ReservationForm;
