"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Chip, CircularProgress, Typography } from "@mui/material";
import { inventariosApi } from "@/src/services/axios";

type TipoMovimiento = "Alta" | "Actualización" | "Resguardo" | "Categoría" | "Usuario";

interface ValorHistorico {
  descripcion?: string;
  numeroInventario?: string;
  tipo?: string;
  nombre?: string;
  resguardante?: string | { _id?: string; nombre?: string };
  fechaAlta?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface HistoricoApi {
  _id: string;
  usuario?: string | { _id: string; nombre: string };
  accion: "CREATE" | "UPDATE";
  modelo: "Articulo" | "Usuario" | "Categoria";
  valorAntiguo?: ValorHistorico | ValorHistorico[];
  valorNuevo: ValorHistorico | ValorHistorico[];
  createdAt?: string;
  updatedAt?: string;
}

interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  descripcion: string;
  responsable: string;
  fecha?: string;
}

const tipoConfig: Record<TipoMovimiento, { fondo: string; texto: string }> = {
  Alta: { fondo: "#dcfce7", texto: "#15803d" },
  Actualización: { fondo: "#dbeafe", texto: "#1d4ed8" },
  Resguardo: { fondo: "#fef3c7", texto: "#b45309" },
  Categoría: { fondo: "#ede9fe", texto: "#6d28d9" },
  Usuario: { fondo: "#f3f4f6", texto: "#4b5563" },
};

const primerValor = (valor: ValorHistorico | ValorHistorico[] | undefined) =>
  Array.isArray(valor) ? valor[0] : valor;

const esResguardo = (historico: HistoricoApi) => {
  if (historico.modelo !== "Articulo" || historico.accion !== "UPDATE") return false;
  const anterior = primerValor(historico.valorAntiguo);
  const nuevo = primerValor(historico.valorNuevo);
  const resguardanteAnterior =
    typeof anterior?.resguardante === "object" ? anterior.resguardante._id : anterior?.resguardante;
  const resguardanteNuevo =
    typeof nuevo?.resguardante === "object" ? nuevo.resguardante._id : nuevo?.resguardante;
  return Boolean(resguardanteNuevo && resguardanteNuevo !== resguardanteAnterior);
};

const obtenerTipo = (historico: HistoricoApi): TipoMovimiento => {
  if (historico.modelo === "Categoria") return "Categoría";
  if (historico.modelo === "Usuario") return "Usuario";
  if (historico.accion === "CREATE") return "Alta";
  if (esResguardo(historico)) return "Resguardo";
  return "Actualización";
};

const obtenerDescripcion = (historico: HistoricoApi) => {
  const valor = primerValor(historico.valorNuevo);
  const cantidad = Array.isArray(historico.valorNuevo) ? historico.valorNuevo.length : 1;

  if (historico.modelo === "Categoria") {
    return (historico.accion === "CREATE" ? "Se agregó" : "Se actualizó") +
      " la categoría " + (valor?.tipo ?? "sin nombre");
  }
  if (historico.modelo === "Usuario") {
    return (historico.accion === "CREATE" ? "Se agregó" : "Se actualizó") +
      " el usuario " + (valor?.nombre ?? "sin nombre");
  }
  if (esResguardo(historico)) {
    return cantidad > 1
      ? "Se resguardaron " + cantidad + " artículos"
      : "Se resguardó " + (valor?.descripcion ?? valor?.numeroInventario ?? "un artículo");
  }
  return (historico.accion === "CREATE" ? "Se agregó " : "Se actualizó ") +
    (valor?.descripcion ?? valor?.numeroInventario ?? "un artículo");
};

const obtenerFecha = (historico: HistoricoApi) => {
  const valor = primerValor(historico.valorNuevo);
  return historico.createdAt ?? historico.updatedAt ?? valor?.updatedAt ??
    valor?.createdAt ?? valor?.fechaAlta;
};

const formatearFecha = (fecha?: string) => {
  if (!fecha) return "Fecha no disponible";
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(valor);
};

export default function TablaUltimosMov() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarMovimientos = async () => {
      try {
        const { data } = await inventariosApi.get<{ data: HistoricoApi[] }>(
          "/historicos?limit=5&page=1",
        );
        if (!activo) return;

        setMovimientos((data.data ?? []).map((historico) => ({
          id: historico._id,
          tipo: obtenerTipo(historico),
          descripcion: obtenerDescripcion(historico),
          responsable:
            typeof historico.usuario === "object"
              ? historico.usuario.nombre
              : "Usuario del sistema",
          fecha: obtenerFecha(historico),
        })));
      } catch (error) {
        console.error("No fue posible cargar los últimos movimientos", error);
        if (activo) setError(true);
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarMovimientos();
    return () => {
      activo = false;
    };
  }, []);

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: 0,
        bgcolor: "#fff",
        border: "1px solid #eef0f2",
        borderLeft: "4px solid #467A77",
        borderRadius: "14px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        px: 2.25,
        py: 2,
        overflow: "hidden",
      }}
    >
      <Typography sx={{ fontSize: "0.95rem", fontWeight: 700, color: "#1d1d1f" }}>
        Últimos Movimientos
      </Typography>
      <Typography sx={{ color: "#9ca3af", fontSize: "0.75rem", mb: 1.25 }}>
        Actividad reciente del inventario
      </Typography>

      {cargando ? (
        <Box sx={{ display: "grid", placeItems: "center", height: 190 }}>
          <CircularProgress size={28} sx={{ color: "#467A77" }} />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 3 }}>
          No fue posible cargar los movimientos.
        </Alert>
      ) : movimientos.length === 0 ? (
        <Typography sx={{ color: "#6b7280", fontSize: "0.85rem", py: 6, textAlign: "center" }}>
          Aún no hay movimientos registrados.
        </Typography>
      ) : (
        <Box>
          {movimientos.map((movimiento) => {
            const config = tipoConfig[movimiento.tipo];
            return (
              <Box
                key={movimiento.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 1,
                  alignItems: "center",
                  py: 1,
                  borderTop: "1px solid #f1f3f5",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    noWrap
                    title={movimiento.descripcion}
                    sx={{ fontSize: "0.79rem", fontWeight: 600, color: "#1f2937" }}
                  >
                    {movimiento.descripcion}
                  </Typography>
                  <Typography noWrap sx={{ color: "#9ca3af", fontSize: "0.69rem" }}>
                    {movimiento.responsable} · {formatearFecha(movimiento.fecha)}
                  </Typography>
                </Box>
                <Chip
                  label={movimiento.tipo}
                  size="small"
                  sx={{
                    height: 22,
                    bgcolor: config.fondo,
                    color: config.texto,
                    fontSize: "0.66rem",
                    fontWeight: 700,
                  }}
                />
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}