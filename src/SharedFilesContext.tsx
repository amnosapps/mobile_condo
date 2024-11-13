// SharedFilesContext.tsx
import React, { createContext, useContext } from 'react';
import { ShareFile, useGetShare } from './useGetShare';

type SharedFilesContextType = {
  sharedFiles: ShareFile[] | undefined;
  loadFiles: () => void;
};

const SharedFilesContext = createContext<SharedFilesContextType | undefined>(undefined);

export const SharedFilesProvider = ({ children, navigation }) => {
  const { share: sharedFiles, loadFiles } = useGetShare(navigation);

  return (
    <SharedFilesContext.Provider value={{ sharedFiles, loadFiles }}>
      {children}
    </SharedFilesContext.Provider>
  );
};

export const useSharedFiles = () => {
  const context = useContext(SharedFilesContext);
  if (!context) {
    throw new Error("useSharedFiles must be used within a SharedFilesProvider");
  }
  return context;
};
