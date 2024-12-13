import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const screenWidth = Dimensions.get('window').width;

const PaymentsScreen = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPayments = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/api/services/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(response.data);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Failed to load payments.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayments();
  };

  const statusPaymentMap = {
    available: 'Disponível',
    waiting_payment: 'Aguardando Pagamento',
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
  };

  console.log(payments[0]?.bookings?.length)

  const renderPaymentItem = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentCardContent}>
        <View style={styles.paymentInfo}>
          <Text style={styles.serviceName}>{item.name}</Text>
          <Text style={styles.paymentDate}>
            {item.paid_at
              ? `Pago: ${new Date(item.paid_at).toLocaleDateString()}`
              : `Serviço: ${new Date(item.date).toLocaleDateString()}`}
          </Text>
          <Text style={styles.paymentDate}>
            {item.condominium} | {item?.bookings?.filter(booking => booking.active).length} Aptos
          </Text>
        </View>
        <View style={styles.amountStatus}>
          <Text
            style={[
              styles.amount,
              item.status === 'completed' ? styles.positive : styles.pending,
            ]}
          >
            R${item.base_cost}
          </Text>
          <Text style={styles.status}>{statusPaymentMap[item.status]}</Text>
        </View>
      </View>
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={item.status === 'released' ? 'check-circle' : 'hourglass-top'}
          size={24}
          color={item.status === 'released' ? '#2ECC71' : '#F1C40F'}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#27AE60" />
        <Text>Carregando pagamentos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPayments}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recebimentos</Text>
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPaymentItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#ff7b00']} // Refresh spinner color
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No payments available.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 20,
  },
  paymentCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  paymentCardContent: {
    flex: 1,
  },
  paymentInfo: {
    marginBottom: 10,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#34495E',
  },
  paymentDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  amountStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
  },
  positive: {
    color: '#2ECC71',
  },
  pending: {
    color: '#e79d3c',
  },
  negative: {
    color: '#E74C3C',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8C8D',
  },
  iconContainer: {
    marginLeft: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#27AE60',
    padding: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#95A5A6',
    fontSize: 16,
    marginTop: 20,
  },
});

export default PaymentsScreen;
