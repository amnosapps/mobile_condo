import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SharedFilesProvider } from './SharedFilesContext';
import { ProfileProvider } from './ProfileContext';
import { StyleProp, ViewStyle, StyleSheet, TouchableOpacity } from 'react-native';
import * as Animatable from 'react-native-animatable';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

import { API_URL } from '@env';
import ServicesScreen from './screens/ServicesScreen';
import FinancesScreen from './screens/FinancesScreen'; // New screen
import CalendarReservation from './screens/CalendarReservation';
import ApartmentList from './screens/ApartamentScreen';
import FilesScreen from './screens/FilesScreen';

import AsyncStorage from '@react-native-async-storage/async-storage';
import WorkerServicesScreen from './screens/WorkerServicesScreen';

const Tab = createBottomTabNavigator();

export const Icons = {
  MaterialCommunityIcons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
};

export interface IconProps {
  type: Function;
  name: string;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const Icon = ({ type, name, color, size = 24, style }: IconProps) => {
  const fontSize = 24;
  const Tag = type;
  return (
    <>
      {type && name && (
        <Tag name={name} size={size || fontSize} color={color} style={style} />
      )}
    </>
  );
};

const TabArrAll = [
  { route: 'FilesScreen', label: 'FilesScreen', type: Icons.AntDesign, activeIcon: 'addfile', inActiveIcon: 'addfile', component: FilesScreen },
  { route: 'Reservas', label: 'Reservas', type: Icons.FontAwesome, activeIcon: 'calendar', inActiveIcon: 'calendar-outline', component: CalendarReservation },
  { route: 'Apartamentos', label: 'Apartamentos', type: Icons.FontAwesome, activeIcon: 'business', inActiveIcon: 'business-outline', component: ApartmentList },
  { route: 'Serviços', label: 'Serviços', type: Icons.MaterialCommunityIcons, activeIcon: 'shopping', inActiveIcon: 'shopping-outline', component: ServicesScreen },
  // { route: 'Finanças', label: 'Finanças', type: Icons.MaterialCommunityIcons, activeIcon: 'finance', inActiveIcon: 'finance-outline', component: FinancesScreen }, // New tab
];

const TabButton = (props) => {
  const { item, onPress, accessibilityState } = props;
  const focused = accessibilityState.selected;
  const viewRef = useRef(null);

  useEffect(() => {
    if (focused) {
      viewRef.current.animate({ 0: { scale: 0.5 }, 1: { scale: 1.5 } });
    } else {
      viewRef.current.animate({ 0: { scale: 1.5 }, 1: { scale: 1 } });
    }
  }, [focused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={[styles.container, { top: 0 }]}
    >
      <Animatable.View ref={viewRef} duration={300}>
        <Icon
          type={item.type}
          name={focused ? item.activeIcon : item.inActiveIcon}
          color={focused ? '#F46600' : 'grey'}
        />
      </Animatable.View>
    </TouchableOpacity>
  );
};

const TabsWithProvider = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filteredTabs, setFilteredTabs] = useState(TabArrAll); // Default to all tabs

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.warn('No access token found');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const profileData = response.data;
        setProfile(profileData);

        // Filter tabs based on user_type
        if (profileData.user_type === 'user') {
          setFilteredTabs([
            { route: 'Serviços', label: 'Serviços', type: Icons.MaterialCommunityIcons, activeIcon: 'shopping', inActiveIcon: 'shopping-outline', component: WorkerServicesScreen },
            { route: 'Finanças', label: 'Finanças', type: Icons.MaterialCommunityIcons, activeIcon: 'finance', inActiveIcon: 'finance', component: FinancesScreen },
          ]);
        } else {
          setFilteredTabs(TabArrAll);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return null; // Add a loader if needed

  console.log(profile)

  return (
    <SharedFilesProvider>
      <ProfileProvider profile={profile}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#F46600',
            tabBarInactiveTintColor: 'gray',
            tabBarStyle: {
              alignContent: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              position: 'absolute',
              height: 60,
              bottom: 10,
              left: 16,
              right: 16,
              borderRadius: 10,
              marginLeft: 10,
              marginRight: 10,
            },
          }}
        >
          {filteredTabs.map((item, index) => (
            <Tab.Screen
              key={index}
              name={item.route}
              component={item.component}
              options={{
                tabBarShowLabel: false,
                tabBarIcon: ({ color, focused }) => (
                  <Icon
                    type={item.type}
                    name={focused ? item.activeIcon : item.inActiveIcon}
                    color={color}
                  />
                ),
                tabBarButton: (props) => <TabButton {...props} item={item} />,
              }}
              initialParams={{ profile }}
            />
          ))}
        </Tab.Navigator>
      </ProfileProvider>
    </SharedFilesProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
  },
});

export default TabsWithProvider;
