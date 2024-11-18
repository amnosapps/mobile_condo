import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>iGoove</Text>
      <Image
        source={require('../assets/igoove.png')} // Replace with your image path
        style={styles.logo}
        resizeMode="contain"
      />
      <View>
        <Text style={styles.description1}>
            Gestão de condomínio sem dor de cabeça.
        </Text>
        <Text style={styles.description2}>
            Antecipe Problemas e Garanta a Tranquilidade no Seu Condomínio!
        </Text>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.buttonText}>Acessar Plataforma</Text>
      </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 100,
    color: '#DE7066',
  },
  logo: {
    width: 250, // Adjust width as needed
    height: 250, // Adjust height as needed
    marginBottom: 100, // Add spacing below the image
  },
  description1: {
    fontSize: 16,
    textAlign: 'left',
    color: '#DE7066',
  },
  description2: {
    fontSize: 25,
    textAlign: 'left',
    color: '#636e72',
    fontWeight: 500
  },
  button: {
    backgroundColor: '#DE7066',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 20,
    marginTop: 80
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
