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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Profile from "../components/Profile";
import { useProfile } from "../ProfileContext";

import { API_URL } from "@env";

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

  // Fetch services for the current worker
  const fetchServices = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/services/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { worker: profile.user.id }, // Fetch services tied to the worker
      });
      setServices(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching services:", error);
      setLoading(false);
    }
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

  const handleMarkAsCompleted = async (serviceId) => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/services/${serviceId}/complete/`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setServices((prevServices) =>
        prevServices.map((service) =>
          service.id === serviceId && service.status === "in_progress"
            ? { ...service, status: "waiting_payment" } // Update status to 'waiting_payment'
            : service
        )
      );
      setLoading(false);
      setDetailModalVisible(false); // Close the detail modal
    } catch (error) {
      console.error("Error marking service as completed:", error);
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
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
            <Text style={styles.serviceDetails}>
              Descrição:{" "}
              <Text style={styles.detailValue}>
                {item.description || "Nenhuma descrição"}
              </Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Custo Base: <Text style={styles.detailValue}>R${item.base_cost}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Máximo de Contratações:{" "}
              <Text style={styles.detailValue}>{item.max_bookings}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Data do Serviço: <Text style={styles.detailValue}>{item.date}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Status: <Text style={styles.detailValue}>{item.status}</Text>
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhum serviço registrado no momento.
          </Text>
        }
      />

      {/* Add Service Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
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

      {/* Service Detail Modal */}
      {selectedService && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedService.name}</Text>
              <Text>Descrição: {selectedService.description}</Text>
              <Text>Custo Base: R${selectedService.base_cost}</Text>
              <Text>Data: {selectedService.date}</Text>
              <Text>Status: {selectedService.status}</Text>
              {selectedService.status === "in_progress" && (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleMarkAsCompleted(selectedService.id)}
                >
                  <Text style={styles.buttonText}>Marcar como Concluído</Text>
                </TouchableOpacity>
              )}
              <Button
                title="Fechar"
                onPress={() => setDetailModalVisible(false)}
              />
            </View>
          </View>
        </Modal>
      )}
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
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#FFF",
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
    fontSize: 16,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 8,
  },
  serviceDetails: {
    fontSize: 14,
    color: "#7F8C8D",
    marginBottom: 4,
  },
  detailValue: {
    fontWeight: "600",
    color: "#34495E",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 8,
    width: "80%",
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
