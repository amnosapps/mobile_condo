// FileLoaderButton.js
import React from 'react';
import { StyleSheet, Alert, TouchableOpacity, Text } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

const styles = StyleSheet.create({
  reservationButton: {
    alignSelf: 'center',
    borderRadius: 20,
    backgroundColor: '#DE7066',
    paddingVertical: 10,
    paddingHorizontal: 100,
  },
  textReservationButton: {
    textAlign: 'center',
    color: '#fff',
  },
});

const FileLoaderButton = ({ onFileSelected }) => {
  const PdfButton = ({ title, onPress }) => {
    return (
      <TouchableOpacity style={styles.reservationButton} onPress={onPress}>
        <Text style={styles.textReservationButton}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const openFilePicker = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
      });

      if (result && result.length > 0) {
        onFileSelected(result[0]); // Pass the selected file to FilesScreen
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        Alert.alert('File selection canceled');
      } else {
        console.error('File selection error:', err);
        Alert.alert('Error', 'Failed to select file');
      }
    }
  };

  return <PdfButton title="Selecionar PDF" onPress={openFilePicker} />;
};

export default FileLoaderButton;
