import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AuthProvider from "./AuthProvider";
import NavBar from '@/src/components/general/functional/NavBar';
import ThemeRegistry from '@/src/components/ThemeRegistry';
import { DashboardHeader } from '@/src/components/Dashboard/headerBlanco';

export const metadata = {
  title: "Sistema de Inventarios IMPLAN",
};

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>
        <ThemeRegistry>
          <CssBaseline /> 
          <AuthProvider>
            
            <Box
              sx={{
                bgcolor: '#fbf9f6',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <DashboardHeader/>
              <NavBar/>

              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  width: '100%',
                }}
              >
                {children}
              </Box>
            </Box>

          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  ); 
}