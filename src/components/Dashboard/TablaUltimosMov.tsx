"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { signOut } from "next-auth/react";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Package } from "lucide-react";
import { inventariosApi } from "@/src/services/axios";

interface ArticuloApi {
  _id: string;
  numeroInventario?: string;
  descripcion?: string;
  resguardante?: string | {
    _id?: string;
    nombre?: string;
  };
}

const obtenerResguardante = (resguardante: ArticuloApi["resguardante"]) => {
  if (typeof resguardante === "object") return resguardante.nombre || "Sin asignar";
  return "Sin asignar";
};

const obtenerIniciales = (nombre: string) => {
  if (nombre === "Sin asignar") return "—";

  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((palabra) => palabra.charAt(0))
    .join("")
    .toUpperCase();
};

export default function TablaUltimosMov() {
  const [articulos, setArticulos] = useState<ArticuloApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarArticulos = async () => {
      try {
        const { data } = await inventariosApi.get<{ data: ArticuloApi[] }>(
          "/articulos/ultimos",
        );

        if (activo) setArticulos((data.data || []).slice(0, 4));
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

    cargarArticulos();

    return () => {
      activo = false;
    };
  }, []);

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        minHeight: 0,
        bgcolor: "#fff",
        border: "1px solid #e8ecef",
        borderLeft: "4px solid #467A77",
        borderRadius: "16px",
        boxShadow: "0 6px 24px rgba(45, 62, 72, 0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2.5,
          pt: 2.1,
          pb: 1.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: "0.98rem", fontWeight: 750, color: "#1f2933" }}>
            Últimos artículos agregados
          </Typography>
          <Typography sx={{ mt: 0.2, color: "#89939e", fontSize: "0.72rem" }}>
            
          </Typography>
        </Box>

        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: "10px",
            bgcolor: "#eef5f4",
            color: "#467A77",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Package size={17} strokeWidth={2} />
        </Box>
      </Box>

      <Box sx={{ mx: 2.5, height: "1px", bgcolor: "#eef1f3" }} />

      {cargando ? (
        <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
          <CircularProgress size={26} sx={{ color: "#467A77" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2.5 }}>
          No fue posible cargar los artículos.
        </Alert>
      ) : articulos.length === 0 ? (
        <Box sx={{ flex: 1, display: "grid", placeItems: "center", px: 3 }}>
          <Typography sx={{ color: "#7d8790", fontSize: "0.82rem", textAlign: "center" }}>
            Aún no hay artículos registrados.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, minHeight: 0, overflowX: "auto", px: 2.5, pb: 1.25 }}>
          <Box sx={{ minWidth: 520 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "minmax(260px, 1.6fr) minmax(180px, 1fr)",
                gap: 1.5,
                alignItems: "center",
                py: 1,
              }}
            >
              {["ARTÍCULO", "RESGUARDANTE"].map((encabezado) => (
                <Typography
                  key={encabezado}
                  sx={{
                    color: "#a0a8b0",
                    fontSize: "0.62rem",
                    fontWeight: 750,
                    letterSpacing: "0.06em",
                  }}
                >
                  {encabezado}
                </Typography>
              ))}
            </Box>

            {articulos.map((articulo) => {
              const resguardante = obtenerResguardante(articulo.resguardante);

              return (
                <Box
                  key={articulo._id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(260px, 1.6fr) minmax(180px, 1fr)",
                    gap: 1.5,
                    alignItems: "center",
                    minHeight: 39,
                    py: 0.65,
                    borderTop: "1px solid #f0f2f4",
                    transition: "background-color 160ms ease",
                    "&:hover": {
                      bgcolor: "#fafcfc",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.1, minWidth: 0 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        noWrap
                        title={articulo.descripcion || "Artículo sin descripción"}
                        sx={{ color: "#27313a", fontSize: "0.75rem", fontWeight: 650 }}
                      >
                        {articulo.descripcion || "Artículo sin descripción"}
                      </Typography>
                      <Typography noWrap sx={{ color: "#9aa3ab", fontSize: "0.63rem" }}>
                        {articulo.numeroInventario || "Sin número de inventario"}
                      </Typography>
                    </Box>
                  </Box>


                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.9, minWidth: 0 }}>
                    <Avatar
                      sx={{
                        width: 26,
                        height: 26,
                        bgcolor: resguardante === "Sin asignar" ? "#f1f2f3" : "#f6eee5",
                        color: resguardante === "Sin asignar" ? "#9ba1a6" : "#a66b36",
                        fontSize: "0.61rem",
                        fontWeight: 750,
                      }}
                    >
                      {obtenerIniciales(resguardante)}
                    </Avatar>
                    <Typography
                      noWrap
                      title={resguardante}
                      sx={{
                        color: resguardante === "Sin asignar" ? "#969fa7" : "#4b5560",
                        fontSize: "0.7rem",
                        fontWeight: 550,
                      }}
                    >
                      {resguardante}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}



