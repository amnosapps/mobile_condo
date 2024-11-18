import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePickerInput from './DatePickerInput'; // Assuming this is a custom component or replace with a library-based date picker
import { API_URL } from '@env';

const ReservationDetailsScreen = ({ route, navigation }) => {
  const { reservation } = route.params; // Retrieve reservation details from route parameters

  const [name, setName] = useState(reservation.name);
  const [apartment, setApartment] = useState(reservation.room);
  const [checkIn, setCheckIn] = useState(reservation.checkIn);
  const [checkInHour, setCheckInHour] = useState('');
  const [checkOut, setCheckOut] = useState(reservation.checkOut);
  const [checkOutHour, setCheckOutHour] = useState('');
  const [apartments, setApartments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch apartments from API
  useEffect(() => {
    const fetchApartments = async () => {
      console.log(API_URL)
      setLoading(true); // Start loading indicator
      const token = await AsyncStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_URL}/api/apartments/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response.data)
        setApartments(response.data);
      } catch (error) {
        console.error('Failed to load apartments', error);
        Alert.alert('Error', 'Failed to load apartments. Please try again.');
      } finally {
        setLoading(false); // Stop loading indicator
      }
    };
    fetchApartments();
  }, []);

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await axios.patch(
        `${API_URL}/api/reservations/${reservation.id}`,
        {
          name,
          room: apartment,
          checkIn,
          checkInHour,
          checkOut,
          checkOutHour,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('Success', 'Reservation updated successfully!');
      navigation.goBack(); // Navigate back to the previous screen
    } catch (error) {
      console.error('Error updating reservation:', error);
      Alert.alert('Error', 'Failed to update reservation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  console.log()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes da Reserva</Text>

      {/* Editable Fields */}
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nome do Hóspede"
      />

      <Text style={styles.label}>Apto</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Picker
          selectedValue={apartment}
          style={styles.picker}
          onValueChange={(value) => setApartment(value)}
        >
          <Picker.Item label="Selecione o Apartamento" value="" />
          {apartments.map((apt) => (
            <Picker.Item key={apt.id} label={apt.number} value={reservation.room} />
          ))}
        </Picker>
      )}

      <Text style={styles.label}>Check-In</Text>
      <DatePickerInput
        label="Data de Check-In"
        dateValue={checkIn}
        onDateChange={setCheckIn}
        hourValue={checkInHour}
        onHourChange={setCheckInHour}
      />

      <Text style={styles.label}>Check-Out</Text>
      <DatePickerInput
        label="Data de Check-Out"
        dateValue={checkOut}
        onDateChange={setCheckOut}
        hourValue={checkOutHour}
        onHourChange={setCheckOutHour}
      />

      {/* Submit Button */}
      <Button
        title={isSubmitting ? 'Atualizando...' : 'Atualizar Reserva'}
        onPress={handleSubmit}
        disabled={isSubmitting || loading}
        color={'#DE7066'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  picker: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
  },
});

export default ReservationDetailsScreen;
