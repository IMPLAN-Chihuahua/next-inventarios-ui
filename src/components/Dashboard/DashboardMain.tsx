"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  FileSpreadsheet,
  type LucideIcon,
} from "lucide-react";
import BotonesGridAmarillo from "./BotonesGrid";
import TablaUltimosMov from "./TablaUltimosMov";
import DistribucionEstado from "./DistribucionEstado";
import ImportarExcel from "./ImportarExcel";

import ResguardoVehicularDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/ResguardoVehicularDrawer";
import ImprimirEtiquetasDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/ImprimirEtiquetasDrawer";
import DescargarResguardosDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/DescargarResguardosDrawer";
import AgregarArticuloDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/AgregarArticuloDrawer";




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
// Dashboard
// ============================================================
const Dashboard = () => {
  // 👇 controla cuál drawer está abierto (null = ninguno)
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);

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
            <TablaUltimosMov key={`ultimos-${dashboardRefreshKey}`} />
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
          <CardShell title="Importar Excel" icon={FileSpreadsheet} accentColor="#94B8BA">
            <ImportarExcel onImported={() => setDashboardRefreshKey((current) => current + 1)} />
          </CardShell>

          <CardShell title="Distribución por estado" accentColor="#5081A5">
            <DistribucionEstado key={`estados-${dashboardRefreshKey}`} />
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
      <AgregarArticuloDrawer
        open={openDrawer === "agregar-articulo"}
        onClose={handleClose}
      />
    </Box>
  );
};

export default Dashboard;
