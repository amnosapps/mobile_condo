// CalendarReservationManager.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '@env';
import axios from 'axios';

const CalendarReservationManager = () => {
  const navigation = useNavigation();
  const [selectedDate, setSelectedDate] = useState('');
  const [reservations, setReservations] = useState([]);
  const [showWeekly, setShowWeekly] = useState(true);
  const [reservationsData, setReservationsData] = useState({});
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchReservations = async () => {
    const token = await AsyncStorage.getItem("accessToken");
    try {
      const response = await axios.get(`${API_URL}/api/reservations/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const formattedData = response.data.reduce((acc, reservation) => {
        const date = format(parseISO(reservation.checkin), 'yyyy-MM-dd', { locale: ptBR });
        if (!acc[date]) acc[date] = [];
        acc[date].push({
          id: reservation.id,
          name: reservation.guest_name,
          room: reservation.apt_number,
          checkIn: format(parseISO(reservation.checkin), 'PPPp', { locale: ptBR }),
          checkOut: format(parseISO(reservation.checkout), 'PPPp', { locale: ptBR }),
        });
        return acc;
      }, {});
      setReservationsData(formattedData);
      setReservations(getWeeklyReservations(formattedData));
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  };

  const generateMarkedDates = () => {
    const markedDates = {};
    Object.keys(reservationsData).forEach((date) => {
      markedDates[date] = { marked: true, dotColor: 'green' };
    });
    if (selectedDate) {
      markedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: true,
        selectedColor: '#00adf5',
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

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      setReservations((reservationsData[selectedDate] || []).map((reservation) => ({
        ...reservation,
        date: selectedDate,
      })));
      setShowWeekly(false);
    } else {
      setReservations(getWeeklyReservations(reservationsData));
      setShowWeekly(true);
    }
  }, [selectedDate, reservationsData]);

  const renderReservation = ({ item }) => (
    <TouchableOpacity 
      style={styles.reservationItem}
      onPress={() => navigation.navigate('ReservationDetails', { reservation: item })} // Navigate to details screen
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text>Apto: {item.room}</Text>
      <Text>Check-in: {item.checkIn}</Text>
      <Text>Check-out: {item.checkOut}</Text>
      {showWeekly && <Text>Data: {item.date}</Text>}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString === selectedDate ? '' : day.dateString);
        }}
        markedDates={generateMarkedDates()}
        monthFormat={'MMMM yyyy'}
        theme={{
          todayTextColor: '#00adf5',
          monthTextColor: '#333',
          arrowColor: '#00adf5',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
        }}
      />
      <Button title="Atualizar" onPress={fetchReservations} />
      <Text style={styles.dateText}>
        {selectedDate ? `Reservas em ${selectedDate}` : 'Reservas da Semana'}
      </Text>
      {reservations.length > 0 ? (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={renderReservation}
        />
      ) : (
        <Text style={styles.noReservationText}>Sem reservas para esta data</Text>
      )}
    </View>
  );
};

export default CalendarReservationManager;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  dateText: { fontSize: 18, fontWeight: 'bold', marginVertical: 10 },
  reservationItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  name: { fontSize: 16, fontWeight: 'bold' },
  noReservationText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#888' },
});
