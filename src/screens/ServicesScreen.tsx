import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Profile from '../components/Profile';
import { useProfile } from '../ProfileContext';

const ServicesScreen = () => {
  const profile = useProfile();
  const [services, setServices] = useState([
    {
      id: 1,
      name: "Arrumação Completa do Apartamento",
      baseCost: 100,
      bookedBy: [],
      status: "disponível", // or "em progresso", "Aguardando Liberação de Pagamento", "finalizado"
      date: "2024-11-20",
      worker: {
        name: "João Silva",
        photo: "https://via.placeholder.com/40", // Placeholder photo
      },
    },
    {
      id: 2,
      name: "Manutenção de Ar-Condicionado",
      baseCost: 200,
      bookedBy: [],
      status: "disponível",
      date: "2024-11-21",
      worker: {
        name: "Maria Oliveira",
        photo: "https://via.placeholder.com/40", // Placeholder photo
      },
    },
  ]);

  const bookService = (serviceId, ownerId = "owner1") => {
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === serviceId && service.status === "disponível"
          ? { ...service, bookedBy: [...service.bookedBy, ownerId], status: "em progresso" }
          : service
      )
    );
  };

  const completeService = (serviceId) => {
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === serviceId && service.status === "em progresso"
          ? { ...service, status: "Aguardando Liberação de Pagamento" }
          : service
      )
    );
  };

  const releasePayment = (serviceId) => {
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === serviceId && service.status === "Aguardando Liberação de Pagamento"
          ? { ...service, status: "finalizado" }
          : service
      )
    );
  };

  const availableServices = services.filter((service) => service.status === "disponível");
  const contractedServices = services.filter((service) => service.status !== "disponível");

  return (
    <View style={styles.container}>
      <Profile profile={profile} />
      <Text style={styles.sectionTitle}>Serviços Disponíveis</Text>
      <FlatList
        data={availableServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <View style={styles.workerContainer}>
              <Image source={{ uri: item.worker.photo }} style={styles.workerPhoto} />
              <Text style={styles.workerName}>{item.worker.name}</Text>
            </View>
            <Text style={styles.serviceDetails}>
              Custo: <Text style={styles.detailValue}>R${item.baseCost}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Data: <Text style={styles.detailValue}>{item.date}</Text>
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => bookService(item.id)}
            >
              <Text style={styles.buttonText}>Contratar</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhum serviço disponível no momento.</Text>
        }
      />

      <Text style={styles.sectionTitle}>Serviços Contratados</Text>
      <FlatList
        data={contractedServices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serviceName}>{item.name}</Text>
            <View style={styles.workerContainer}>
              <Image source={{ uri: item.worker.photo }} style={styles.workerPhoto} />
              <Text style={styles.workerName}>{item.worker.name}</Text>
            </View>
            <Text style={styles.serviceDetails}>
              Custo: <Text style={styles.detailValue}>R${item.baseCost}</Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Data: <Text style={styles.detailValue}>{item.date}</Text>
            </Text>
            <Text style={styles.serviceStatus}>Status: {item.status}</Text>
            {item.status === "em progresso" && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => completeService(item.id)}
              >
                <Text style={styles.buttonText}>Finalizar Serviço</Text>
              </TouchableOpacity>
            )}
            {item.status === "Aguardando Liberação de Pagamento" && (
              <TouchableOpacity
                style={styles.secondaryButton}
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
    </View>
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
  workerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  workerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  workerName: {
    fontSize: 14,
    color: "#34495E",
    fontWeight: "600",
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
  serviceStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2980B9",
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: "#27AE60",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: "#E67E22",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#95A5A6",
    fontSize: 14,
    marginVertical: 10,
  },
});

export default ServicesScreen;
