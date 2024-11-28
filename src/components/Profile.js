import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const Profile = ({ profile }) => {
  const navigation = useNavigation();

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

  const userInitial = profile?.user?.charAt(0)?.toUpperCase() || "?";

  return (
    <View style={styles.profileContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userInitial}</Text>
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>Olá, {profile?.user || "Usuário Desconhecido"}!</Text>
        <Text style={styles.condoName}>{profile?.condominiums?.[0] || "Condomínio Não Informado"}</Text>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Space out the avatar, info, and button
    backgroundColor: 'transparent',
    marginTop: 6,
    marginBottom: 26,
  },
  avatar: {
    backgroundColor: '#dc574b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12, // Space between avatar and profile info
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileInfo: {
    flex: 1, // Take available space for text
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  condoName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  logoutButton: {
    backgroundColor: '#dc574b',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Profile;
