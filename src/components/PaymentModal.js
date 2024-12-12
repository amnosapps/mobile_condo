import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  ScrollView,
} from "react-native";

const PaymentModal = ({ visible, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");

  const [identificationType, setIdentificationType] = useState("CPF");
  const [identificationNumber, setIdentificationNumber] = useState("");
  const [shopperName, setShopperName] = useState("");
  const [shopperEmail, setShopperEmail] = useState("");
  const [shopperPhone, setShopperPhone] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");
    try {
      if (paymentMethod === "pix") {

        const  payload = {
          method: "pix",
          shopper: {
            email: shopperEmail,
            name: shopperName,
            document: {
              type: identificationType,
              number: identificationNumber,
            },
            phone: {
              type: "MOBILE",
              number: shopperPhone,
            },
          },
        }

        console.log(payload)
        const pixPaymentData = await onConfirm(payload);

        if (pixPaymentData && pixPaymentData.qr_code) {
          setQrCode(pixPaymentData.qr_code);
          setQrCodeBase64(pixPaymentData.qr_code_base64);
        } else {
          setError("Falha ao gerar o pagamento PIX. Por favor, tente novamente.");
        }
      } else {
        alert("Apenas pagamento PIX é suportado no momento.");
      }
    } catch (err) {
      setError("Ocorreu um erro ao processar o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Pix</Text>

          {/* <View style={styles.methodSelector}>
            <TouchableOpacity
              style={[
                styles.paymentMethodButton,
                paymentMethod === "pix" && styles.selectedPaymentMethod,
              ]}
              onPress={() => setPaymentMethod("pix")}
            >
              <Text style={styles.paymentMethodText}>PIX</Text>
            </TouchableOpacity>
          </View> */}

          <ScrollView contentContainerStyle={{ alignItems: "center", width: "100%" }}>
            {loading ? (
              <ActivityIndicator size="large" color="#27AE60" />
            ) : qrCode ? (
              <>
                <Text style={styles.sectionTitle}>Escaneie o QR Code:</Text>
                {qrCodeBase64 && (
                  <Image
                    source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
                    style={styles.qrCode}
                  />
                )}
                <Text style={styles.sectionTitle}>Ou use o código PIX:</Text>
                <TextInput
                  style={styles.pixCode}
                  value={qrCode}
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    navigator.clipboard.writeText(qrCode);
                    alert("Código PIX copiado para a área de transferência!");
                  }}
                >
                  <Text style={styles.copyText}>Copiar Código PIX</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={{ justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
                <TextInput
                  style={styles.input}
                  placeholder="Nome Completo"
                  value={shopperName}
                  onChangeText={setShopperName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-mail"
                  value={shopperEmail}
                  onChangeText={setShopperEmail}
                  keyboardType="email-address"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tipo de Documento (CPF)"
                  value={identificationType}
                  onChangeText={setIdentificationType}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Número do Documento"
                  value={identificationNumber}
                  onChangeText={setIdentificationNumber}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Número de Telefone"
                  value={shopperPhone}
                  onChangeText={setShopperPhone}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={handlePayment}
                >
                  <Text style={styles.generateButtonText}>
                    Gerar Pagamento PIX
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  modalContent: {
    width: "85%",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  methodSelector: {
    flexDirection: "row",
    marginBottom: 20,
  },
  paymentMethodButton: {
    backgroundColor: "#E0E0E0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  selectedPaymentMethod: {
    backgroundColor: "#27AE60",
  },
  paymentMethodText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
  },
  pixCode: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    width: "100%",
    textAlign: "center",
    fontSize: 14,
  },
  qrCode: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  copyButton: {
    backgroundColor: "#27AE60",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  copyText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    width: 300,
  },
  generateButton: {
    backgroundColor: "#27AE60",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    width: "100%",
    marginTop: 10,
  },
  generateButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 30,
    backgroundColor: "#F44336",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
});

export default PaymentModal;
