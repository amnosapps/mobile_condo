// AuthenticatedTabs.tsx

import React from 'react';
import TabsWithProvider from './TabsWithProvider';

const AuthenticatedTabs = ({ navigation }) => {
  return <TabsWithProvider rootNavigation={navigation} />;
};

export default AuthenticatedTabs;
