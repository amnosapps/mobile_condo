import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePickerInput from './DatePickerInput';
// import PhotoCapture from './PhotoCapture'; // Assuming this is a custom component for photo management
import { API_URL } from '@env';

const ReservationDetailsScreen = ({ route, navigation }) => {
  const { reservation } = route.params;
  const reservationId = reservation.id;

  const [reservationData, setReservationData] = useState(null);
  const [address, setAddress] = useState({});
  const [hasCar, setHasCar] = useState(false);
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [additionalGuests, setAdditionalGuests] = useState([]);
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReservationData = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_URL}/api/reservations/${reservationId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = response.data;
        setReservationData(data);
        setAddress(data.address || {});
        setHasCar(!!data.vehicle_plate);
        setVehiclePlate(data.vehicle_plate || '');
        setAdditionalGuests(data.additional_guests || []);
      } catch (error) {
        console.error('Failed to load reservation data', error);
        Alert.alert('Error', 'Failed to load reservation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchApartments = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      try {
        const response = await axios.get(`${API_URL}/api/apartments/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setApartments(response.data);
      } catch (error) {
        console.error('Failed to load apartments', error);
      }
    };

    fetchReservationData();
    fetchApartments();
  }, [reservationId]);

  const handleSaveCheckin = async () => {
    setIsSubmitting(true);
    const token = await AsyncStorage.getItem('accessToken');
    try {
      const formData = new FormData();

      formData.append("guest_name", reservationData.guest_name);
      formData.append("guest_document", reservationData.guest_document);
      formData.append("guest_phone", reservationData.guest_phone || "");
      formData.append("guests_qty", 1 + additionalGuests.length); // Total guests including additional
      formData.append("has_children", additionalGuests.some((guest) => guest.is_child));
      formData.append("checkin_at", reservationData.checkin_at || new Date().toISOString());
      formData.append("address", JSON.stringify(address));
      formData.append("vehicle_plate", hasCar ? vehiclePlate : "");
      formData.append("additional_guests", JSON.stringify(additionalGuests));

      await axios.patch(`${API_URL}/api/reservations/${reservationId}/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Sucesso', 'Informações Atualizadas com sucesso!');
      navigation.goBack();
    } catch (error) {
      // console.log(error.response.data)
      console.error('Erro ao tentar atualizar reserva:', error.response.data.message);
      Alert.alert('Error', 'Falha ao tentar fazer checkin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    // Confirm checkout action
    Alert.alert(
      "Confirmar Checkout",
      "Você tem certeza que deseja fazer o checkout?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: async () => {
            setIsSubmitting(true);
            const token = await AsyncStorage.getItem("accessToken");
  
            try {
              const formData = new FormData();
              formData.append("checkout_at", new Date().toISOString());
  
              console.log("FormData contents:", Array.from(formData.entries()));
  
              const response = await axios.patch(
                `${API_URL}/api/reservations/${reservationId}/`,
                formData,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                  },
                }
              );
  
              if (response.status === 200) {
                Alert.alert("Sucesso", "Checkout realizado com sucesso!");
                navigation.goBack(); // Navigate back or refresh the list
              } else {
                console.error("Unexpected response status:", response.status);
                Alert.alert("Erro", "Falha ao realizar o checkout. Tente novamente.");
              }
            } catch (error) {
              console.error("Erro durante o checkout:", error);
  
              if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
                Alert.alert(
                  "Erro no Servidor",
                  `Código: ${error.response.status}. Detalhes: ${
                    error.response.data.detail || "Erro desconhecido"
                  }`
                );
              } else if (error.request) {
                console.error("No response received:", error.request);
                Alert.alert("Erro", "Erro na comunicação com o servidor. Verifique sua conexão.");
              } else {
                console.error("Error message:", error.message);
                Alert.alert("Erro", `Erro inesperado: ${error.message}`);
              }
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHasCarChange = () => {
    setHasCar((prev) => !prev);
    if (!hasCar) setVehiclePlate('');
  };

  const addAdditionalGuest = () => {
    setAdditionalGuests((prev) => [
      ...prev,
      { name: '', document: '', age: '', is_child: false },
    ]);
  };

  const removeAdditionalGuest = (index) => {
    setAdditionalGuests((prev) => prev.filter((_, i) => i !== index));
  };

  const updateGuestDetails = (index, field, value) => {
    setAdditionalGuests((prev) =>
      prev.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest))
    );
  };

  const updatePhotos = (photos) => {
    setReservationData((prev) => ({
      ...prev,
      additional_photos: photos,
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading reservation details...</Text>
      </View>
    );
  }

  if (!reservationData) {
    return (
      <View style={styles.errorContainer}>
        <Text>Failed to load reservation details.</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Checkin: {reservationData.guest_name}</Text>

        <Text style={styles.label}>Documento do Hóspede:</Text>
        <TextInput
          style={styles.input}
          value={reservationData.guest_document}
          onChangeText={(value) =>
            setReservationData((prev) => ({ ...prev, guest_document: value }))
          }
        />

        <Text style={styles.label}>Contato do Hóspede:</Text>
        <TextInput
          style={styles.input}
          value={reservationData.guest_phone || ''}
          onChangeText={(value) =>
            setReservationData((prev) => ({ ...prev, guest_phone: value }))
          }
          placeholder="88 88888-8888"
        />

        <Text style={styles.label}>Endereço:</Text>
        <TextInput
          style={styles.input}
          placeholder="Endereço"
          value={address.endereco || ''}
          onChangeText={(value) => handleAddressChange('endereco', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Bairro"
          value={address.bairro || ''}
          onChangeText={(value) => handleAddressChange('bairro', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="CEP"
          value={address.cep || ''}
          onChangeText={(value) => handleAddressChange('cep', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Cidade"
          value={address.cidade || ''}
          onChangeText={(value) => handleAddressChange('cidade', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="Estado"
          value={address.estado || ''}
          onChangeText={(value) => handleAddressChange('estado', value)}
        />
        <TextInput
          style={styles.input}
          placeholder="País"
          value={address.pais || ''}
          onChangeText={(value) => handleAddressChange('pais', value)}
        />

        <Text style={styles.label}>Tem veículo?</Text>
        <Picker
          selectedValue={hasCar}
          onValueChange={handleHasCarChange}
          style={styles.picker}
        >
          <Picker.Item label="Não" value={false} />
          <Picker.Item label="Sim" value={true} />
        </Picker>
        {hasCar && (
          <TextInput
            style={styles.input}
            placeholder="Placa do Veículo"
            value={vehiclePlate}
            onChangeText={setVehiclePlate}
          />
        )}

        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Text style={styles.label}>Hóspedes Adicionais</Text>
          <TouchableOpacity style={styles.addGuest} title="+" onPress={addAdditionalGuest}>
            <Text style={styles.buttonText}>
              +
            </Text>
          </TouchableOpacity>
        </View>
        {additionalGuests.map((guest, index) => (
          <View key={index} style={styles.guestContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.label}>Hóspede Adicional {index + 1}</Text>
              <TouchableOpacity
                style={styles.removeGuest}
                onPress={() => removeAdditionalGuest(index)}
              >
                <Text style={styles.buttonText}>Remover</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={guest.name}
              onChangeText={(value) => updateGuestDetails(index, 'name', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Documento"
              value={guest.document}
              onChangeText={(value) => updateGuestDetails(index, 'document', value)}
            />
            <Picker
              selectedValue={guest.is_child}
              onValueChange={(value) => updateGuestDetails(index, 'is_child', value)}
              style={styles.picker}
            >
              <Picker.Item label="Adulto" value={false} />
              <Picker.Item label="Criança" value={true} />
            </Picker>
          </View>
        ))}
        

        {/* <PhotoCapture
          existingPhotos={reservationData.additional_photos}
          onPhotosChange={updatePhotos}
        /> */}

        <View style={styles.buttonContainer}>
          {reservationData.checkin_at ? (
            <>
              <TouchableOpacity
                style={[styles.greenButton, isSubmitting && styles.disabledButton]}
                onPress={handleSaveCheckin}
                disabled={isSubmitting}
              >
                <Text style={styles.buttonText}>
                  {isSubmitting ? "Enviando..." : "Atualizar"}
                </Text>
              </TouchableOpacity>

              {reservationData.checkout_at ? (
                <TouchableOpacity style={[styles.redButton, styles.disabledButton]} disabled={true}>
                  <Text style={styles.buttonText}>
                    {isSubmitting ? "Processando..." : "Checkout"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.redButton, isSubmitting && styles.disabledButton]}
                  onPress={handleCheckout}
                  disabled={isSubmitting}
                >
                  <Text style={styles.buttonText}>
                    {isSubmitting ? "Processando..." : "Checkout"}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.greenButton, isSubmitting && styles.disabledButton]}
              onPress={handleSaveCheckin}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>
                {isSubmitting ? "Enviando..." : "Checkin"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.redButton} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100, // Ensure scroll content does not overlap footer
    padding: 26,
    backgroundColor: '#F9FAFB'
  },
  container: { flex: 1, padding: 26, backgroundColor: '#fff', position: 'absolute', height: '100%' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '400', marginBottom: 8 },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  picker: {
    // marginBottom: 10,
  },
  guestContainer: {
    marginBottom: 16,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10, // Use margin for React Native if gap isn't supported
    marginTop: 20,
    // maxWidth: 110,
  },
  greenButton: {
    backgroundColor: "#28a745",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  redButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  addGuest: {
    backgroundColor: "#417690",
    paddingVertical: 1,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 15,
  },
  removeGuest: {
    backgroundColor: "#dc3545",
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10
  },
  disabledButton: {
    backgroundColor: "grey",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default ReservationDetailsScreen;
