'use client'

import React, { useState, useEffect } from "react";
import { Box, Typography, Avatar, Chip, CircularProgress } from "@mui/material";
import NorthEastIcon from "@mui/icons-material/NorthEast";

// ---- Tipos ----
type TipoMovimiento = "Entrada" | "Salida" | "Resguardo";

interface Movimiento {
  id: string;
  articulo: string;
  responsable: string;
  categoria: string;
  tipoMov: TipoMovimiento;
  fecha: string;
  iniciales: string;
  avatarColor: string;
  avatarTextColor: string;
}

//  Configuración visual por tipo de movimiento 
const tipoConfig: Record<
  TipoMovimiento,
  { bg: string; color: string; dot: string }
> = {
  Entrada: { bg: "#dcfce7", color: "#16a34a", dot: "#22c55e" },
  Resguardo: { bg: "#fef3c7", color: "#d97706", dot: "#f59e0b" },
  Salida: { bg: "#fee2e2", color: "#dc2626", dot: "#ef4444" },
};

//  Funciones Auxiliares 
const obtenerIniciales = (nombre: string): string => {
  if (!nombre) return "--";
  const palabras = nombre.trim().split(" ");
  if (palabras.length === 1) return palabras[0].substring(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
};

const formatearFecha = (fechaISO: string): string => {
  if (!fechaISO) return "Sin fecha";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const mapearEstadoATipo = (estadoBack: string): TipoMovimiento => {
  switch (estadoBack) {
    case "Asignado":
      return "Resguardo";
    case "Baja":
    case "Donado":
      return "Salida";
    case "Dictaminer":
    case "Dictaminado":
    default:
      return "Entrada";
  }
};

const TablaUltimosMov = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    const obtenerArticulos = async () => {
      try {
        // Se puede agregar un query param como ?limit=5 para obtener solo los últimos
       const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}`);
        
        if (!response.ok) {
          throw new Error("Error en la respuesta del servidor");
        }
        
        // El backend devuelve { pagination: {...}, data: [...] }
        const dataAPI = await response.json();
        const listaArticulos = dataAPI.data || [];
        
        // Transformar el arreglo del backend a la interfaz del frontend
        const datosMapeados: Movimiento[] = listaArticulos.map((item: any) => {
          const nombreResponsable = item.resguardante?.nombre || "Sin Asignar";
          
          return {
            id: item._id,
            articulo: item.descripcion || "Artículo sin descripción",
            responsable: nombreResponsable,
            categoria: item.categoria?.tipo || "Sin Categoria", 
            tipoMov: mapearEstadoATipo(item.estado),
            fecha: formatearFecha(item.fechaAlta),
            iniciales: obtenerIniciales(nombreResponsable),
            avatarColor: "#f3f4f6",     
            avatarTextColor: "#4b5563", 
          };
        });

        setMovimientos(datosMapeados);
      } catch (error) {
        console.error("Hubo un error al obtener los artículos:", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerArticulos();
  }, []);

  return (
    <Box
      sx={{
        backgroundColor: "#ffffff",
        borderRadius: 4,
        p: 4,
        width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Encabezado */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: "#111827" }}
          >
            Últimos Movimientos
          </Typography>
          <Typography sx={{ color: "#6b7280", fontSize: "0.9rem" }}>
            Actividad reciente del inventario
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            mt: 0.5,
            "&:hover .ver-historial-texto": {
              color: "#c06a2c",
            },
            "&:hover .ver-historial-flecha": {
              transform: "translate(2px, -2px)",
            },
          }}
        >
          <Typography
            className="ver-historial-texto"
            sx={{
              color: "#d9843f",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "color 0.2s ease",
            }}
          >
            Ver historial
          </Typography>
          <NorthEastIcon
            className="ver-historial-flecha"
            sx={{
              fontSize: 16,
              color: "#d9843f",
              transition: "transform 0.2s ease",
            }}
          />
        </Box>
      </Box>

      {/* Encabezado de columnas */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 160px 140px",
          alignItems: "center",
          columnGap: 3,
          pb: 1.5,
          pl: "60px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Typography
          sx={{
            color: "#9ca3af",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          ARTÍCULO
        </Typography>

        <Typography
          sx={{
            color: "#9ca3af",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
          }}
        >
          TIPO
        </Typography>

        <Typography
          sx={{
            color: "#9ca3af",
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textAlign: "right",
          }}
        >
          FECHA
        </Typography>
      </Box>

      {/* Control de estado de carga */}
      {cargando ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress sx={{ color: "#d9843f" }} />
        </Box>
      ) : movimientos.length === 0 ? (
        <Typography sx={{ textAlign: "center", py: 4, color: "#6b7280" }}>
          No hay artículos registrados.
        </Typography>
      ) : (
        /* Filas */
        movimientos.map((mov) => {
          const config = tipoConfig[mov.tipoMov] || tipoConfig.Entrada;
          return (
            <Box
              key={mov.id}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 160px 140px",
                alignItems: "center",
                columnGap: 3,
                py: 2.5,
                px: 1.5,
                mx: -1.5,
                borderRadius: 2,
                borderBottom: "1px solid #f3f4f6",
                transition: "background-color 0.2s ease, transform 0.2s ease",
                "&:last-of-type": { borderBottom: "none" },
                "&:hover": {
                  backgroundColor: config.bg,
                  transform: "translateX(2px)",
                },
              }}
            >
              {/* Avatar + articulo */}
              <Box sx={{ display: "flex", flexDirection: "row", gap: 2, alignItems: "center" }}>
                <Avatar
                  sx={{
                    bgcolor: mov.avatarColor,
                    color: mov.avatarTextColor,
                    fontWeight: 700,
                    width: 44,
                    height: 44,
                    fontSize: "0.9rem",
                    flexShrink: 0,
                  }}
                >
                  {mov.iniciales}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 600, color: "#111827" }}>
                    {mov.articulo}
                  </Typography>
                  <Typography sx={{ color: "#6b7280", fontSize: "0.875rem" }}>
                    {mov.responsable} · {mov.categoria}
                  </Typography>
                </Box>
              </Box>

              {/* Tipo */}
              <Box>
                <Chip
                  label={mov.tipoMov}
                  sx={{
                    backgroundColor: config.bg,
                    color: config.color,
                    fontWeight: 600,
                    "& .MuiChip-label": { px: 1 },
                  }}
                  icon={
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: config.dot,
                        ml: 1.5,
                      }}
                    />
                  }
                />
              </Box>

              {/* Fecha */}
              <Typography sx={{ color: "#6b7280", fontSize: "0.875rem", textAlign: "right" }}>
                {mov.fecha}
              </Typography>
            </Box>
          );
        })
      )}
    </Box>
  );
};

export default TablaUltimosMov;