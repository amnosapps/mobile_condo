// FilesScreen.tsx

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, TextInput, Button, View, Alert } from 'react-native';
import axios from 'axios';
import { ShareFile, useGetShare } from './useGetShare';
import { API_URL, API_TOKEN } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

const FilesScreen = () => {
  const sharedFiles = useGetShare();
  const [files, setFiles] = useState<ShareFile[]>([]);
  const [apartments, setApartments] = useState([]);
  const [reservationData, setReservationData] = useState({
    checkin: '',
    checkout: '',
    guest_name: '',
    guest_document: '',
    apartment: '',
  });

  useEffect(() => {
    if (sharedFiles) {
        
      setFiles(sharedFiles);
      // Populate the form with extractedData of the first file (or any specific file as per your need)
      const firstFile = sharedFiles[0];
      if (firstFile && firstFile.extractedData) {
        setReservationData({
          checkin: firstFile.extractedData.check_in || '',
          checkout: firstFile.extractedData.check_out || '',
          guest_name: firstFile.extractedData.guest_name || '',
          guest_document: firstFile.extractedData.guest_document || '',
          apartment: '', // Apartment will be chosen manually
        });
      }
    }
  }, [sharedFiles]);

  console.log('----- 1', reservationData)

  // Fetch available apartments from the API
  useEffect(() => {
    const fetchApartments = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_URL}/api/apartments/`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        setApartments(response.data);
      } catch (error) {
        console.error("Failed to load apartments", error);
      }
    };
    fetchApartments();
  }, []);

  console.log('----- 2', apartments)

  // Handle form submission to create a reservation
  const handleSubmit = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log(API_URL, token, reservationData)
      const response = await axios.post(`${API_URL}/api/reservations/`, reservationData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
      });
      Alert.alert("Success", "Reservation created successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to create reservation. Please try again.");
      console.error("Failed to create reservation", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setReservationData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {files.length > 0 ? (
        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Reservation</Text>
          <Text>Check-In:</Text>
          <TextInput
            style={styles.input}
            value={reservationData.checkin}
            onChangeText={(value) => handleInputChange('checkin', value)}
            placeholder="YYYY-MM-DDTHH:MM:SSZ"
          />
          <Text>Check-Out:</Text>
          <TextInput
            style={styles.input}
            value={reservationData.checkout}
            onChangeText={(value) => handleInputChange('checkout', value)}
            placeholder="YYYY-MM-DDTHH:MM:SSZ"
          />
          <Text>Guest Name:</Text>
          <TextInput
            style={styles.input}
            value={reservationData.guest_name}
            onChangeText={(value) => handleInputChange('guest_name', value)}
            placeholder="Guest Name"
          />
          <Text>Guest Document:</Text>
          <TextInput
            style={styles.input}
            value={reservationData.guest_document}
            onChangeText={(value) => handleInputChange('guest_document', value)}
            placeholder="Guest Document"
          />
          <Text>Apartment:</Text>
          <Picker
            selectedValue={reservationData.apartment}
            style={styles.picker}
            onValueChange={(value) => handleInputChange('apartment', value)}
          >
            <Picker.Item label="Select Apartment" value="" />
            {apartments.map((apartment) => (
              <Picker.Item
                key={apartment.id}
                label={apartment.id} // Assuming each apartment has a 'name' property
                value={apartment.id}
              />
            ))}
          </Picker>
          <Button title="Submit Reservation" onPress={handleSubmit} />
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
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  picker: { height: 50, width: '100%', marginBottom: 16 },
});

export default FilesScreen;
