import React from 'react';
import AuthGuard from '../components/AuthGuard';

export default function Root({children}){
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
