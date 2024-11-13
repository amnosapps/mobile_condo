// FileLoaderButton.js
import React from 'react';
import { Button, Alert } from 'react-native';
import DocumentPicker from 'react-native-document-picker';

const FileLoaderButton = ({ onFileSelected }) => {
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

  return <Button title="Load Files" onPress={openFilePicker} />;
};

export default FileLoaderButton;
