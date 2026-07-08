"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import {Sun,Moon,CloudSun,CloudMoon,Cloud,CloudFog,CloudLightning,CloudRain,CloudSunRain,CloudMoonRain,CloudSnow,CloudHail,Wind,MapPin,type LucideIcon} from "lucide-react";
import { useState, useEffect } from "react";
import { obtenerClima } from "../../services/weatherService";

//  Mapa coigo -> icono / etiqueta 
type ClimaVisual = { Icono: LucideIcon; etiqueta: string };

const getVisualClima = (codigo: number, esDeDia: number): ClimaVisual => {
  const esDia = Boolean(esDeDia);

  if (codigo === 1000) {
    return esDia ? { Icono: Sun, etiqueta: "Soleado" } : { Icono: Moon, etiqueta: "Soleado" };
  }

  if (codigo === 1003) {
    return esDia
      ? { Icono: CloudSun, etiqueta: "Parcialmente nublado" }
      : { Icono: CloudMoon, etiqueta: "Parcialmente nublado" };
  }

  if ([1006, 1009].includes(codigo)) {
    return { Icono: Cloud, etiqueta: "Nublado" };
  }

  if ([1030, 1135, 1148].includes(codigo)) {
    return { Icono: CloudFog, etiqueta: "Niebla" };
  }

  if ([1087, 1273, 1276, 1279, 1282].includes(codigo)) {
    return { Icono: CloudLightning, etiqueta: "Tormenta" };
  }

  if ([1150, 1153, 1168, 1171, 1180, 1183, 1198].includes(codigo)) {
    return esDia
      ? { Icono: CloudSunRain, etiqueta: "Lluvia ligera" }
      : { Icono: CloudMoonRain, etiqueta: "Lluvia ligera" };
  }

  if (codigo >= 1186 && codigo <= 1207) {
    return { Icono: CloudRain, etiqueta: "Lluvioso" };
  }

  if ([1237, 1249, 1252, 1261, 1264].includes(codigo)) {
    return { Icono: CloudHail, etiqueta: "Granizo" };
  }

  if ((codigo >= 1210 && codigo <= 1225) || (codigo >= 1255 && codigo <= 1258)) {
    return { Icono: CloudSnow, etiqueta: "Nieve" };
  }

  return { Icono: Wind, etiqueta: "Viento" };
};

//  Mapa etiqueta -> color de acento 
const getColorAcento = (etiqueta: string): { claro: string; icono: string } => {
  switch (etiqueta) {
    case "Soleado":
      return { claro: "rgba(255, 200, 60, 0.35)", icono: "#e3a74d" };
    case "Parcialmente nublado":
      return { claro: "rgba(255, 200, 90, 0.22)", icono: "#c99a4a" };
    case "Nublado":
    case "Niebla":
      return { claro: "rgba(148, 163, 184, 0.30)", icono: "#64748b" };
    case "Lluvioso":
    case "Lluvia ligera":
      return { claro: "rgba(96, 165, 250, 0.30)", icono: "#3b82f6" };
    case "Tormenta":
      return { claro: "rgba(129, 140, 248, 0.32)", icono: "#6366f1" };
    case "Nieve":
      return { claro: "rgba(125, 211, 252, 0.28)", icono: "#38bdf8" };
    case "Granizo":
      return { claro: "rgba(148, 197, 219, 0.30)", icono: "#5b93ab" };
    case "Viento":
      return { claro: "rgba(94, 234, 212, 0.28)", icono: "#14b8a6" };
    default:
      return { claro: "rgba(203, 213, 225, 0.30)", icono: "#94a3b8" };
  }
};

const RADIUS = 18; 

//  Componente principal 
export default function ClimaAPI() {
  const [clima, setClima] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const consultarDatos = async () => {
      try {
        const ciudadAsignada = "Chihuahua";
        const datos = await obtenerClima(ciudadAsignada);

        setClima({
          ciudad: datos.location.name,
          temperatura: Math.round(datos.current.temp_c),
          codigoCondicion: datos.current.condition.code,
          esDeDia: datos.current.is_day,
          fechaHora: datos.location.localtime,
        });
      } catch (err) {
        console.error("Error al obtener el clima:", err);
        setError(true);
      } finally {
        setCargando(false);
      }
    };

    consultarDatos();
  }, []);

  const baseSx = {
    width: "100%",
    maxWidth: 360,
    height: 100,
    borderRadius: `${RADIUS}px`,
    bgcolor: "#fefefe",
    border: "1px solid rgba(0, 0, 0, 0.1)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.02)",
    display: "flex",
    alignItems: "center",
    gap: 1.5,
    px: 2.5,
  };

  if (cargando) {
    return (
      <Box sx={{ ...baseSx, justifyContent: "center" }}>
        <CircularProgress size={22} sx={{ color: "#94a3b8" }} />
      </Box>
    );
  }

  if (error || !clima) {
    return (
      <Box sx={{ ...baseSx, justifyContent: "center" }}>
        <Typography sx={{ fontWeight: 500, color: "#86868b", fontSize: "0.85rem" }}>
          Información no disponible
        </Typography>
      </Box>
    );
  }

  const { Icono, etiqueta } = getVisualClima(clima.codigoCondicion, clima.esDeDia);
  const { claro, icono } = getColorAcento(etiqueta);

  const fecha = new Date(clima.fechaHora.replace(" ", "T"));

  const fechaCruda = fecha.toLocaleString("es-MX", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });

  const fechaFormateada = fechaCruda.charAt(0).toUpperCase() + fechaCruda.slice(1);

  return (
    <Box
      sx={{
        ...baseSx,
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(120% 120% at 0% 0%, ${claro} 0%, rgba(255,255,255,0) 65%), #fefefe`,
      }}
    >
      {/* Marca de agua de icono */}
      <Box
        sx={{
          position: "absolute",
          right: -5,
          bottom: -14,
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 0,
          color: "#1d1d1f",
        }}
      >
        <Icono color={icono} size={110} strokeWidth={1.5} />
      </Box>


      {/* Textos */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.4, position: "relative", zIndex: 1}}>
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "2rem", color: "#1d1d1f", lineHeight: 1 }}>
            {clima.temperatura}°
          </Typography>
          <Typography sx={{ fontWeight: 600, fontSize: "0.95rem", color: "#1d1d1f" }}>
            {etiqueta}
          </Typography>
        </Box>
        <Typography sx={{ fontSize: "0.78rem", color: "#86868b", fontWeight: 500 }}>
         <MapPin size={12}/> {clima.ciudad}
        </Typography>
        <Typography sx={{ fontSize: "0.68rem", color: "#a3a3a3" }}>
          {fechaFormateada}
        </Typography>
      </Box>
    </Box>
  );
}