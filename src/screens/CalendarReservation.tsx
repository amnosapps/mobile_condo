import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { parse, format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO, formatDate } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import { useProfile } from '../ProfileContext';
import axios from 'axios';
import Profile from '../components/Profile';
import CalendarWithCustomLocalization from '../components/CalendarWithCustomWeekdays';

const CalendarReservationManager = ({ route }) => {
  const navigation = useNavigation();
  const profile = useProfile();
  const [selectedDate, setSelectedDate] = useState('');
  const [reservations, setReservations] = useState([]);
  const [reservationsData, setReservationsData] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchReservations = async () => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      const response = await axios.get(`${API_URL}/api/reservations/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { condominium: profile.condominiums[0] },
      });

      const formattedData = response.data.reduce((acc, reservation) => {
        const checkin = format(parseISO(reservation.checkin), 'yyyy-MM-dd', { locale: ptBR });
        const checkout = format(parseISO(reservation.checkout), 'yyyy-MM-dd', { locale: ptBR });
        if (!acc[checkin]) acc[checkin] = [];
        acc[checkin].push({
          id: reservation.id,
          name: reservation.guest_name,
          room: reservation.apt_number,
          checkin: reservation.checkin,
          checkout: reservation.checkout,
        });
        return acc;
      }, {});
      setReservationsData(formattedData);
      setReservations(getWeeklyReservations(formattedData));
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReservations();
    setRefreshing(false);
  };

  const generateMarkedDates = (reservationsData, selectedDate) => {
    const markedDates = {};
    Object.values(reservationsData).forEach((reservations) => {
      reservations.forEach((reservation) => {
        try {
          const checkinDate = parseISO(reservation.checkin);
          const checkoutDate = parseISO(reservation.checkout);
          const datesInRange = eachDayOfInterval({ start: checkinDate, end: checkoutDate });

          datesInRange.forEach((date) => {
            const formattedDate = format(date, 'yyyy-MM-dd');
            markedDates[formattedDate] = {
              marked: true,
              dotColor: '#F46600',
              color: '#FFF7F4',
            };
          });
        } catch (error) {
          console.error('Error parsing reservation dates:', reservation, error);
        }
      });
    });

    if (selectedDate) {
      markedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: true,
        selectedColor: '#F46600',
      };
    }
    return markedDates;
  };

  const getWeeklyReservations = (data) => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = endOfWeek(today, { weekStartsOn: 0 });
    const datesInWeek = eachDayOfInterval({ start, end }).map((date) =>
      format(date, 'yyyy-MM-dd')
    );
    return datesInWeek.flatMap((date) =>
      (data[date] || []).map((reservation) => ({
        ...reservation,
        date,
      }))
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return null
    return format(dateString, "dd/MM");
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setReservations((reservationsData[selectedDate] || []).map((reservation) => ({
        ...reservation,
        date: selectedDate,
      })));
    } else {
      setReservations(getWeeklyReservations(reservationsData));
    }
  }, [selectedDate, reservationsData]);

  const getReservationColor = (checkin, checkout) => {
    const today = new Date();
    const checkinDate = new Date(checkin);
    const checkoutDate = new Date(checkout);
  
    if (checkoutDate < today) return '#B0B0B0'; // Past reservation (Gray)
    if (checkinDate <= today && checkoutDate >= today) return '#27AE60'; // Current reservation (Green)
    return '#FFA726'; // Future reservation (Orange)
  };

  const renderReservation = ({ item }) => (
    <TouchableOpacity
      style={[styles.reservationItem, { backgroundColor: getReservationColor(item.checkin, item.checkout) }]}
      onPress={() => navigation.navigate('ReservationDetails', { reservation: item })}
    >
      <View style={{ width: '30%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '500' }}>Apto</Text>
        <Text style={{ color: '#fff', fontWeight: '500' }}>{item.room}</Text>
      </View>
      <View style={styles.reservationInfo}>
        <Text style={styles.reservationName}>{item.name}</Text>
        <View style={styles.dividerLine} />
        <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', textAlign: 'left', fontSize: 12 }}>Checkin: {formatDate(item.checkin)}</Text>
          <Text style={{ color: '#fff', textAlign: 'right', fontSize: 12 }}>Checkout: {formatDate(item.checkout)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Profile profile={profile} />
      <CalendarWithCustomLocalization
        reservations={generateMarkedDates(reservationsData, selectedDate)}
        onDayPress={(day) => {
          setSelectedDate(day.dateString === selectedDate ? '' : day.dateString);
        }}
      />
      <View style={styles.reservationHeader}>
        <Text style={styles.dateText}>
          {selectedDate
            ? `Checkins em ${format(parseISO(selectedDate), "EEE, dd/MM", { locale: ptBR })}`
            : 'Reservas da Semana'}
        </Text>
      </View>
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderReservation}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.noReservationText}>Sem checkin's para essa data</Text>
        }
      />
    </View>
  );
};

export default CalendarReservationManager;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingBottom: 80, backgroundColor: '#F9FAFB' },
  reservationHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  dateText: { fontSize: 14, fontWeight: '500', marginVertical: 10, width: '80%' },
  reservationItem: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#F46600',
    alignItems: 'center',
    marginBottom: 10,
  
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  
    // Elevation for Android
    elevation: 5,
  },
  reservationInfo: { flex: 1, paddingHorizontal: 10 },
  reservationName: { fontSize: 13, fontWeight: 'bold', color: '#fff' },
  dividerLine: { height: 1, backgroundColor: '#fff', marginVertical: 8 },
  noReservationText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
});
