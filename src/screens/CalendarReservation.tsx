// CalendarReservationManager.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import { parse, format, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
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
      console.log(token)
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
      markedDates[date] = { marked: true, dotColor: '#DE7066' };
    });
    if (selectedDate) {
      markedDates[selectedDate] = {
        ...markedDates[selectedDate],
        selected: true,
        selectedColor: '#DE7066',
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

  const formatDate = (dateString) => {
    // Parse the date string with `parse`
    const parsedDate = parse(dateString, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", new Date(), { locale: ptBR });
    
    // Format to the desired output
    return format(parsedDate, "dd/MM HH:mm");
  };

  const renderReservation = ({ item }) => (
    <TouchableOpacity 
      style={styles.reservationItem}
      onPress={() => navigation.navigate('ReservationDetails', { reservation: item })} // Navigate to details screen
    >
      <View style={{ width: '20%', justifyContent: 'center', alignItems: 'center',}}>
        <Text style={{ color: '#DC574B', fontWeight: '500'}}>Apto</Text>
        <Text style={{ color: '#DC574B', fontWeight: '500'}}>{item.room}</Text>
      </View>
      <View style={styles.reservationnInfo}>
        <Text style={styles.reservationName}>Hóspede: {item.name}</Text>
        
        <View style={styles.dividerLine} />
        
        <View>
          <Text style={{ color: '#DC574B'}}>{formatDate(item.checkIn)} - {formatDate(item.checkOut)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const CustomButton = ({ title, onPress }) => {
    return (
      <TouchableOpacity style={styles.addReservationButton} onPress={onPress}>
        <Text style={styles.textReservationButton}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* <CustomButton title="Atualizar" onPress={fetchReservations} /> */}
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString === selectedDate ? '' : day.dateString);
        }}
        markedDates={generateMarkedDates()}
        monthFormat={'MMMM yyyy'}
        theme={{
          todayTextColor: '#DE7066',
          monthTextColor: '#DE7066',
          arrowColor: '#DE7066',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: 'bold',
        }}
      />
      
      <View style={styles.reservationHeader}>
        <Text style={styles.dateText}>
          {selectedDate ? `Reservas em ${selectedDate}` : 'Reservas da Semana'}
        </Text>
        <CustomButton
          title="+" 
          onPress={() => navigation.navigate('FilesScreen')} // Navigate to FilesScreen
        />
      </View>
      
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
  reservationHeader: { display: 'flex', flexDirection: 'row', alignContent: 'center', alignItems: 'center', marginTop: 10 },
  dateText: { fontSize: 18, fontWeight: '400', marginVertical: 10, width: '80%', },
  addReservationButton: { width: '20%', backgroundColor: '#DE7066', borderRadius: 30},
  textReservationButton: { textAlign: 'center', color: 'white', fontSize: 15 },
  reservationItem: {
    display: 'flex',
    flexDirection: 'row',
    padding: 5,
    width: '100%',           // Set a fixed width
    borderRadius: 10,    // Half of width/height to make it a circle
    backgroundColor: '#fff', // Optional background color for visibility
    justifyContent: 'center',   // Center content vertically
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DC574B',
    marginTop: 10
  },
  reservationnInfo: {
    width: '80%', 
    borderRadius: 5,
    // backgroundColor: '#FFD7C6', 
    justifyContent: 'center',   // Center content vertically
    height: 70,
    padding: 10,
  },
  reservationName: {
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#DC574B',
  },
  dividerLine: {
    height: 1,               // Thickness of the line
    backgroundColor: '#DC574B',  // Color of the line
    marginVertical: 8,        // Space above and below the line
    width: '100%',            // Makes the line full width
  },
  noReservationText: { 
    textAlign: 'center', 
    marginTop: 20, fontSize: 16, color: '#888' 
  },
});
