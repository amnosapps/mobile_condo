import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';

const Profile = ({ profile }) => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error("No access token found.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/notifications/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(response.data);
        const unread = response.data.filter((notif) => !notif.is_read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const markNotificationAsRead = async (id) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      console.error("No access token found.");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/notifications/${id}/mark_as_read/`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const userInitial = profile?.name?.charAt(0)?.toUpperCase() || "?";

  return (
    <View style={styles.profileContainer}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>Olá, {profile?.name || "Usuário Desconhecido"}!</Text>
          <Text style={styles.condoName}>
            {profile?.condominiums?.[0] || "Condomínio Não Informado"}
          </Text>
        </View>
        {/* Notification Badge */}
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Notificações</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#F46600" />
            ) : (
              <FlatList
                data={notifications}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.notificationItem,
                      !item.is_read && styles.unreadNotification,
                    ]}
                    onPress={() => markNotificationAsRead(item.id)}
                  >
                    <Text style={styles.notificationText}>{item.title}</Text>
                    <Text style={styles.notificationText}>{item.message}</Text>
                    <Text style={styles.notificationDate}>
                      {new Date(item.created_at).toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noNotifications}>Sem notificações.</Text>
                }
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    backgroundColor: 'transparent',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    backgroundColor: '#F46600',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 15
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileInfo: {
    flex: 1,
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
  },
  notificationButton: {
    position: 'absolute',
    top: -5, // Adjust to position the bell properly
    left: 25, // Adjust to position the bell properly
  },
  notificationIcon: {
    fontSize: 18,
    color: '#fff', // Matches the avatar's white text
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#F46600',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#F46600',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  notificationItem: {
    backgroundColor: '#FFF',
    padding: 10,
    marginBottom: 8,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  unreadNotification: {
    // borderColor: '#F46600',
    // borderWidth: 1,
  },
  notificationText: {
    fontSize: 14,
    color: '#333',
  },
  notificationDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  noNotifications: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#F46600',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default Profile;
