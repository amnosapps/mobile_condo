// App.tsx

import React, { useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Button, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import axios from 'axios';
import { API_URL, API_TOKEN } from '@env'; 
import FilesScreen from './src/FilesScreen';
import LoginScreen from './src/Login';

const Stack = createStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthentication = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!token) {
        setIsAuthenticated(false);
        return;
    }

    try {
        // Verify if the access token is still valid
        const response = await axios.post(`${API_URL}/api/token/verify/`, {
            token: token
        });

        if (response.data.valid) {
            setIsAuthenticated(true);
        } else {
            // If the access token is invalid, try refreshing it
            const refreshResponse = await axios.post(`${API_URL}/api/token/refresh/`, {
                refresh: refreshToken,
            });

            const newAccessToken = refreshResponse.data.access;
            await AsyncStorage.setItem('accessToken', newAccessToken);
            setIsAuthenticated(true);
        }
    } catch (error) {
        console.log("Token verification failed:", error);
        setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isAuthenticated ? (
          <Stack.Screen name="Files" component={FilesScreen} />
        ) : (
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};



export default App;
