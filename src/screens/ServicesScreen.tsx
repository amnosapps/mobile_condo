import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Button, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Profile from '../components/Profile';
import { useProfile } from '../ProfileContext';
import { API_URL } from '@env';
import PaymentModal from '../components/PaymentModal';
import Clipboard from '@react-native-clipboard/clipboard';

const ServicesScreen = () => {
  const profile = useProfile();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [selectedService, setSelectedService] = useState(null);

  // Fetch services from backend
  const fetchServices = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
    }
  };

  const bookService = async (serviceId, paymentData) => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/services/${serviceId}/book/`,
        { payment: paymentData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      if (response.data.status === "pending" && paymentData.method === "pix") {
        // Handle PIX-specific pending payment
        setQrCode(response.data.qr_code);
        setQrCodeBase64(response.data.qr_code_base64);
        setQrModalVisible(true); // Show QR code modal
      } else {
        // Success for card payments or completed PIX
        alert("Payment successful!");
      }
  
      fetchServices(); // Re-fetch services to reflect changes
      setLoading(false);
    } catch (error) {
      console.error("Error booking service:", error);
      alert("Payment failed. Please try again.");
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentDetails) => {
    setModalVisible(false);

    if (paymentDetails.method === "pix") {
      const paymentData = { method: "pix" };
      await bookService(selectedService.id, paymentData);
    } else {
      console.log(paymentDetails)
      
      const paymentData = {
        method: "card",
        creditCard: paymentDetails.creditCard,
        cardHolderName: paymentDetails.cardHolderName,
        expirationMonth: paymentDetails.expirationMonth,
        expirationYear: paymentDetails.expirationYear,
        cvv: paymentDetails.cvv,
        identificationType: paymentDetails.identificationType,
        identificationNumber: paymentDetails.identificationNumber,
      };
      
      await bookService(selectedService.id, paymentData);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleBook = (service) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  // Filter services for display
  const availableServices = services.filter(
    (service) =>
      service.status === 'available' &&
      !service.bookings.some((booking) => booking.username === profile.user)
  );

  const contractedServices = services.filter((service) =>
    service.bookings.some((booking) => booking.username === profile.user)
  );

  return (
    <ScrollView style={styles.container}>
      <Profile profile={profile} />

      {/* Available Services */}
      <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
      {loading && <Text>Carregando...</Text>}
      <FlatList
        data={availableServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceDetails}>
              Custo Base: <Text style={styles.detailValue}>R${item.base_cost}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Máximo de Contratações: <Text style={styles.detailValue}>{item.max_bookings}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Descrição: <Text style={styles.detailValue}>{item.description}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Interessados:{' '}
              <Text style={styles.detailValue}>{item.bookings.length}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Status: <Text style={styles.detailValue}>{item.status}</Text>
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => handleBook(item)}
            >
              <Text style={styles.buttonText}>Contratar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
        }
      />

      {/* Contracted Services */}
      <Text style={styles.sectionTitle}>Serviços Contratados</Text>
      <FlatList
        data={contractedServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceDetails}>
              Descrição: <Text style={styles.detailValue}>{item.description}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Máximo de Contratações: <Text style={styles.detailValue}>{item.max_bookings}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Interessados:{' '}
              <Text style={styles.detailValue}>
                {item.bookings.map((booking) => booking.username).join(', ') || 'Nenhum'}
              </Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Status: <Text style={styles.detailValue}>{item.status}</Text>
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum serviço contratado no momento.</Text>
        }
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onConfirm={confirmPayment}
      />

      {/* QR Code Modal */}
      <Modal visible={qrModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>PIX Payment</Text>
            {qrCodeBase64 ? (
              <Image
                source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
                style={styles.qrCode}
              />
            ) : (
              <Text>No QR Code available</Text>
            )}
            <Text style={styles.pixTitle}>PIX Code:</Text>
            <TextInput
              style={styles.pixCode}
              value={qrCode}
              editable={false}
            />
            <Button
              title="Copy PIX Code"
              onPress={() => {
                Clipboard.setString(qrCode);
                alert("PIX code copied to clipboard!");
              }}
            />
            <Button
              title="Close"
              onPress={() => setQrModalVisible(false)}
              color="red"
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginVertical: 15,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#EDEDED',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  serviceDetails: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: '600',
    color: '#34495E',
  },
  primaryButton: {
    backgroundColor: '#27AE60',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 14,
    marginVertical: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrCode: {
    width: 200,
    height: 200,
    marginVertical: 20,
  },
  pixTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 10,
    textAlign: 'center',
  },
  pixCode: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  copyButton: {
    backgroundColor: '#27AE60',
    padding: 10,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  copyButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: '#F44336',
    padding: 10,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ServicesScreen;
