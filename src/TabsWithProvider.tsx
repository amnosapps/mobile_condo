// TabsWithProvider.tsx

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SharedFilesProvider } from './SharedFilesContext';
import FilesScreen from './screens/FilesScreen';
import CalendarReservation from './screens/CalendarReservation';

const Tab = createBottomTabNavigator();

const TabsWithProvider = ({ rootNavigation }) => {
  return (
    <SharedFilesProvider navigation={rootNavigation}> {/* Context provider */}
      <Tab.Navigator>
        <Tab.Screen name="Início" component={CalendarReservation} />
        <Tab.Screen name="Reservas" component={CalendarReservation} />
        <Tab.Screen name="FilesScreen" component={FilesScreen} />
        <Tab.Screen name="Serviços" component={CalendarReservation} />
      </Tab.Navigator>
    </SharedFilesProvider>
  );
};

export default TabsWithProvider;
