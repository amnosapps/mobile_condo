// DatePickerInput.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DatePickerInput = ({ label, dateValue, onDateChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Format date to DD/MM/YYYY
  const formatDate = (date) => {
    if (!date) return '';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <View style={{ width: '90%', justifyContent: 'center' }}>
      <Text>{label}:</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          style={styles.input}
          value={formatDate(dateValue)} // Display the formatted date
          placeholder="DD/MM/YYYY"
          editable={false}
        />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={new Date(dateValue || Date.now())}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              // Convert date to YYYY-MM-DD and pass it to the parent
              const formattedDate = date.toISOString().split('T')[0];
              onDateChange(formattedDate);
            }
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 4,
    marginBottom: 16,
  },
});

export default DatePickerInput;
