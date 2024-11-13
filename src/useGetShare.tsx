// useGetShare.tsx
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useEffect, useState, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { API_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ShareFile = {
  filePath?: string;
  text?: string;
  weblink?: string;
  mimeType?: string;
  contentUri?: string;
  fileName?: string;
  extension?: string;
  content?: string;
  extractedData?: any;
};

export const useGetShare = (navigation) => {
  console.log(navigation)
  const [share, setShare] = useState<ShareFile[] | undefined>(undefined);

  // Automatic file loading on app start when a file is shared
  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      async (files: ShareFile[]) => {
        const processedFiles = await processFiles(files);
        setShare(processedFiles);
      },
      (error: any) => {
        console.error("Error receiving files:", error);
      },
      'your.unique.protocol'
    );
    navigation.navigate('AuthenticatedTabs', { screen: 'FilesScreen'})
  }, []);

  // Function to manually trigger file loading
  const loadFiles = useCallback(async () => {
    // Trigger file selection, e.g., using a file picker library if needed
    const selectedFiles = await manuallySelectFiles();
    const processedFiles = await processFiles(selectedFiles);
    setShare(processedFiles);
  }, []);

  const processFiles = async (files: ShareFile[]) => {
    return Promise.all(
      files.map(async (file) => {
        if (file.mimeType === 'application/pdf' && file.filePath) {
          const content = await readPDFContent(file.filePath);
          const extractedData = await extractDataFromLocalAPI(content);
          return { ...file, content, extractedData };
        }
        return file;
      })
    );
  };

  const manuallySelectFiles = async (): Promise<ShareFile[]> => {
    // This is a placeholder; integrate a file picker library for file selection.
    // Replace this with actual logic to select a file and get its metadata.
    return [];
  };

  const readPDFContent = async (filePath: string): Promise<string> => {
    try {
      const pdfData = await RNFS.readFile(filePath, 'base64');
      return pdfData;
    } catch (error) {
      console.error('Failed to read PDF file', error);
      return '';
    }
  };

  const extractDataFromLocalAPI = async (pdfContent: string): Promise<any> => {
    const token = await AsyncStorage.getItem('accessToken');
    try {
      const response = await axios.post(
        `${API_URL}/api/reservations/extract-dates/`,
        { pdf_base64: pdfContent },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to process PDF content', error);
      return null;
    }
  };

  return { share, loadFiles };
};
