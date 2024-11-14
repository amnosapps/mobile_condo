// src/Login.tsx

import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, TextInput } from 'react-native';
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

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Login</Text>
            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            {error && <Text style={styles.error}>{error}</Text>}
            <Button title="Login" onPress={handleLogin} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#f7f9fc' },
    title: { fontSize: 24, textAlign: 'center', marginBottom: 24, color: '#DE7066' },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
    },
    error: { color: 'red', textAlign: 'center', marginBottom: 16 },
    file: { padding: 20, borderWidth: 1, margin: 5 },
    fileTitle: { fontWeight: 'bold', backgroundColor: 'rgba(150, 150, 150, 0.3)' },
});

export default LoginScreen;
