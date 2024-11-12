import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

const ReservationManager = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [reservations, setReservations] = useState([]);

  // Sample data for reservations (replace with actual data or API fetch)
  const reservationsData = {
    '2023-11-10': [
      { id: '1', name: 'John Doe', room: '101', checkIn: '3:00 PM', checkOut: '11:00 AM' },
      { id: '2', name: 'Jane Smith', room: '102', checkIn: '4:00 PM', checkOut: '12:00 PM' }
    ],
    '2023-11-11': [
      { id: '3', name: 'Alice Johnson', room: '201', checkIn: '2:00 PM', checkOut: '10:00 AM' }
    ]
  };

  // Load reservations for selected date
  useEffect(() => {
    if (selectedDate) {
      setReservations(reservationsData[selectedDate] || []);
    }
  }, [selectedDate]);

  // Render each reservation item
  const renderReservation = ({ item }) => (
    <View style={styles.reservationItem}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>Room: {item.room}</Text>
      <Text>Check-in: {item.checkIn}</Text>
      <Text>Check-out: {item.checkOut}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={{
          [selectedDate]: { selected: true, marked: true, selectedColor: '#00adf5' }
        }}
      />
      <Text style={styles.dateText}>Reservations for {selectedDate || 'Select a date'}</Text>
      {reservations.length > 0 ? (
        <FlatList
          data={reservations}
          keyExtractor={(item) => item.id}
          renderItem={renderReservation}
        />
      ) : (
        <Text style={styles.noReservationText}>No reservations for this date</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  reservationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  noReservationText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888'
  }
});

export default ReservationManager;
