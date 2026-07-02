import Box from '@mui/material/Box';
import AuthProvider from "./AuthProvider";
import NavBar from '@/src/components/general/functional/NavBar';
import ThemeRegistry from '@/src/components/ThemeRegistry';

export const metadata = {
  title: "Sistema de Inventarios IMPLAN",
};

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <NavBar/> 
            
            {/* contenedor paginas */}
            <div>
              {children}
            </div>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}