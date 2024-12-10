import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Profile from '../components/Profile';
import { useProfile } from '../ProfileContext';
import { API_URL } from '@env';
import PaymentModal from '../components/PaymentModal';

const ServicesScreen = () => {
  const profile = useProfile();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
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

  const bookService = async (serviceId, payment) => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/services/${serviceId}/book/`,
        {
          "payment": payment
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchServices(); // Re-fetch services to reflect changes
      setLoading(false);
    } catch (error) {
      console.error('Error booking service:', error);
      setLoading(false);
    }
  };

  const releasePayment = async (serviceId) => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/services/${serviceId}/release_payment/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchServices(); // Re-fetch services to reflect changes
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
        `${API_URL}/api/services/${serviceId}/remove_interest/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchServices(); // Re-fetch services to reflect changes
      setLoading(false);
    } catch (error) {
      console.error('Error removing interest:', error);
      setLoading(false);
    }
  };

  const handleBook = (service) => {
    setSelectedService(service);
    setModalVisible(true);
  };

  const confirmPayment = async (creditCard) => {
    setModalVisible(false);
  
    // Simulate payment success
    const paymentData = { status: 'success', creditCard };

  
    await bookService(selectedService.id, paymentData);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filter services for display
  const availableServices = services.filter(
    (service) =>
      service.status === 'available' &&
      !service.bookings.some((booking) => booking.username === profile.user)
  );

  const contractedServices = services.filter((service) =>
    service.bookings.some((booking) => booking.username === profile.user)
  );

  console.log(selectedService)

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
              Máximo de Contratações: <Text style={styles.detailValue}>{item.max_bookings}</Text>
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
            <PaymentModal
              visible={isModalVisible}
              onClose={() => setModalVisible(false)}
              onConfirm={confirmPayment}
            />
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
            {item.status === 'available' && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => removeInterest(item.id)}
              >
                <Text style={styles.buttonText}>Remover Interesse</Text>
              </TouchableOpacity>
            )}
            {item.status === 'waiting_payment' && (
              <TouchableOpacity
                style={styles.paymentButton}
                onPress={() => releasePayment(item.id)}
              >
                <Text style={styles.buttonText}>Liberar Pagamento</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum serviço contratado no momento.</Text>
        }
      />
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
  secondaryButton: {
    backgroundColor: '#E67E22',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  paymentButton: {
    backgroundColor: '#F46600',
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
});

export default ServicesScreen;
