import React, { createContext, useContext } from 'react';

const ProfileContext = createContext();

export const ProfileProvider = ({ profile, children }) => {
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);