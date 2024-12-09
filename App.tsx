// App.tsx

import React, { useState, useEffect, useRef } from 'react';
import { API_URL } from '@env';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import AuthenticatedTabs from './src/AuthenticatedTabs';
import LoginScreen from './src/screens/Login';
import HomeScreen from './src/screens/HomeScreen';
import ReservationDetailsScreen from './src/components/ReservationDetailsScreen';
import ComingSoonScreen from './src/screens/ComingSoonScreen';

const RootStack = createNativeStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigationRef = useRef(null); // Reference for navigation

  const checkAuthentication = async () => {
    console.log(API_URL)
    // const token = null
    const token = await AsyncStorage.getItem('accessToken');
    const refreshToken = await AsyncStorage.getItem('refreshToken');

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    console.log('1')
    
    try {
      console.log('2')
      const response = await axios.post(`${API_URL}/api/token/verify/`, { token });
      console.log('3', response.data)
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
      console.error('Token verification failed:', error);
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
            <RootStack.Screen name="ComingSoon" component={ComingSoonScreen} />
          </>
        ) : (
          <>
            <RootStack.Screen name="Home" component={HomeScreen} />
            <RootStack.Screen
              name="Login"
              component={LoginScreen}
              initialParams={{ onLoginSuccess: handleLoginSuccess }}
            />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default App;
