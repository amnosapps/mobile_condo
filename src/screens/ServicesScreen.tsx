import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Profile from '../components/Profile';
import { useProfile } from '../ProfileContext';
import moment from 'moment';

const ServicesScreen = () => {
  const profile = useProfile();
  const [services, setServices] = useState([
    {
      id: 1,
      name: "Arrumação Completa do Apartamento",
      baseCost: 100,
      bookedBy: ["João Guilherme"], // Stores names of owners
      maxBookings: 5, // Maximum capacity for booking
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
      maxBookings: 3,
      status: "disponível",
      date: "2024-12-03",
      worker: {
        name: "Maria Oliveira",
        photo: "https://via.placeholder.com/40", // Placeholder photo
      },
    },
  ]);

  const calculateCostPerOwner = (service) => {
    const totalOwners = service.bookedBy.length || 1;
    return (service.baseCost / totalOwners).toFixed(2); // Rounded to 2 decimals
  };

  const calculateMinCostPerOwner = (service) => {
    return (service.baseCost / service.maxBookings).toFixed(2); // Minimum cost if fully booked
  };

  const getContractableDateLimit = (service) => {
    const serviceDate = moment(service.date, "YYYY-MM-DD");
    return serviceDate.subtract(3, "days").format("YYYY-MM-DD"); // Subtract 3 days and format
  };

  const getDaysToExpire = (service) => {
    const today = moment();
    const contractableLimit = moment(getContractableDateLimit(service), "YYYY-MM-DD");
    const daysLeft = contractableLimit.diff(today, "days");
    return daysLeft > 0 ? daysLeft : 0; // Return 0 if already expired
  };

  const isContractable = (service) => {
    const serviceDate = moment(service.date, "YYYY-MM-DD");
    const today = moment();
    return serviceDate.diff(today, "days") > 3; // Check if the service date is more than 3 days away
  };

  const bookService = (serviceId) => {
    setServices((prevServices) =>
      prevServices.map((service) =>
        service.id === serviceId &&
        service.status === "disponível" &&
        service.bookedBy.length < service.maxBookings
          ? {
              ...service,
              bookedBy: [...service.bookedBy, profile.user], // Add current user to bookedBy
              status:
                service.bookedBy.length + 1 === service.maxBookings
                  ? "em progresso"
                  : service.status, // Change status if fully booked
            }
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image source={{ uri: item.worker.photo }} style={styles.workerPhoto} />
                <Text style={styles.workerName}>{item.worker.name}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.bookingCount}>
                  {item.bookedBy.length}/{item.maxBookings}
                </Text>
              </View>
            </View>
            <Text style={styles.serviceDetails}>
              Custo por pessoa:{" "}
              <Text style={styles.detailValue}>
                R${calculateCostPerOwner(item)}{" "}
              </Text>
              <Text style={styles.minCost}>
                (esse valor pode chegar a R${calculateMinCostPerOwner(item)})
              </Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Data do Serviço: <Text style={styles.detailValue}>{item.date}</Text>
            </Text>
            {item.bookedBy.length > 0 && (
              <Text style={styles.interestedOwners}>
                Interessados: {item.bookedBy.join(", ")}
              </Text>
            )}
            {isContractable(item) && item.bookedBy.length < item.maxBookings ? (
              <>
                <Text style={styles.expireInfo}>
                  {getDaysToExpire(item)} dias para expirar a oferta
                </Text>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => bookService(item.id)}
                  >
                  <Text style={styles.buttonText}>Contratar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.fullText}>Serviço lotado ou prazo de contratação expirado</Text>
            )}
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Image source={{ uri: item.worker.photo }} style={styles.workerPhoto} />
                <Text style={styles.workerName}>{item.worker.name}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.bookingCount}>
                  {item.bookedBy.length}/{item.maxBookings}
                </Text>
              </View>
            </View>
            <Text style={styles.serviceDetails}>
              Custo por pessoa:{" "}
              <Text style={styles.detailValue}>
                R${calculateCostPerOwner(item)}{" "}
              </Text>
              <Text style={styles.minCost}>
                (esse valor pode chegar a R${calculateMinCostPerOwner(item)})
              </Text>
            </Text>
            <Text style={styles.serviceDetails}>
              Data do Serviço: <Text style={styles.detailValue}>{item.date}</Text>
            </Text>
            {item.bookedBy.length > 0 && (
              <Text style={styles.interestedOwners}>
                Interessados: {item.bookedBy.join(", ")}
              </Text>
            )}
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
  expireInfo: {
    fontSize: 14,
    color: "#E67E22",
    marginBottom: 8,
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
  workerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: 'space-between'
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
  minCost: {
    fontSize: 12,
    color: "#95A5A6",
    fontStyle: "italic",
  },
  bookingCount: {
    fontSize: 17,
    color: "#2C3E50",
    marginBottom: 4,
    fontWeight: "600",
  },
  interestedOwners: {
    fontSize: 14,
    color: "#2C3E50",
    fontStyle: "italic",
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: "#E74C3C",
    fontWeight: "bold",
    marginBottom: 8,
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
  fullText: {
    textAlign: "center",
    color: "#E74C3C",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
});

export default ServicesScreen;
