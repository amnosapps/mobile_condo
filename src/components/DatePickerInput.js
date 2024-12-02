// DatePickerInput.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

const DatePickerInput = ({ label, dateValue, onDateChange, hourValue, onHourChange }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <View>
      <Text>{label}:</Text>
      <View style={styles.dateTimeRow}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)}>
          <TextInput style={styles.input} value={dateValue} placeholder="YYYY-MM-DD" editable={false} />
        </TouchableOpacity>
        <Picker enabled={false} selectedValue={hourValue} style={styles.hourPicker} onValueChange={onHourChange}>
          {hours.map((hour) => (
            <Picker.Item key={hour} label={hour} value={hour} />
          ))}
        </Picker>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={new Date(dateValue || Date.now())}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) onDateChange(date.toISOString().split('T')[0]);
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dateTimeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, justifyContent: 'space-between' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 4, flex: 1 },
  hourPicker: { height: 50, width: 120, marginLeft: 8 },
});

export default DatePickerInput;
