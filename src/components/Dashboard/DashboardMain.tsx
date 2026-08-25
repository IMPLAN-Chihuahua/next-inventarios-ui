"use client";

import React, { useState } from "react";
import { Box, ButtonBase, Menu, MenuItem, Typography } from "@mui/material";
import { ArrowRight, FileSpreadsheet, ShieldCheck, type LucideIcon } from "lucide-react";
import BotonesGridAmarillo from "./BotonesGrid";
import TablaUltimosMov from "./TablaUltimosMov";
import DistribucionEstado from "./DistribucionEstado";
import ImportarExcel from "./ImportarExcel";
import CapturaRapida from "./CapturaRapida";
import ResguardoExterno from "./ResguardoExterno";
import ResguardoInterno from "./ResguardoInterno";

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

          <Box sx={{ gridColumn: "3", gridRow: "1 / 3", position: "relative", display: "flex", flexDirection: "column", overflow: "hidden", textAlign: "left", borderRadius: "18px", bgcolor: "#fefefe", border: "1px solid rgba(0,0,0,.1)", boxShadow: "0 4px 24px rgba(0,0,0,.025)", transition: "all .3s cubic-bezier(.25,.8,.25,1)", "&:hover": { transform: "translateY(-6px)", background: "radial-gradient(120% 120% at 100% 100%, rgba(70,122,119,.10) 0%, rgba(255,255,255,0) 65%), #fefefe", "& .resguardo-options": { opacity: .9, transform: "translateY(0)", pointerEvents: "auto" }, "& .resguardo-watermark": { opacity: .8 } } }}>
            <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, bgcolor: "#467A77", zIndex: 1 }} />
            <Box className="resguardo-watermark" sx={{ position: "absolute", right: 12, bottom: 12, color: "#467A77", opacity: .3, pointerEvents: "none", zIndex: 0, transition: "opacity .4s ease", display: "flex", alignItems: "center", justifyContent: "center" }}><ShieldCheck size={78} strokeWidth={1.25} /></Box>
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", p: 2, position: "relative", zIndex: 1 }}>
              <Box><Typography sx={{ color: "#060606", fontWeight: 600, fontSize: ".7rem", letterSpacing: ".05em", mb: .5 }}>CREAR</Typography><Typography sx={{ color: "#467A77", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-.015em", lineHeight: 1.1 }}>Resguardo</Typography></Box>
              <Box className="resguardo-options" sx={{ display: "flex", alignItems: "center", gap: 2, position: "absolute", bottom: 16, left: 16, opacity: 0, transform: "translateY(10px)", pointerEvents: "none", transition: "all .4s cubic-bezier(.25,.8,.25,1)" }}>
                <ButtonBase onClick={() => setOpenDrawer("resguardo-interno")} sx={{ display: "flex", alignItems: "center", gap: .5, color: "#467A77", borderRadius: "4px" }}><Typography sx={{ fontWeight: 700, fontSize: ".7rem" }}>Resguardo interno</Typography><ArrowRight size={14} strokeWidth={2.5} /></ButtonBase>
                <ButtonBase onClick={() => setOpenDrawer("resguardo-externo")} sx={{ display: "flex", alignItems: "center", gap: .5, color: "#467A77", borderRadius: "4px" }}><Typography sx={{ fontWeight: 700, fontSize: ".7rem" }}>Resguardo externo</Typography><ArrowRight size={14} strokeWidth={2.5} /></ButtonBase>
              </Box>
            </Box>
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

          <CardShell title="Articulos distribuidos por categoria" accentColor="#5081A5">
            <DistribucionEstado key={`estados-${dashboardRefreshKey}`} />
          </CardShell>

          <CardShell title="Agregar Multiples Articulos" icon={FileSpreadsheet} accentColor="#467A77">
            <CapturaRapida onSaved={() => setDashboardRefreshKey((current) => current + 1)} />
          </CardShell>
        </Box>

        {/* ================= FILA 3: últimos artículos a todo lo ancho ================= */}
        <Box sx={{ height: 320 }}>
          <TablaUltimosMov key={"ultimos-" + dashboardRefreshKey} />
        </Box></Box>


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
      <ResguardoInterno controlledOpen={openDrawer === "resguardo-interno"} onControlledClose={handleClose} hideLauncher onSaved={() => setDashboardRefreshKey((current) => current + 1)} />
      <ResguardoExterno controlledOpen={openDrawer === "resguardo-externo"} onControlledClose={handleClose} hideLauncher />      <AgregarArticuloDrawer
        open={openDrawer === "agregar-articulo"}
        onClose={handleClose}
      />
    </Box>
  );
};

export default Dashboard;










