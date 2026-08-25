import type { Metadata, Viewport } from "next";
import QrScanner from "./QrScanner";

export const metadata: Metadata = {
  title: "Escanear artículo | Sistema de Inventarios",
  description: "Consulta pública de artículos mediante su etiqueta QR.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#315f5d",
};

export default function QrPage() {
  return <QrScanner />;
}
