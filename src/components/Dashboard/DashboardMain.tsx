"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ClimaAPI from "./ClimaAPI";
import BotonesGridAmarillo from "./BotonesGrid";
import TablaUltimosMov from "./TablaUltimosMov";

import ResguardoVehicularDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/ResguardoVehicularDrawer";
import ImprimirEtiquetasDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/ImprimirEtiquetasDrawer";
import DescargarResguardosDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/DescargarResguardosDrawer";
// import AgregarArticuloDrawer from "@/app/(authenticated)/articulos/components/AgregarArticuloDrawer";




// ============================================================
// CardShell — shell reutilizable con ícono + color de acento
// ============================================================
interface CardShellProps {
  title: string;
  icon?: LucideIcon;
  accentColor?: string;
  children?: React.ReactNode;
  sx?: object;
}

const CardShell = ({
  title,
  icon: Icon,
  accentColor = "#5081A5",
  children,
  sx = {},
}: CardShellProps) => {
  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #eef0f2",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 10px 28px rgba(0,0,0,0.07)",
        },
        ...sx,
      }}
    >
      {/* Barra de acento izquierda */}
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "4px",
          bgcolor: accentColor,
        }}
      />

      {/* Header de la card */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, px: 2.5, pt: 2.2, pb: 1 }}>
        {Icon && (
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "9px",
              bgcolor: `${accentColor}1f`, 
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Icon size={17} color={accentColor} />
          </Box>
        )}
        <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: "#1d1d1f" }}>
          {title}
        </Typography>
      </Box>

      {/* Contenido */}
      <Box sx={{ flex: 1, px: 2.5, pb: 2.5, display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
};

// ============================================================
// KpiContent — número grande + tendencia (para las 4 KPI cards)
// ============================================================
interface KpiContentProps {
  value: string;
  trend: string;
  trendUp: boolean;
  caption: string;
}

const KpiContent = ({ value, trend, trendUp, caption }: KpiContentProps) => (
  <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
    <Typography sx={{ fontSize: "2rem", fontWeight: 700, color: "#1d1d1f", lineHeight: 1.1 }}>
      {value}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.7, mt: 0.8 }}>
      <Typography
        sx={{
          fontSize: "0.8rem",
          fontWeight: 700,
          color: trendUp ? "#16a34a" : "#dc2626",
        }}
      >
        {trendUp ? "▲" : "▼"} {trend}
      </Typography>
      <Typography sx={{ fontSize: "0.8rem", color: "#9ca3af" }}>{caption}</Typography>
    </Box>
  </Box>
);

// ============================================================
// Datos de ejemplo para gráficas
// ============================================================
const dataCategorias = [
  { name: "Mobiliario", value: 45 },
  { name: "Electrónicos", value: 30 },
  { name: "Oficina", value: 15 },
  { name: "Otros", value: 10 },
];

const COLORES_DONUT = ["#5081A5", "#467A77", "#94B8BA", "#A2B5C6"];

const dataUbicacion = [
  { ubicacion: "Matriz", total: 320 },
  { ubicacion: "Sucursal Norte", total: 210 },
  { ubicacion: "Sucursal Sur", total: 150 },
  { ubicacion: "Almacén", total: 90 },
];

// ============================================================
// Dashboard
// ============================================================
const Dashboard = () => {
  // 👇 controla cuál drawer está abierto (null = ninguno)
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);

  const handleClose = () => setOpenDrawer(null);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #FBF9F6 0%, #FBF9F6 100%)",      
        m: 0, 
        p: 0, 
      }}
    >
      {/* Contenedor del contenido principal con padding independiente */}
      <Box 
        component="main" 
        sx={{ 
          px: { xs: 3, sm: 5 }, 
          py: 4, 
          pb: 8 
        }}
      >
        
        {/* ================= FILA 1: KPIs + gráfica grande ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 2fr",
            gridTemplateRows: "1fr 1fr",
            gap: 2.5,
            height: 300,
            mb: 2.5,
          }}
        >
          {/* Componente importado que sustituye a los 4 CardShells previos */}
          <Box sx={{ gridColumn: "1 / 3", gridRow: "1 / 3", width: "100%", height: "100%" }}>
            <BotonesGridAmarillo onAction={setOpenDrawer} />
          </Box>

          <Box sx={{ gridColumn: "3", gridRow: "1 / 3", minWidth: 0 }}>
            <TablaUltimosMov />
          </Box>
        </Box>

        {/* ================= FILA 2: 3 cards de análisis ================= */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 2.5,
            height: 340,
            mb: 2.5,
          }}
        >
          <CardShell title="exportar excel" accentColor="#94B8BA">
            {/* Placeholder */}
          </CardShell>

          <CardShell title="Grafica" accentColor="#5081A5">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dataCategorias}
                    dataKey="value"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {dataCategorias.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORES_DONUT[index % COLORES_DONUT.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </CardShell>

          <CardShell title="Categorias" accentColor="#467A77">
            <Box
              sx={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#c7c9cc",
                fontSize: "0.85rem",
              }}
            >
              {/* Placeholder */}
            </Box>
          </CardShell>
        </Box>

        {/* ================= FILA 3 ================= */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr", gap: 2.5 }}>
          <CardShell title="Top articulos (quiza)" accentColor="#5081A5" sx={{ minHeight: 320 }}>
            {/* ranking/lista */}
          </CardShell>
        </Box>
        
      </Box>

      {/* ================= DRAWERS ================= */}
      <ResguardoVehicularDrawer
        open={openDrawer === "resguardo-vehicular"}
        onClose={handleClose}
      />
      <ImprimirEtiquetasDrawer
        open={openDrawer === "imprimir-etiquetas"}
        onClose={handleClose}
      />
      <DescargarResguardosDrawer
        open={openDrawer === "descargar-resguardos"}
        onClose={handleClose}
      />
      {/* <AgregarArticuloDrawer
        open={openDrawer === "agregar-articulo"}
        onClose={handleClose}
      /> */}
    </Box>
  );
};

export default Dashboard;