import React from 'react';
import Box from '@mui/material/Box';
import AuthProvider from "./AuthProvider";
import NavBar from '@/src/components/general/functional/NavBar';

export const metadata = {
  title: "Sistema de Inventarios IMPLAN",
};

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>

          <NavBar/> 
          
          {/* contenedor paginas */}
          <Box
          >
            {children}
          </Box>

    </AuthProvider>
  );
}