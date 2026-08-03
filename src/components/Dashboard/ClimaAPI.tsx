"use client";

import { Box, Typography, CircularProgress } from "@mui/material";
import { useState, useEffect } from "react";
import { obtenerClima } from "../../services/weatherService";

type ClimaVisual = { archivoSvg: string; etiqueta: string };

const getAmChartsIcon = (codigo: number, esDeDia: number): ClimaVisual => {
  const esDia = Boolean(esDeDia);

  if (codigo === 1000) {
    return esDia ? { archivoSvg: "clear-day.svg", etiqueta: "Soleado" } : { archivoSvg: "clear-night.svg", etiqueta: "Despejado" };
  }

  if (codigo === 1003) {
    return esDia
      ? { archivoSvg: "cloudy-1-day.svg", etiqueta: "Parcialmente nublado" }
      : { archivoSvg: "cloudy-1-night.svg", etiqueta: "Parcialmente nublado" };
  }

  if ([1006, 1009].includes(codigo)) {
    return { archivoSvg: "cloudy.svg", etiqueta: "Nublado" };
  }

  if ([1030, 1135, 1148].includes(codigo)) {
    return esDia
    ? { archivoSvg: "fog-day.svg", etiqueta: "Niebla" }
    : { archivoSvg: "fog-night.svg", etiqueta: "Niebla"}
  }

  if ([1087, 1273, 1276, 1279, 1282].includes(codigo)) {
    return { archivoSvg: "thunderstorms.svg", etiqueta: "Tormenta" };
  }

  if ([1150, 1153, 1168, 1171, 1180, 1183, 1198].includes(codigo)) {
    return { archivoSvg: "rainy-1.svg", etiqueta: "Lluvia ligera" };
  }

  if (codigo >= 1186 && codigo <= 1207) {
    return { archivoSvg: "rainy-3.svg", etiqueta: "Lluvioso" };
  }

  if ([1237, 1249, 1252, 1261, 1264].includes(codigo)) {
    return { archivoSvg: "rainy-7.svg", etiqueta: "Granizo" }; 
  }

  if ((codigo >= 1210 && codigo <= 1225) || (codigo >= 1255 && codigo <= 1258)) {
    return { archivoSvg: "snowy-3.svg", etiqueta: "Nieve" };
  }

  return { archivoSvg: "wind.svg", etiqueta: "Viento" };
};

const esRespuestaValida = (datos: any): boolean => {
  const ciudadValida =
    typeof datos?.location?.name === "string" && datos.location.name.trim().length > 0;

  const paisValido =
    typeof datos?.location?.country === "string" && datos.location.country.trim().length > 0;

  const temperaturaValida = typeof datos?.current?.temp_c === "number";

  const condicionValida = typeof datos?.current?.condition?.code === "number";

  if (!ciudadValida) console.warn("Clima: la API no devolvió un nombre de ciudad válido.");
  if (!paisValido) console.warn("Clima: la API no devolvió un país válido.");
  if (!temperaturaValida) console.warn("Clima: la API no devolvió una temperatura válida.");
  if (!condicionValida) console.warn("Clima: la API no devolvió un código de condición válido.");

  return ciudadValida && paisValido && temperaturaValida && condicionValida;
};

// Componente principal
export default function ClimaAPI() {
  const [clima, setClima] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const consultarDatos = async () => {
      try {
        const ciudadAsignada = "Chihuahua, Chihuahua";
        const datos = await obtenerClima(ciudadAsignada);

        if (!esRespuestaValida(datos)) {
          setError(true);
          return;
        }

        setClima({
          ciudad: datos.location.name,
          pais: datos.location.country,
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

  const pillWrapperSx = {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: "999px",
    overflow: "hidden",
    background: "#ccddd3",
    height: 42,
  };

  if (cargando) {
    return (
      <Box sx={pillWrapperSx}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", px: 2.5, height: "100%" }}>
          <CircularProgress size={16} sx={{ color: "#94a3b8" }} />
        </Box>
      </Box>
    );
  }

  if (error || !clima) {
    return (
      <Box sx={pillWrapperSx}>
        <Typography sx={{ fontWeight: 500, color: "#86868b", fontSize: "0.78rem", px: 2.5 }}>
          Información no disponible
        </Typography>
      </Box>
    );
  }

  const { archivoSvg, etiqueta } = getAmChartsIcon(clima.codigoCondicion, clima.esDeDia);

  return (
    <Box
      sx={{
        ...pillWrapperSx,
        animation: "climaFadeIn 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
        "@keyframes climaFadeIn": {
          from: { opacity: 0, transform: "translateY(6px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {/* contenedor claro con icono y textos apilados */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          background: "#eef1f4",   
          borderRadius: "999px",
          px: 1.5,
          height: "100%",
          margin: "-1px",
          boxShadow: "0 1px 3px rgba(74,153,224,0.35)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            flexShrink: 0,
          }}
        >
          <img
            src={`/iconsWheater/${archivoSvg}`}
            alt={etiqueta}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </Box>
        
        {/* Agrupación vertical para temperatura y texto */}
        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-start" }}>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              color: "#3a3a3c",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {`${clima.temperatura} °C`}
          </Typography>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: "0.7rem",
              color: "#6e6e73",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            {etiqueta}
          </Typography>
        </Box>
      </Box>

      {/* solo ciudad */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          pl: 0.5,
          pr: 1.5,
          height: "100%",
        }}
      >
        <Typography
          sx={{
            fontWeight: 900,
            fontSize: "0.78rem",
            color: "#47584e",
            whiteSpace: "nowrap",
          }}
        >
          {clima.ciudad}
        </Typography>
      </Box>
    </Box>
  );
}