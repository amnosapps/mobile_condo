// ReservationForm.js
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';

const ReservationForm = ({ apartments, reservationData, updateReservationData }) => {
  const handleSubmit = async () => {
    console.log(API_URL)
    try {
      console.log(reservationData)
      const formData = new FormData();
      Object.keys(reservationData).forEach(key => {
        formData.append(key, reservationData[key]);
      });
      
      const token = await AsyncStorage.getItem('accessToken');
      await axios.post(`${API_URL}/api/reservations/`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        
      });
      Alert.alert("Success", "Reserva registrada com sucesso!");
    } catch (error) {
      Alert.alert("Alerta", String(error.response.data.message));
      console.error("Failed to create reservation", error.response.data.message);
    }
  };

  const ReservationButton = ({ title, onPress }) => {
    return (
      <TouchableOpacity style={styles.reservationButton} onPress={onPress}>
        <Text style={styles.textReservationButton}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.formContainer}>
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
      <Text>Apartamento:</Text>
      <Picker
        selectedValue={reservationData.apartment}
        style={styles.picker}
        onValueChange={(value) => updateReservationData('apartment', value)}
      >
        <Picker.Item label="Seleciona o Apartamento" value="" />
        {apartments.map((apartment) => (
          <Picker.Item key={apartment.id} label={apartment.number} value={apartment.id} />
        ))}
      </Picker>
      <ReservationButton title="Registrar Reserva" onPress={handleSubmit} />
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: { padding: 16, backgroundColor: '#F7F9FC' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  picker: { height: 50, width: '100%', marginBottom: 16 },
  reservationButton: {
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: '#DE7066',
    paddingVertical: 10,
    paddingHorizontal: 100,
  },
  textReservationButton: {
    textAlign: 'center',
    color: '#fff',
  },
});

export default ReservationForm;
