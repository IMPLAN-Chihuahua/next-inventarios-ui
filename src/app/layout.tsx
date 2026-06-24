import "./globals.css";
import { Providers } from "../components/AppLocalizationProvider";
import AuthProvider from "./(authenticated)/AuthProvider";

export const metadata = {
  title: "Sistema de Inventarios IMPLAN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          <AuthProvider>
          {children}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}