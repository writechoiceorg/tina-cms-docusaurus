// src/theme/Root.js
import React from 'react';
import { AuthProvider } from '../context/AuthContext';

// Default implementation, that you can customize
// This is the component that will wrap your entire website
export default function Root({children}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
