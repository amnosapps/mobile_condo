// useGetShare.tsx
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';
import { useEffect, useState, useCallback } from 'react';
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
  const [share, setShare] = useState<ShareFile[] | undefined>(undefined);

  // Define loadFiles function
  const loadFiles = useCallback(() => {
    ReceiveSharingIntent.getReceivedFiles(
      async (files: ShareFile[]) => {
        const updatedFiles = await Promise.all(
          files.map(async (file) => {
            if (file.mimeType === 'application/pdf' && file.filePath) {
              const content = await readPDFContent(file.filePath);
              const extractedData = await extractDataFromLocalAPI(content);
              return { ...file, content, extractedData };
            }
            return file;
          })
        );
        setShare(updatedFiles);

        if (updatedFiles.length > 0 && navigation) {
          navigation.navigate('FilesScreen');
        }
      },
      (error: any) => {
        console.log("Error receiving files:", error);
      },
      'your.unique.protocol'
    );
  }, [navigation]);

  // Initialize loadFiles on mount
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

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

  return { share, loadFiles }; // Return both share and loadFiles
};
