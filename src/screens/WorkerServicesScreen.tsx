import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Button,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Profile from "../components/Profile";
import { useProfile } from "../ProfileContext";
import { API_URL } from "@env";

const statusServiceMap = {
  available: 'Disponível',
  waiting_payment: 'Aguardando Pagamento',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const WorkerServicesScreen = () => {
  const profile = useProfile();
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    base_cost: "",
    max_bookings: "",
    date: "",
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/services/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { worker: profile.user.id },
      });
      setServices(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching services:", error);
      setLoading(false);
    }
  };

  const handleStartBooking = async (bookingId) => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/bookings/${bookingId}/start_booking/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update booking status in UI
      setSelectedService((prevService) => ({
        ...prevService,
        bookings: prevService.bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: "in_progress" } : booking
        ),
      }));
      setLoading(false);
    } catch (error) {
      console.error("Error starting booking:", error);
      setLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/bookings/${bookingId}/complete_booking/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Update booking status in UI
      setSelectedService((prevService) => ({
        ...prevService,
        bookings: prevService.bookings.map((booking) =>
          booking.id === bookingId ? { ...booking, status: "waiting_payment" } : booking
        ),
      }));
      setLoading(false);
    } catch (error) {
      console.error("Error completing booking:", error);
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices().finally(() => setRefreshing(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = async () => {
    if (
      newService.name &&
      newService.base_cost &&
      newService.max_bookings &&
      newService.date
    ) {
      const token = await AsyncStorage.getItem("accessToken");
      try {
        setLoading(true);
        const response = await axios.post(
          `${API_URL}/api/services/`,
          {
            name: newService.name,
            description: newService.description,
            base_cost: newService.base_cost,
            max_bookings: newService.max_bookings,
            date: newService.date,
            provider: profile.user.service_provider_id, // Ensure the provider is sent correctly
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setServices([...services, response.data]);
        setNewService({
          name: "",
          description: "",
          base_cost: "",
          max_bookings: "",
          date: "",
        });
        setModalVisible(false);
        setLoading(false);
      } catch (error) {
        console.error("Error adding service:", error);
        setLoading(false);
      }
    } else {
      alert("Por favor, preencha todos os campos.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Profile profile={profile} />
      <Text style={styles.sectionTitle}>Registrar Novo Serviço</Text>
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Adicionar Serviço</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Serviços Registrados</Text>
      {loading && <Text>Carregando...</Text>}
      <FlatList
        data={services}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              setSelectedService(item);
              setDetailModalVisible(true);
            }}
          >
            <Text style={styles.serviceName}>{item.name}</Text>
            <Text style={styles.serviceDetails}>{item.condominium}</Text>
            <Text style={styles.serviceDetails}>Data do Serviço: {item.date}</Text>
            <Text style={styles.serviceDetails}>Valor: R${item.base_cost}</Text>
            <Text style={styles.serviceDetails}>
              Interessados {item?.bookings?.filter(booking => booking.active).length}
            </Text>
            <Text style={[
              styles.serviceDetails,
              item.status === 'completed' ? styles.positive : styles.pending,
            ]}>
              Status: {statusServiceMap[item.status]}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum serviço registrado no momento.</Text>
        }
      />

      {selectedService && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <ScrollView contentContainerStyle={styles.modalScrollContainer}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text>{selectedService.condominium}</Text>
                <Text style={styles.modalTitle}>{selectedService.name}</Text>
                <Text>Status do Serviço: {statusServiceMap[selectedService.status]}</Text>
                <Text>VAlor: R${selectedService.base_cost}</Text>
                <Text>Data do Serviço: {selectedService.date}</Text>
                <Text>Máximo de Contratações: {selectedService.max_bookings}</Text>

                {/* Bookings */}
                <Text style={styles.sectionTitle}>Contratações</Text>
                <FlatList
                  data={selectedService.bookings || []}
                  keyExtractor={(booking) => booking.id.toString()}
                  renderItem={({ item }) => (
                    item.active && (
                      <View style={styles.bookingCard}>
                        <Text>Apto: {item.apartment.number} - {item.username}</Text>
                        <Text>Data de Contratação: {item.booked_on}</Text>
                        <Text>Status da Contratação: {statusServiceMap[item.status]}</Text>

                        {/* Booking Actions */}
                        {item.status === "available" && (
                          <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => handleStartBooking(item.id)}
                          >
                            <Text style={styles.buttonText}>Iniciar Serviço</Text>
                          </TouchableOpacity>
                        )}
                        {item.status === "in_progress" && (
                          <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => handleCompleteBooking(item.id)}
                          >
                            <Text style={styles.buttonText}>Finalizar Serviço</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )
                  )}
                />
                <Button
                  title="Fechar"
                  onPress={() => setDetailModalVisible(false)}
                />
              </View>
            </View>
          </ScrollView>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalScrollContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Novo Serviço</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome do Serviço"
              value={newService.name}
              onChangeText={(text) =>
                setNewService({ ...newService, name: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              value={newService.description}
              onChangeText={(text) =>
                setNewService({ ...newService, description: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Custo Base (R$)"
              keyboardType="numeric"
              value={newService.base_cost}
              onChangeText={(text) =>
                setNewService({ ...newService, base_cost: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Máximo de Contratações"
              keyboardType="numeric"
              value={newService.max_bookings}
              onChangeText={(text) =>
                setNewService({ ...newService, max_bookings: text })
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Data do Serviço (YYYY-MM-DD)"
              value={newService.date}
              onChangeText={(text) =>
                setNewService({ ...newService, date: text })
              }
            />
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAddService}
            >
              <Text style={styles.buttonText}>Salvar Serviço</Text>
            </TouchableOpacity>
            <Button title="Cancelar" onPress={() => setModalVisible(false)} />
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
    backgroundColor: "#F9FAFB",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginVertical: 15,
  },
  primaryButton: {
    backgroundColor: "#27AE60",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 0.3,
    borderColor: '#000',
    borderRadius: 5,
    marginBottom: 10,
    padding: 5
  },
  positive: {
    color: '#2ECC71',
  },
  pending: {
    color: '#e79d3c',
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#EDEDED",
  },
  serviceName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 6,
  },
  serviceDetails: {
    fontSize: 14,
    color: "#7f8c8d",
  },
  bookingCard: {
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
  },
  paymentDetails: {
    paddingLeft: 10,
    marginVertical: 5,
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 8,
    width: "90%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  emptyText: {
    textAlign: "center",
    color: "#95A5A6",
    fontSize: 14,
    marginVertical: 10,
  },
});

export default WorkerServicesScreen;
