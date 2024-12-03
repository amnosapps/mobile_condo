import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ComingSoonScreen = ({ navigation }) => {
    const handleLogout = async () => {
        try {
          // Clear tokens from AsyncStorage
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('refreshToken');
          navigation.navigate('Root', { screen: 'Home' });
        } catch (error) {
          console.error('Error during logout:', error);
        }
      };

    const PdfButton = ({ title, onPress }) => {
        return (
          <TouchableOpacity style={styles.reservationButton} onPress={onPress}>
            <Text style={styles.textReservationButton}>{title}</Text>
          </TouchableOpacity>
        );
      };

    return (
        <View style={styles.container}>
        <Image
            source={require('../assets/igoove.png')} // Replace with your image path
            style={styles.image}
            resizeMode="contain"
        />
        <Text style={styles.title}>Em Breve...</Text>
        <Text style={styles.description}>
            Estamos trabalhando para novas atualizações
        </Text>
        <PdfButton title="Sair" onPress={handleLogout} />
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  image: {
    width: 200, // Adjust as needed
    height: 200, // Adjust as needed
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2d3436',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#636e72',
  },
  reservationButton: {
    alignSelf: 'center',
    borderRadius: 20,
    marginTop: 50,
    backgroundColor: '#F46600',
    paddingVertical: 10,
    paddingHorizontal: 100,
  },
  textReservationButton: {
    textAlign: 'center',
    color: '#fff',
  },
});

export default ComingSoonScreen;
