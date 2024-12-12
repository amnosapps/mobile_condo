import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Button,
  Image,
  RefreshControl,
} from 'react-native';
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
  const [isRefreshing, setRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const fetchServices = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(response.data);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching services:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const bookService = async (serviceId, paymentData) => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      const response = await axios.post(
        `${API_URL}/api/services/${serviceId}/book/`,
        { payment: paymentData },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 'pending' && paymentData.method === 'pix') {
        setQrCode(response.data.qr_code);
        setQrCodeBase64(response.data.qr_code_base64);
        setQrModalVisible(true);
      } else {
        alert('Payment successful!');
      }

      fetchServices();
      setLoading(false);
    } catch (error) {
      console.error('Error booking service:', error);
      alert('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  const releasePayment = async (serviceId) => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/service/${serviceId}/release_payment/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchServices();
      setLoading(false);
    } catch (error) {
      console.error('Error releasing payment:', error);
      setLoading(false);
    }
  };

  const removeInterest = async (serviceId) => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/book/remove_interest/`,
        { service_id: serviceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchServices();
      setLoading(false);
    } catch (error) {
      console.error('Error removing interest:', error);
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentDetails) => {
    setModalVisible(false);

    if (paymentDetails.method === 'pix') {
      const paymentData = { method: 'pix' };
      await bookService(selectedService.id, paymentData);
    } else {
      const paymentData = {
        method: 'card',
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

  const getDaysRemaining = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  console.log(services[0])

  const renderServiceCard = (item, isAvailable) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item?.provider.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={styles.comumContainer}>
            <Text style={styles.workerName}>{item.provider.name}</Text>
            <Text style={styles.description}>{item.name}</Text>
          </View>
        </View>
        <View style={styles.comumContainer}>
            <Text style={styles.cost}>R${item.base_cost}</Text>
          </View>
      </View>
      <View style={styles.comumContainer}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <View style={styles.comumContainer}>
        <Text style={styles.cost}>
          Custo Base: R${item.base_cost}
        </Text>
        <Text style={styles.description}>
          (podendo chegar até R${(item.base_cost / item.max_bookings).toFixed(2)})
        </Text>
      </View>
      <Text style={styles.status}>
        Status: {item.status} | Expira em {getDaysRemaining(item.expiry_date)} dias
      </Text>
      <Text style={styles.interested}>Interessados: {item.bookings.length} de {item.max_bookings}</Text>
      {isAvailable && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleBook(item)}>
          <Text style={styles.buttonText}>Contratar</Text>
        </TouchableOpacity>
      )}
      {!isAvailable && item.status === 'waiting_payment' && (
        <TouchableOpacity
          style={styles.orangeButton}
          onPress={() => releasePayment(item.id)}
        >
          <Text style={styles.buttonText}>Liberar Pagamento</Text>
        </TouchableOpacity>
      )}
      {!isAvailable && item.status === 'available' && (
        <TouchableOpacity
          style={styles.orangeButton}
          onPress={() => removeInterest(item.id)}
        >
          <Text style={styles.buttonText}>Remove Book</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const availableServices = services.filter(
    (service) =>
      service.status === 'available' &&
      !service.bookings.some((booking) => booking.username === profile.user)
  );

  const contractedServices = services.filter((service) =>
    service.bookings.some((booking) => booking.username === profile.user)
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <Profile profile={profile} />

      {/* Available Services */}
      <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
      {loading && <Text>Carregando...</Text>}
      <FlatList
        data={availableServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderServiceCard(item, true)}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
        }
      />

      {/* Contracted Services */}
      <Text style={styles.sectionTitle}>Serviços Contratados</Text>
      <FlatList
        data={contractedServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderServiceCard(item, false)}
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
            <TextInput
              style={styles.pixCode}
              value={qrCode}
              editable={false}
            />
            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                Clipboard.setString(qrCode);
                alert('PIX code copied to clipboard!');
              }}
            >
              <Text style={styles.copyButtonText}>Copy PIX Code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setQrModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f4f4f4' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginVertical: 15 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 15, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3, },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between' },
  avatarContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 1, justifyContent: 'space-between' },
  comumContainer: { alignItems: 'flex-start', marginBottom: 1 },
  avatar: { width: 40, height: 40, borderRadius: 100, marginRight: 20, backgroundColor: '#27AE60', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 14, textAlign: 'center' },
  workerName: { fontSize: 13, fontWeight: 'bold' },
  serviceName: { fontSize: 14, fontWeight: 'bold' },
  description: { fontSize: 12, color: '#7F8C8D' },
  cost: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  status: { fontSize: 14, fontWeight: '600', marginTop: 5 },
  interested: { fontSize: 14, color: '#34495E', marginTop: 10, marginBottom: 10 },
  primaryButton: { backgroundColor: '#27AE60', padding: 10, borderRadius: 6, alignItems: 'center' },
  orangeButton: { backgroundColor: '#FFA726', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', fontSize: 14, color: '#95A5A6' },
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
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  qrCode: { width: 200, height: 200, marginVertical: 20 },
  pixCode: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20 },
  copyButton: { backgroundColor: '#27AE60', padding: 10, borderRadius: 6, marginBottom: 10 },
  copyButtonText: { color: '#FFF', fontWeight: 'bold' },
  closeButton: { backgroundColor: '#F44336', padding: 10, borderRadius: 6 },
  closeButtonText: { color: '#FFF', fontWeight: 'bold' },
});

export default ServicesScreen;
