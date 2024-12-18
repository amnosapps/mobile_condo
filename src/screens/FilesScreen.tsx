// FilesScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { Text, Alert, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, View } from 'react-native';
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
  const [isManualMode, setIsManualMode] = useState(false); // Track manual mode
  const [reservationData, setReservationData] = useState({
    checkin: '',
    checkout: '',
    guest_name: '',
    guest_document: '',
    apartment: '',
    guests: 1,
    has_children: false,
    reservation_file: '',
  });

  useEffect(() => {
    if (sharedFiles) {
      setFiles(sharedFiles);
      const firstFile = sharedFiles[0];
      if (firstFile && firstFile.extractedData) {
        setLoading(true);
        setReservationData((prevData) => ({
          ...prevData,
          reservation_file: firstFile.extractedData.base64_pdf || '',
          checkin: firstFile.extractedData.check_in || '',
          checkout: firstFile.extractedData.check_out || '',
          guest_name: firstFile.extractedData.guest_name || '',
          guest_document: firstFile.extractedData.guest_document || '',
          guests: firstFile.extractedData.guests || 1,
          apartment: '',
          has_children: false,
        }));
        setLoading(false);
      }
    }
  }, [sharedFiles]);

  useEffect(() => {
    const fetchApartments = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_URL}/api/apartments/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApartments(response.data);
      } catch (error) {
        console.error('Failed to load apartments', error);
      } finally {
        setLoading(false);
      }
    };
    fetchApartments();
  }, []);

  const updateReservationData = (field, value) => {
    setReservationData((prevData) => ({ ...prevData, [field]: value }));
  };

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
    setIsManualMode(false); // Reset manual mode
  };

  const onFileSelected = async (file) => {
    setLoading(true);
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
          reservation_file: response.data.base64_pdf,
        }));
        setFiles([file]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      Alert.alert('Error', 'Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  const ManualModeButton = () => (
    <TouchableOpacity
      style={styles.manualModeButton}
      onPress={() => setIsManualMode(true)}
    >
      <Text style={styles.manualModeButtonText}>Criar Reserva Manualmente</Text>
    </TouchableOpacity>
  );

  const ClearButton = ({ title, onPress }) => {
    return (
      <TouchableOpacity style={styles.clearButton} onPress={onPress}>
        <Text style={styles.textclearButton}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Container>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F46600" />
          <Text>Carregando...</Text>
        </View>
      ) : (files.length > 0 || isManualMode) ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.container}>
            <Text style={styles.title}>Geração de Reserva</Text>
            <DatePickerInput
              label="Data de Check-In"
              dateValue={reservationData.checkin}
              onDateChange={(date) => updateReservationData('checkin', date)}
            />
            <DatePickerInput
              label="Data de Check-Out"
              dateValue={reservationData.checkout}
              onDateChange={(date) => updateReservationData('checkout', date)}
            />
            <ReservationForm
              apartments={apartments}
              reservationData={reservationData}
              updateReservationData={updateReservationData}
              clearReservationData={clearReservationData}
            />
            <ClearButton title="Limpar Reserva" onPress={clearReservationData} />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.container}>
          <Text style={{ fontSize: 16, textAlign: 'center', marginVertical: 20 }}>
            Gerar Reserva
          </Text>
          <FileLoaderButton onFileSelected={onFileSelected} />
          <ManualModeButton />
        </View>
      )}
    </Container>
  );
};

export default FilesScreen;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100,
  },
  container: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  manualModeButton: {
    marginTop: 20,
    borderColor: '#F46600',
    borderWidth: 1,
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    width: '80%'
  },
  manualModeButtonText: {
    color: '#F46600',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  clearButton: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    borderColor: '#F46600',
    backgroundColor: '#FFF',
    padding: 10,
    width: '82%',
  },
  textclearButton: {
    textAlign: 'center',
    color: '#F46600',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
