import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '@env';
import { useProfile } from '../ProfileContext';
import Profile from '../components/Profile';

const ApartmentList = ({ route }) => {
  const profile = useProfile();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(API_URL, profile);
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
          params: { condominium: profile.condominiums[0] }, // Pass the condominium ID or name as a param
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

  const renderApartmentCard = ({ item }) => {
    const statusColors = {
      0: '#36a2eb', // Available
      1: '#ff6384', // Occupied
      2: '#ffce56', // Maintenance
    };

    const statusLabels = {
      0: "Disponível",
      1: "Ocupado",
      2: "Manutenção",
    };

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => console.log(`Selected Apartment ${item.number}`)} // Placeholder for card press action
      >
        <View style={styles.cardHeader}>
          <Text style={styles.apartmentNumber}>Apartamento: {item.number}</Text>
          <Text
            style={[
              styles.apartmentStatus,
              { color: statusColors[item.status] || '#000' },
            ]}
          >
            {statusLabels[item.status]}
          </Text>
        </View>
        <Text style={styles.apartmentDetails}>Tipo: {item.type}</Text>
        <Text style={styles.apartmentDetails}>Capacidade: {item.max_occupation}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#DE7066" />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F4', // Light gray for the background
    padding: 10,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF', // White card
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#DC574B',
  },
});

export default ApartmentList;
