import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Profile = ({ profile }) => {
  const userInitial = profile?.user?.charAt(0)?.toUpperCase() || "?";

  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{profile?.user || "Usuário Desconhecido"}</Text>
        <Text style={styles.condoName}>{profile?.condominiums?.[0] || "Condomínio Não Informado"}</Text>
      </View>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userInitial}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    backgroundColor: '#dc574b',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  condoName: {
    fontSize: 14,
    color: '#666',
  },
});

export default Profile;
