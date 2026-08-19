"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { inventariosApi } from "@/src/services/axios";

interface EstadoApi {
  estado: string;
  total: number;
}

interface EstadisticasApi {
  total: number;
  data: EstadoApi[];
}

const coloresEstado: Record<string, string> = {
  Asignado: "#467A77",
  Activo: "#6F9B78",
  Baja: "#D27259",
  Donado: "#D6A74B",
  Dictaminar: "#7D8EB5",
  Dictaminado: "#8B6F9E",
  "Sin estado": "#A7AFB7",
};

const colorAlterno = ["#5081A5", "#94B8BA", "#B68963", "#7B9B72"];

export default function DistribucionEstado() {
  const [estados, setEstados] = useState<EstadoApi[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarEstadisticas = async () => {
      try {
        const { data } = await inventariosApi.get<EstadisticasApi>(
          "/articulos/estadisticas/estados",
        );

        if (activo) {
          setEstados(data.data || []);
          setTotal(data.total || 0);
        }
      } catch (error) {
        const tokenInvalido =
          axios.isAxiosError(error) &&
          error.response?.status === 403 &&
          error.response?.data?.message === "JWT es inválido o ha expirado";

        if (tokenInvalido) {
          await signOut({ callbackUrl: "/login" });
          return;
        }

        if (activo) setError(true);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarEstadisticas();

    return () => {
      activo = false;
    };
  }, []);

  const datos = useMemo(
    () =>
      estados.map((estado, indice) => ({
        ...estado,
        color: coloresEstado[estado.estado] || colorAlterno[indice % colorAlterno.length],
      })),
    [estados],
  );

  if (cargando) {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
        <CircularProgress size={28} sx={{ color: "#467A77" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        No fue posible cargar la distribución.
      </Alert>
    );
  }

  if (datos.length === 0) {
    return (
      <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
        <Typography sx={{ color: "#8a949d", fontSize: "0.82rem" }}>
          No hay artículos para mostrar.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "grid",
        gridTemplateColumns: "minmax(150px, 1fr) minmax(125px, 0.9fr)",
        gap: 1,
        alignItems: "center",
      }}
    >
      <Box sx={{ position: "relative", height: 210, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="total"
              nameKey="estado"
              innerRadius={58}
              outerRadius={84}
              paddingAngle={2}
              stroke="#fff"
              strokeWidth={2}
            >
              {datos.map((estado) => (
                <Cell key={estado.estado} fill={estado.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeContent: "center",
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <Typography sx={{ color: "#24313a", fontSize: "1.45rem", fontWeight: 750, lineHeight: 1 }}>
            {total.toLocaleString("es-MX")}
          </Typography>
          <Typography sx={{ mt: 0.5, color: "#98a1a9", fontSize: "0.62rem" }}>
            ARTÍCULOS
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.15, minWidth: 0 }}>
        {datos.map((estado) => {
          const porcentaje = total > 0 ? Math.round((estado.total / total) * 100) : 0;

          return (
            <Box
              key={estado.estado}
              sx={{
                display: "grid",
                gridTemplateColumns: "9px minmax(0, 1fr) auto",
                gap: 0.8,
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  bgcolor: estado.color,
                }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: "#4b5660", fontSize: "0.7rem", fontWeight: 600 }}>
                  {estado.estado}
                </Typography>
                <Typography sx={{ color: "#9ca4ab", fontSize: "0.61rem" }}>
                  {estado.total.toLocaleString("es-MX")} artículos
                </Typography>
              </Box>
              <Typography sx={{ color: "#64717b", fontSize: "0.68rem", fontWeight: 700 }}>
                {porcentaje}%
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}