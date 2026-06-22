import { Providers } from '../components/AppLocalizationProvider';
import "./globals.css";

export const metadata = {
  title: "Sistema de Inventarios IMPLAN",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}