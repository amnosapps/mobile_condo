import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  Button,
  Alert,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@env';
import { useProfile } from '../ProfileContext';
import Profile from '../components/Profile';
import { Picker } from '@react-native-picker/picker';

const TYPE_CHOICES = [
  { value: 0, label: 'Temporada' },
  { value: 1, label: 'Moradia' },
];

const STATUS_CHOICES = [
  { value: 0, label: 'Disponível' },
  { value: 1, label: 'Ocupado' },
  { value: 2, label: 'Manutenção' },
];

const ApartmentList = ({ route }) => {
  const profile = useProfile();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ type: '', max_occupation: '', status: '' });

  useEffect(() => {
    const fetchApartments = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error("No access token found.");
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/apartments/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: { condominium: profile.condominiums[0] },
        });
        setApartments(response.data);
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profile) {
      fetchApartments();
    }
  }, [profile]);

  const openEditModal = (apartment) => {
    setSelectedApartment(apartment);
    setFormData({
      type: apartment.type.toString(),
      max_occupation: apartment.max_occupation.toString(),
      status: apartment.status.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedApartment) return;

    const token = await AsyncStorage.getItem('accessToken');
    try {
      await axios.patch(
        `${API_URL}/api/apartments/${selectedApartment.id}/`,
        {
          type: parseInt(formData.type, 10),
          max_occupation: parseInt(formData.max_occupation, 10),
          status: parseInt(formData.status, 10),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      Alert.alert('Sucesso', 'Apartamento atualizado com sucesso!');
      setApartments((prev) =>
        prev.map((apartment) =>
          apartment.id === selectedApartment.id
            ? {
                ...apartment,
                type: parseInt(formData.type, 10),
                max_occupation: parseInt(formData.max_occupation, 10),
                status: parseInt(formData.status, 10),
              }
            : apartment
        )
      );
      setModalVisible(false);
    } catch (error) {
      console.error('Error updating apartment:', error.response?.data || error);
      Alert.alert('Erro', 'Falha ao atualizar apartamento. Tente novamente.');
    }
  };

  const renderApartmentCard = ({ item }) => {
    const statusColors = {
      0: '#36a2eb',
      1: '#ff6384',
      2: '#ffce56',
    };

    const statusLabels = STATUS_CHOICES.find((choice) => choice.value === item.status)?.label || 'Desconhecido';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.apartmentNumber}>Apartamento: {item.number}</Text>
          <Text style={[styles.apartmentStatus, { color: statusColors[item.status] || '#000' }]}>
            {statusLabels}
          </Text>
        </View>
        <Text style={styles.apartmentDetails}>Tipo: {TYPE_CHOICES.find((choice) => choice.value === item.type)?.label}</Text>
        <Text style={styles.apartmentDetails}>Capacidade: {item.max_occupation}</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
          <Text style={styles.buttonText}>Editar</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#F46600" />
        <Text style={styles.loaderText}>Carregando apartamentos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Profile profile={profile} />
      <FlatList
        data={apartments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderApartmentCard}
        contentContainerStyle={styles.listContainer}
      />

      {selectedApartment && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                Editar Apartamento {selectedApartment.number}
              </Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  style={styles.picker}
                  dropdownIconColor={'#000'}
                >
                  {TYPE_CHOICES.map((choice) => (
                    <Picker.Item key={choice.value} label={choice.label} value={choice.value.toString()} />
                  ))}
                </Picker>
              </View>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  style={styles.picker}
                  dropdownIconColor={'#000'}
                >
                  {STATUS_CHOICES.map((choice) => (
                    <Picker.Item key={choice.value} label={choice.label} value={choice.value.toString()} />
                  ))}
                </Picker>
              </View>
              <Text style={styles.label}>Capacidade</Text>
              <TextInput
                style={styles.input}
                placeholder="Capacidade"
                keyboardType="number-pad"
                value={formData.max_occupation}
                onChangeText={(value) =>
                  setFormData((prev) => ({ ...prev, max_occupation: value }))
                }
              />
              <View style={styles.modalButtons}>
                <Button title="Salvar" onPress={handleSave} color="#28a745" />
                <Button
                  title="Cancelar"
                  onPress={() => setModalVisible(false)}
                  color="#dc3545"
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 10,
  },
  listContainer: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderColor: '#EDEDED',
    borderWidth: 1,
    marginRight: '2%',
    marginLeft: '2%'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  apartmentNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  apartmentStatus: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  apartmentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  editButton: {
    marginTop: 10,
    backgroundColor: '#F46600',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#F46600',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
    color: '#000'
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden', // Ensures border radius works
    backgroundColor: '#fff', // Adds a background to the container
    marginBottom: 10
  },
  picker: {
    width: '100%',
    // height: 50,
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default ApartmentList;
