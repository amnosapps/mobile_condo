// src/Login.tsx

import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';

const LoginScreen = ({ route }) => {
    const { onLoginSuccess } = route.params;

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        try {
            const response = await axios.post(`${API_URL}/api/token/`, {
                username,
                password,
            }).catch();

            await AsyncStorage.setItem('accessToken', response.data.access);
            await AsyncStorage.setItem('refreshToken', response.data.refresh);

            if (onLoginSuccess) onLoginSuccess();
        } catch (err) {
            console.error(err)
            setError('Login failed, please check your credentials.');
        }
    };

    const CustomButton = ({ title, onPress }) => {
        return (
          <TouchableOpacity style={styles.LoginBUtton} onPress={onPress}>
            <Text style={styles.textLoginBUtton}>{title}</Text>
          </TouchableOpacity>
        );
      };

    return (
        <SafeAreaView style={styles.container}>
            <View>
                <Text style={styles.title}>iGoove</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Usuário"
                    value={username}
                    onChangeText={setUsername}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Senha"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                {error && <Text style={styles.error}>{error}</Text>}
                <CustomButton title="Entrar" onPress={handleLogin} />
            </View>
            <View>
                <TouchableOpacity style={{ position: 'absolute', top: 10, left: 100, right: 100, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#000', textAlign: 'center' }}>Ainda não tem cadastro?</Text>
                    <Text style={{ color: '#DE7066', textAlign: 'center', fontWeight: '500', textDecorationLine: 'underline' }}>Fale Conosco!</Text>
                </TouchableOpacity>
            </View>
            
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#f7f9fc' },
    title: { fontSize: 24, textAlign: 'center', marginBottom: 24, color: '#DE7066', fontWeight: '500' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        marginBottom: 16,
        borderRadius: 20
    },
    error: { color: 'red', textAlign: 'center', marginBottom: 16 },
    file: { padding: 20, borderWidth: 1, margin: 5 },
    fileTitle: { fontWeight: 'bold', backgroundColor: 'rgba(150, 150, 150, 0.3)' },
    LoginBUtton: {
        backgroundColor: '#DE7066',
        padding: 10,
        borderRadius: 20

    },
    textLoginBUtton: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '500'
    }
});

export default LoginScreen;
