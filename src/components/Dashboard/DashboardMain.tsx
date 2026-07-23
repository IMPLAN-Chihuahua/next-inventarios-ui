"use client";

import React from "react";
import { Box, Typography, Button, IconButton, Avatar, Badge } from "@mui/material";
import {
  ChevronRight,
  Package,
  ShieldCheck,
  Users,
  CarFront,
  Bell,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ClimaAPI from "./ClimaAPI";
import BotonesGridAmarillo from "./BotonesGrid"; // Asegura que la ruta coincida con el nombre real de tu archivo

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
const dataMovimientos = [
  { mes: "Ene", entradas: 40, salidas: 24 },
  { mes: "Feb", entradas: 30, salidas: 18 },
  { mes: "Mar", entradas: 55, salidas: 32 },
  { mes: "Abr", entradas: 45, salidas: 28 },
  { mes: "May", entradas: 60, salidas: 35 },
  { mes: "Jun", entradas: 50, salidas: 30 },
  { mes: "Jul", entradas: 70, salidas: 40 },
];

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
            <BotonesGridAmarillo />
          </Box>

          <CardShell
            title="Movimiento de Inventario Mensual"
            accentColor="#5081A5"
            sx={{ gridColumn: "3", gridRow: "1 / 3" }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataMovimientos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEntradas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5081A5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#5081A5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSalidas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#467A77" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#467A77" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="entradas" stroke="#5081A5" fill="url(#colorEntradas)" strokeWidth={2} />
                <Area type="monotone" dataKey="salidas" stroke="#467A77" fill="url(#colorSalidas)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardShell>
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
          <CardShell title="Grafica" accentColor="#94B8BA">
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

        {/* ================= FILA 3: Tablas ================= */}
        <Box sx={{ display: "grid", gridTemplateColumns: "2.2fr 1fr", gap: 2.5 }}>
          <CardShell title="Últimos Movimientos" accentColor="#467A77" sx={{ minHeight: 320 }}>
            {/* TablaUltimosMov */}
          </CardShell>

          <CardShell title="Top articulos (quiza)" accentColor="#5081A5" sx={{ minHeight: 320 }}>
            {/* ranking/lista */}
          </CardShell>
        </Box>
        
      </Box> 
    </Box>
  );
};

export default Dashboard;