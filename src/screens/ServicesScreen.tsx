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

  const releasePayment = async (serviceId, paymentId) => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/services/${serviceId}/release_payment/`,
        { payment_id: paymentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchServices();
      setLoading(false);
    } catch (error) {
      console.error('Error releasing payment:', error);
      setLoading(false);
    }
  };

  const removeInterest = async (serviceId, bookingId) => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/services/${serviceId}/remove_interest/`,
        { booking_id: bookingId },
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
      await bookService(selectedService.id, paymentDetails);
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

  const statusServiceMap = {
    available: 'Disponível',
    waiting_payment: 'Aguardando Pagamento',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  const statusPaymentMap = {
    pending: 'Pendente',
    paid: 'Pago',
    released: 'Libertado',
    failed: 'Erro',
    processing: 'Processando',
  };

  const renderServiceCard = (item) => {
    const lastBooking = item.bookings?.find((booking) => booking.username === profile.user && booking.active === true);
    const lastPayment = lastBooking?.payments?.[lastBooking.payments.length - 1] || null;
  
    const paymentStatus = lastPayment ? lastPayment.status : "none";
    const serviceStatus = item.status;
  
    // Default values for buttons
    let buttonLabel = "Finalizado";
    let buttonAction = null;
    let buttonStyle = styles.grayButton;
    let buttonDisabled = true;
  
    if (!lastBooking || lastBooking.active === false) {
      // If the service is not booked by the user
      buttonLabel = "Contratar";
      buttonAction = () => handleBook(item);
      buttonStyle = styles.primaryButton;
      buttonDisabled = false;
    } else if (paymentStatus === "pending" && serviceStatus === "available") {
      buttonLabel = "Remover Interesse";
      buttonAction = () => removeInterest(item.id, lastBooking.id);
      buttonStyle = styles.orangeButton;
      buttonDisabled = false;
    } else if (serviceStatus === "available" && paymentStatus === "paid") {
      buttonLabel = "Remover Interesse";
      buttonAction = () => removeInterest(item.id, lastBooking.id);
      buttonStyle = styles.orangeButton;
      buttonDisabled = false;
    } else if (serviceStatus === "in_progress" && paymentStatus === "paid") {
      buttonLabel = "Aguarde o Término do Serviço";
      buttonStyle = styles.grayButton;
      buttonDisabled = true;
    } else if (paymentStatus === "paid" && serviceStatus === "waiting_payment") {
      buttonLabel = "Liberar Pagamento";
      buttonAction = () => releasePayment(item.id, lastPayment.id);
      buttonStyle = styles.orangeButton;
      buttonDisabled = false;
    } else if (paymentStatus === "released" && serviceStatus === "completed") {
      buttonLabel = "Finalizado";
      buttonStyle = styles.grayButton;
      buttonDisabled = true;
    } else if (paymentStatus === "processing") {
      buttonLabel = "Processando Pagamento, aguarde!";
      buttonStyle = styles.grayButton;
      buttonDisabled = true;
    } else if (paymentStatus === "failed") {
      buttonLabel = "Erro ao Liberar pagamento";
      buttonAction = () => releasePayment(item.id, lastPayment.id);
      buttonStyle = styles.redButton;
      buttonDisabled = false;
    }

    const activeBookings = item.bookings.filter(booking => booking.active);
    const activeBookingsLength = activeBookings.length;
  
    return (
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
        {}
        <Text style={styles.status}>
          Status: {statusServiceMap[serviceStatus]} {!lastBooking && (<>(oferta expira em {getDaysRemaining(item.date)} dias)</>)}
        </Text>
        <Text style={styles.interested}>Interessados: {activeBookingsLength} de {item.max_bookings}</Text>
        {lastPayment && lastBooking.active === true && (
          <View style={styles.paymentsSection}>
            <Text style={styles.paymentInfo}>
              Último Pagamento: R${lastPayment.amount_paid} - Status:{" "}
              {statusPaymentMap[lastPayment.status]}
            </Text>
            {/* <TouchableOpacity
              style={styles.viewPaymentsButton}
              onPress={() => console.log(lastBooking.payments)}
            >
              <Text style={styles.viewPaymentsText}>Outros Pagamentos</Text>
            </TouchableOpacity> */}
          </View>
        )}
        <TouchableOpacity
          style={[buttonStyle, buttonDisabled && styles.disabledButton]}
          onPress={buttonAction}
          disabled={buttonDisabled}
        >
          <Text style={styles.buttonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const availableServices = services.filter(
    (service) =>
      service.status === 'available' &&
      !service.bookings.some((booking) => booking.username === profile.user && booking.active === true)
  );

  const contractedServices = services.filter((service) =>
    service.bookings.some((booking) => booking.username === profile.user && booking.active === true)
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
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
  contentContainer: {
    paddingBottom: 100, // Add enough padding to prevent overlap with tab bar
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginVertical: 15 },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 8, marginBottom: 15, shadowColor: '#000',
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5, },
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
  redButton: { backgroundColor: '#ff5555', padding: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
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
  grayButton: {
    backgroundColor: "#d3d3d3",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  viewPaymentsButton: {
    marginTop: 10,
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  viewPaymentsText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  paymentsSection: {
    marginTop: 10,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  paymentInfo: {
    fontSize: 12,
    color: "#555",
  },
  
});

export default ServicesScreen;
