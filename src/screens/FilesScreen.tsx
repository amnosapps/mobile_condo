// FilesScreen.js
import React, { useState, useEffect } from 'react';
import { Text, Alert } from 'react-native';
import Container from '../components/Container';
import FileLoaderButton from '../components/FileLoaderButton';
import DatePickerInput from '../components/DatePickerInput';
import ReservationForm from '../components/ReservationForm';
import { useSharedFiles } from '../SharedFilesContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { API_URL } from '@env';

const FilesScreen = () => {
  const { sharedFiles } = useSharedFiles(); // Use shared files from context
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

  // Load data from `sharedFiles` when it changes
  useEffect(() => {
    if (sharedFiles) {
      setFiles(sharedFiles);
      const firstFile = sharedFiles[0];
      if (firstFile && firstFile.extractedData) {
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
      }
    }
  }, [sharedFiles]);

  // Fetch apartment options from API
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

  const updateReservationData = (field, value) => {
    setReservationData((prevData) => ({ ...prevData, [field]: value }));
  };

  // Function to handle file selection from FileLoaderButton
  const onFileSelected = async (file) => {
    try {
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
    }
  };

  return (
    <Container>
      {files.length > 0 ? (
        <>
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
            setReservationData={updateReservationData}
          />
        </>
      ) : (
        <>
          <Text style={{ fontSize: 16, textAlign: 'center', marginVertical: 20 }}>No files received</Text>
          <FileLoaderButton onFileSelected={onFileSelected} /> {/* File selection button */}
        </>
      )}
    </Container>
  );
};

export default FilesScreen;
