// FilesScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { Text, Alert, TouchableOpacity, StyleSheet, ActivityIndicator, View } from 'react-native';
import Container from '../components/Container';
import FileLoaderButton from '../components/FileLoaderButton';
import DatePickerInput from '../components/DatePickerInput';
import ReservationForm from '../components/ReservationForm';
import { useSharedFiles } from '../SharedFilesContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { API_URL } from '@env';

const FilesScreen = ({ navigation }) => {
  const { sharedFiles } = useSharedFiles();
  const [files, setFiles] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state
  const [reservationData, setReservationData] = useState({
    checkin: '',
    checkout: '',
    guest_name: '',
    guest_document: '',
    apartment: '',
    guests: 1,
    has_children: false,
  });

  // Load data from `sharedFiles` when it changes
  useEffect(() => {
    if (sharedFiles) {
      setFiles(sharedFiles);
      const firstFile = sharedFiles[0];
      if (firstFile && firstFile.extractedData) {
        setLoading(true); // Start loading
        setReservationData((prevData) => ({
          ...prevData,
          checkin: firstFile.extractedData.check_in || '',
          checkout: firstFile.extractedData.check_out || '',
          guest_name: firstFile.extractedData.guest_name || '',
          guest_document: firstFile.extractedData.guest_document || '',
          guests: firstFile.extractedData.guests || 1,
          apartment: '',
          has_children: false,
        }));
        setLoading(false); // Stop loading
      }
    }
  }, [sharedFiles]);

  // Fetch apartment options from API
  useEffect(() => {
    const fetchApartments = async () => {
      console.log(API_URL)
      setLoading(true); // Start loading
      const token = await AsyncStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_URL}/api/apartments/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApartments(response.data);
      } catch (error) {
        console.error("Failed to load apartments", error);
      } finally {
        setLoading(false); // Stop loading
      }
    };
    fetchApartments();
  }, []);

  const updateReservationData = (field, value) => {
    setReservationData((prevData) => ({ ...prevData, [field]: value }));
  };

  // Function to reset reservation data
  const clearReservationData = () => {
    setReservationData({
      checkin: '',
      checkout: '',
      guest_name: '',
      guest_document: '',
      apartment: '',
      guests: 1,
      has_children: false,
    });
    setFiles([]);
  };

  // Function to handle file selection from FileLoaderButton
  const onFileSelected = async (file) => {
    setLoading(true); // Start loading when file is selected
    try {
      console.log(API_URL)
      const fileContent = await RNFS.readFile(file.uri, 'base64');
      const token = await AsyncStorage.getItem('accessToken');

      const response = await axios.post(
        `${API_URL}/api/reservations/extract-dates/`,
        { pdf_base64: fileContent },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (response.data) {
        setReservationData((prevData) => ({
          ...prevData,
          checkin: response.data.check_in || '',
          checkout: response.data.check_out || '',
          guest_name: response.data.guest_name || '',
          guest_document: response.data.guest_document || '',
          guests: response.data.guests || 1,
          apartment: '',
          has_children: false,
        }));
        setFiles([file]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      Alert.alert('Error', 'Failed to process file');
    } finally {
      setLoading(false); // Stop loading
    }
  };

  const ClearButton = ({ title, onPress }) => {
    return (
      <TouchableOpacity style={styles.clearButton} onPress={onPress}>
        <Text style={styles.textclearButton}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Container >
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#DE7066" /> {/* Loading spinner */}
          <Text>Carregando...</Text>
        </View>
      ) : files.length > 0 ? (
        <View>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>Geração de Reserva</Text>
          <DatePickerInput
            label="Data de Check-In"
            dateValue={reservationData.checkin}
            onDateChange={(date) => updateReservationData('checkin', date)}
            hourValue={reservationData.checkinHour}
            onHourChange={(hour) => updateReservationData('checkinHour', hour)}
          />
          <DatePickerInput
            label="Data de Check-Out"
            dateValue={reservationData.checkout}
            onDateChange={(date) => updateReservationData('checkout', date)}
            hourValue={reservationData.checkoutHour}
            onHourChange={(hour) => updateReservationData('checkoutHour', hour)}
          />
          <ReservationForm
            apartments={apartments}
            reservationData={reservationData}
            updateReservationData={updateReservationData}
          />
          <ClearButton title="Limpar Reserva" onPress={clearReservationData}/>
        </View>
      ) : (
        <View>
          <Text style={{ fontSize: 16, textAlign: 'center', marginVertical: 20 }}>Processar Reserva</Text>
          <FileLoaderButton onFileSelected={onFileSelected} />
        </View>
      )}
    </Container>
  );
};

export default FilesScreen;


const styles = StyleSheet.create({
  clearButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#DE7066',
    backgroundColor: '#fff',
    padding: 10,
    width: '82%',
  },
  textclearButton: {
    textAlign: 'center',
    color: '#DE7066',
  }
});