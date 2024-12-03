// TabsWithProvider.tsx

import React, { useEffect, useRef, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SharedFilesProvider } from './SharedFilesContext';
import FilesScreen from './screens/FilesScreen';
import CalendarReservation from './screens/CalendarReservation';
import { ProfileProvider } from './ProfileContext'
import { StyleProp, ViewStyle, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import * as Animatable from 'react-native-animatable';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/Ionicons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Foundation from 'react-native-vector-icons/Foundation';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import HomeScreen from './screens/HomeScreen';
import ComingSoonScreen from './screens/ComingSoonScreen';
import ProfileScreen from './components/Profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

import { API_URL } from '@env';
import ApartmentList from './screens/ApartamentScreen';
import ServicesScreen from './screens/ServicesScreen';


const Tab = createBottomTabNavigator();

export const Icons = {
  MaterialCommunityIcons,
  MaterialIcons,
  Ionicons,
  Feather,
  FontAwesome,
  FontAwesome5,
  AntDesign,
  Entypo,
  SimpleLineIcons,
  Octicons,
  Foundation,
  EvilIcons,
}

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
  )
}

const TabArr = [
  { route: 'FilesScreen', label: 'FilesScreen', type: Icons.AntDesign, activeIcon: 'addfile', inActiveIcon: 'addfile', component: FilesScreen },
  { route: 'Reservas', label: 'Reservas', type: Icons.Ionicons, activeIcon: 'calendar-number-sharp', inActiveIcon: 'calendar-number-outline', component: CalendarReservation },
  { route: 'Apartamentos', label: 'Apartamentos', type: Icons.FontAwesome, activeIcon: 'business', inActiveIcon: 'business-outline', component: ApartmentList },
  { route: 'Serviços', label: 'Serviços', type: Icons.MaterialCommunityIcons, activeIcon: 'shopping', inActiveIcon: 'shopping-outline', component: ServicesScreen },
];

const TabButton = (props) => {
  const { item, onPress, accessibilityState } = props;
  const focused = accessibilityState.selected;
  const viewRef = useRef(null);

  useEffect(() => {
    if (focused) {
      viewRef.current.animate({ 0: { scale: .5}, 1: { scale: 1.5 } });
    } else {
      viewRef.current.animate({ 0: { scale: 1.5 }, 1: { scale: 1} });
    }
  }, [focused])

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={1}
      style={[styles.container, { top: 0 } ]}>
        <Animatable.View
        ref={viewRef}
        duration={300}
      >
        {/* {item.route === 'FilesScreen'} */}
        <Icon type={item.type} name={focused ? item.activeIcon : item.inActiveIcon} color={focused ? '#F46600' : 'grey'} />
      </Animatable.View>
    </TouchableOpacity>
  )
}

const TabsWithProvider = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.warn("No access token found");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/profile/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(response.data);
        console.log("Fetched profile data:", response.data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <SharedFilesProvider> {/* Context provider */}
      {/* <View style={{ flex: 1, backgroundColor: 'transparent' }}> */}
        {/* <ProfileScreen profile={profile} /> */}
      {/* </View> */}
      <ProfileProvider profile={profile} >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: '#F46600',   // Active icon color
            tabBarInactiveTintColor: 'gray',    // Inactive icon color
            tabBarStyle: {
              alignContent: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',       // Tab bar background color
              position: 'absolute',              // Padding for the tab bar
              height: 60,                       // Height of the tab bar
              bottom: 16,
              left: 16,
              right: 16,
              borderRadius: 16,
              marginLeft: 10,
              marginRight: 10,
            },
            tabBarLabelStyle: {
              // fontSize: 12,                     // Font size of tab label
              // fontWeight: '500',               // Font weight of tab label
            },
          })}
        >
          {TabArr.map((item, index) => {
            return (
              <Tab.Screen key={index} name={item.route} component={item.component}
                options={{
                  tabBarShowLabel: false,
                  tabBarIcon: ({color, focused}) => (
                    <Icon type={item.type} name={focused ? item.activeIcon : item.inActiveIcon} color={color}  />
                  ),
                  tabBarButton: (props) => <TabButton {...props} item={item}/>
                }}
                initialParams={{profile: profile}}
              />
            )
          })}
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
  }
})

export default TabsWithProvider;
