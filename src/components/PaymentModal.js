import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  Button,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Image,
  TouchableOpacity,
} from "react-native";

const PaymentModal = ({ visible, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("pix"); // Default to PIX
  const [error, setError] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");

  const [creditCard, setCreditCard] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [identificationType, setIdentificationType] = useState("CPF");
  const [identificationNumber, setIdentificationNumber] = useState("");

  const handlePayment = async () => {
    setLoading(true);
    setError("");
    try {
      if (paymentMethod === "pix") {
        const pixPaymentData = await onConfirm({ method: "pix" });
        if (pixPaymentData && pixPaymentData.qr_code) {
          setQrCode(pixPaymentData.qr_code);
          setQrCodeBase64(pixPaymentData.qr_code_base64);
        } else {
          setError("Failed to generate PIX payment. Please try again.");
        }
      } else if (paymentMethod === "card") {
        const [expirationMonth, expirationYear] = expirationDate.split("/");
        const cardPaymentData = {
          method: "card",
          creditCard,
          cardHolderName,
          expirationMonth,
          expirationYear: `20${expirationYear}`,
          cvv,
          identificationType,
          identificationNumber,
        };
        await onConfirm(cardPaymentData);
        alert("Credit card payment initiated.");
        onClose();
      }
    } catch (err) {
      setError("An error occurred while processing the payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Payment</Text>

          {/* Payment Method Selection */}
          <View style={styles.methodSelector}>
            <Button
              title="PIX"
              color={paymentMethod === "pix" ? "#27AE60" : "#ccc"}
              onPress={() => setPaymentMethod("pix")}
            />
            <Button
              title="Credit Card"
              color={paymentMethod === "card" ? "#27AE60" : "#ccc"}
              onPress={() => setPaymentMethod("card")}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : paymentMethod === "pix" ? (
            qrCode ? (
              <>
                <Text style={styles.pixTitle}>Scan the QR Code:</Text>
                {qrCodeBase64 && (
                  <Image
                    source={{ uri: `data:image/png;base64,${qrCodeBase64}` }}
                    style={styles.qrCode}
                  />
                )}
                <Text style={styles.pixTitle}>Or use the PIX code:</Text>
                <TextInput
                  style={styles.pixCode}
                  value={qrCode}
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={() => {
                    navigator.clipboard.writeText(qrCode);
                    alert("PIX code copied to clipboard!");
                  }}
                >
                  <Text style={styles.copyText}>Copy PIX Code</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Button title="Generate PIX Payment" onPress={handlePayment} />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </>
            )
          ) : (
            <>
              {/* Credit Card Form */}
              <TextInput
                style={styles.input}
                placeholder="Credit Card Number"
                value={creditCard}
                onChangeText={setCreditCard}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="Cardholder Name"
                value={cardHolderName}
                onChangeText={setCardHolderName}
              />
              <TextInput
                style={styles.input}
                placeholder="Expiration Date (MM/YY)"
                value={expirationDate}
                onChangeText={setExpirationDate}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.input}
                placeholder="CVV"
                value={cvv}
                onChangeText={setCvv}
                keyboardType="numeric"
                secureTextEntry={true}
              />
              <TextInput
                style={styles.input}
                placeholder="Identification Type (CPF)"
                value={identificationType}
                onChangeText={setIdentificationType}
              />
              <TextInput
                style={styles.input}
                placeholder="Identification Number"
                value={identificationNumber}
                onChangeText={setIdentificationNumber}
                keyboardType="numeric"
              />
              <Button title="Pay with Card" onPress={handlePayment} />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </>
          )}

          <Button title="Close" onPress={onClose} color="red" />
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
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  methodSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 20,
  },
  pixTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 10,
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
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  copyButton: {
    marginTop: 10,
    backgroundColor: "#27AE60",
    padding: 10,
    borderRadius: 5,
  },
  copyText: {
    color: "white",
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 10,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    width: "100%",
  },
});

export default PaymentModal;
