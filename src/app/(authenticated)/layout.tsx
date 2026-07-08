import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import AuthProvider from "./AuthProvider";
import NavBar from '@/src/components/general/functional/NavBar';
import ThemeRegistry from '@/src/components/ThemeRegistry';

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
                bgcolor: '#f5f5f7',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <NavBar />

              <Box
                component="main"
                sx={{
                  flexGrow: 1,
                  pt: { xs: '90px', md: '130px' },
                  px: { xs: 2, md: 4, lg: 6 },
                  maxWidth: 1440,
                  mx: 'auto',
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