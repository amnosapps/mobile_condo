// FilesScreen.tsx

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, Button, View, Alert, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useSharedFiles } from '../SharedFilesContext'; // Import useSharedFiles

const FilesScreen = () => {
  const { sharedFiles, loadFiles } = useSharedFiles(); // Access shared files and loadFiles function
  const [files, setFiles] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [reservationData, setReservationData] = useState({
    checkin: '',
    checkout: '',
    guest_name: '',
    guest_document: '',
    apartment: '',
    guests: 1,
    has_children: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateField, setDateField] = useState<'checkin' | 'checkout' | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState({ checkin: '00:00', checkout: '00:00' });

  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  // Load shared files into local state when they change
  useEffect(() => {
    if (sharedFiles) {
      setFiles(sharedFiles);
      const firstFile = sharedFiles[0];
      if (firstFile && firstFile.extractedData) {
        setReservationData({
          checkin: firstFile.extractedData.check_in || '',
          checkout: firstFile.extractedData.check_out || '',
          guest_name: firstFile.extractedData.guest_name || '',
          guest_document: firstFile.extractedData.guest_document || '',
          guests: firstFile.extractedData.guests,
          apartment: '',
          has_children: false,
        });
      }
    }
  }, [sharedFiles]);

  // Fetch available apartments
  useEffect(() => {
    const fetchApartments = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_URL}/api/apartments/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApartments(response.data);
      } catch (error) {
        console.error("Failed to load apartments", error);
      }
    };
    fetchApartments();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setReservationData((prevData) => ({ ...prevData, [field]: value }));
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date && dateField) {
      const formattedDate = date.toISOString().split('T')[0];
      const dateTime = `${formattedDate} ${selectedHour[dateField]}`;
      handleInputChange(dateField, dateTime);
      setSelectedDate(date);
    }
  };

  const onHourSelect = (field: 'checkin' | 'checkout', hour) => {
    setSelectedHour((prevHour) => ({ ...prevHour, [field]: hour }));
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const dateTime = `${formattedDate} ${hour}`;
    handleInputChange(field, dateTime);
  };

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
    <SafeAreaView style={styles.container}>
      <Button title="Load Files" onPress={loadFiles} /> {/* Button to manually load files */}
      {files.length > 0 ? (
        <View style={styles.formContainer}>
          <Text style={styles.title}>Geração de Reserva</Text>

          <Text>Apartamento:</Text>
          <Picker
            selectedValue={reservationData.apartment}
            style={styles.picker}
            onValueChange={(value) => handleInputChange('apartment', value)}
          >
            <Picker.Item label="Seleciona o Apartamento" value="" />
            {apartments.map((apartment) => (
              <Picker.Item key={apartment.id} label={apartment.id} value={apartment.id} />
            ))}
          </Picker>

          {/* Check-In Date and Hour Selection */}
          <Text>Data de Check-In:</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity onPress={() => { setDateField('checkin'); setShowDatePicker(true); }}>
              <TextInput
                style={styles.input}
                value={reservationData.checkin}
                placeholder="YYYY-MM-DD HH:MM"
                editable={false}
              />
            </TouchableOpacity>
            <Picker
              selectedValue={selectedHour.checkin}
              style={styles.hourPicker}
              onValueChange={(hour) => onHourSelect('checkin', hour)}
            >
              {hours.map((hour) => (
                <Picker.Item key={hour} label={hour} value={hour} />
              ))}
            </Picker>
          </View>

          {/* Check-Out Date and Hour Selection */}
          <Text>Data de Check-Out:</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity onPress={() => { setDateField('checkout'); setShowDatePicker(true); }}>
              <TextInput
                style={styles.input}
                value={reservationData.checkout}
                placeholder="YYYY-MM-DD HH:MM"
                editable={false}
              />
            </TouchableOpacity>
            <Picker
              selectedValue={selectedHour.checkout}
              style={styles.hourPicker}
              onValueChange={(hour) => onHourSelect('checkout', hour)}
            >
              {hours.map((hour) => (
                <Picker.Item key={hour} label={hour} value={hour} />
              ))}
            </Picker>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          {/* Other Inputs */}
          <Text>Nome do Hóspede:</Text>
          <TextInput
            style={styles.input}
            value={reservationData.guest_name}
            onChangeText={(value) => handleInputChange('guest_name', value)}
          />
          <Text>Documento do Hóspede:</Text>
          <TextInput
            style={styles.input}
            value={reservationData.guest_document}
            onChangeText={(value) => handleInputChange('guest_document', value)}
          />
          <Text>Quantidade de Hóspedes:</Text>
          <TextInput
            style={styles.input}
            value={String(reservationData.guests)}
            onChangeText={(value) => handleInputChange('guests', value)}
          />

          {/* New Picker for Has Children */}
          <Text>Há Crianças:</Text>
          <Picker
            selectedValue={reservationData.has_children ? "Sim" : "Não"}
            style={styles.picker}
            onValueChange={(value) => handleInputChange('has_children', value === "Sim")}
          >
            <Picker.Item label="Sim" value="Sim" />
            <Picker.Item label="Não" value="Não" />
          </Picker>
          <Button title="Registrar Reserva" onPress={handleSubmit} />
        </View>
      ) : (
        <Text>No files received</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  formContainer: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 5,
    borderRadius: 4,
    marginBottom: 16,
    flex: 1,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  hourPicker: {
    height: 50,
    width: 120,
    marginLeft: 8,
  },
  picker: { height: 50, width: '100%', marginBottom: 16 },
});

export default FilesScreen;
