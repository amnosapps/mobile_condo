// App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '@env';
import AuthenticatedTabs from './src/AuthenticatedTabs';
import LoginScreen from './src/screens/Login';
import FilesScreen from './src/screens/FilesScreen';
import ReservationDetailsScreen from './src/components/ReservationDetailsScreen';

const RootStack = createNativeStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigationRef = useRef(null); // Reference for navigation

  const checkAuthentication = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/api/token/verify/`, { token });
      if (response.status === 200) {
        setIsAuthenticated(true);
      } else {
        const refreshResponse = await axios.post(`${API_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = refreshResponse.data.access;
        await AsyncStorage.setItem('accessToken', newAccessToken);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.log('Token verification failed:', error);
      setIsAuthenticated(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="AuthenticatedTabs" component={AuthenticatedTabs} />
            <RootStack.Screen name="ReservationDetails" component={ReservationDetailsScreen} />
          </>
        ) : (
          <RootStack.Screen
            name="Login"
            component={LoginScreen}
            initialParams={{ onLoginSuccess: handleLoginSuccess }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default App;
