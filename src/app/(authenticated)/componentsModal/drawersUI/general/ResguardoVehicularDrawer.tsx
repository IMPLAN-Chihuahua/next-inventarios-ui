"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Alert,
  Box,
  TextField,
  Button,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";
import DirectionsCarRoundedIcon from "@mui/icons-material/DirectionsCarRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import LocalGasStationRoundedIcon from "@mui/icons-material/LocalGasStationRounded";
import ElectricBoltRoundedIcon from "@mui/icons-material/ElectricBoltRounded";
import SpeedRoundedIcon from "@mui/icons-material/SpeedRounded";
import axios from "axios";
import CenteredDrawer, {
  DrawerSectionTitle,
  drawerDropdownMenuProps,
  drawerFieldStyles,
  drawerPrimaryButtonStyles,
  drawerSecondaryButtonStyles,
} from "../CenteredDrawer";
import { sanitizeSafeText } from "@/src/utils/safeText";
import { inventariosApi } from "@/src/services/axios";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Vehiculo {
  id?: string;
  _id?: string;
  descripcion?: string;
  nombre?: string;
  numeroInventario?: string;
  noSerie?: string;
  tipoEnergia?: "Gasolina" | "Eléctrico" | "No aplica";
  capacidadCombustible?: number;
}

interface Usuario {
  id?: string;
  _id?: string;
  nombre?: string;
  correo?: string;
  activo?: boolean;
}

interface Categoria {
  id?: string;
  _id?: string;
  tipo?: string;
  descripcion?: string;
}

interface ApiList<T> {
  data?: T[];
  items?: T[];
}

const CATEGORIAS_TRANSPORTE_CONOCIDAS = [
  "0c63012a-e7a2-4239-b7ff-4c17fe9b38dc",
  "06920298-9dda-4214-9573-e4c38f4ceb1d",
];

const VEHICULOS_HISTORICOS_IDS = [
  "a8acfc38-9105-4078-ac14-c480183f92d7",
  "33c7abe6-5b57-4bc5-8464-85d2cf95e67c",
  "943470b6-0a4d-4a7e-8532-004a67484d46",
  "e35731c5-d07f-49b4-b24b-3605ce1085af",
  "97ca1271-e8e2-422c-86e6-30fe01fdac36",
  "e5ac48df-11f9-4cad-bbba-2069c8367dca",
  "2b7d0744-07ed-4829-aa2d-75c5a7d5bb3c",
];

const normalizarCatalogo = (value?: string) => (value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toUpperCase();

const esCategoriaTransporte = (categoria: Categoria) => {
  const texto = normalizarCatalogo(`${categoria.tipo || ""} ${categoria.descripcion || ""}`);
  return texto.includes("TRANSPORT") || texto.includes("VEHICUL");
};

const obtenerCapacidadGasolina = (vehiculo?: Vehiculo) => {
  if (vehiculo?.capacidadCombustible) return vehiculo.capacidadCombustible;
  const descripcion = `${vehiculo?.descripcion || ""} ${vehiculo?.nombre || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (descripcion.includes("CHEVROLET")) return 35;
  if (descripcion.includes("RANGER")) return 75;

  return 50;
};
const obtenerTipoCarga = (vehiculo?: Vehiculo) => {
  if (!vehiculo) return "";
  if (vehiculo.tipoEnergia) return vehiculo.tipoEnergia;

  const descripcion = `${vehiculo.descripcion || ""} ${vehiculo.nombre || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (descripcion.includes("BICICLETA")) return "No aplica";

  if (
    descripcion.includes("ELECTRIC") ||
    descripcion.includes("PATIN") ||
    descripcion.includes("SCOOTER")
  ) {
    return "Eléctrico";
  }

  return "Gasolina";
};

function LevelGauge({
  name,
  label,
  value,
  color,
  maxValue,
  unit,
  unitLabel,
  onChange,
}: {
  name: "gasolinaInicial" | "gasolinaFinal" | "cargaInicial" | "cargaFinal";
  label: string;
  value: string;
  color: string;
  maxValue: number;
  unit: "lt" | "%";
  unitLabel: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const numericValue = Number(value) || 0;
  const progress = Math.min(Math.max((numericValue / maxValue) * 100, 0), 100);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        minWidth: 0,
        p: 1.5,
        border: "1px solid #e2e9e9",
        borderRadius: "14px",
        bgcolor: "#ffffff",
      }}
    >
      <Box sx={{ position: "relative", width: 76, height: 76, flexShrink: 0 }}>
        <CircularProgress
          variant="determinate"
          value={100}
          size={76}
          thickness={5}
          sx={{ position: "absolute", inset: 0, color: "#e8eeee" }}
        />
        <CircularProgress
          variant="determinate"
          value={progress}
          size={76}
          thickness={5}
          sx={{
            position: "absolute",
            inset: 0,
            color,
            transition: "color 180ms ease",
            "& .MuiCircularProgress-circle": {
              strokeLinecap: "round",
              transition: "stroke-dashoffset 300ms ease",
            },
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <Typography sx={{ color: "#263638", fontWeight: 800, fontSize: "1rem", lineHeight: 1 }}>
            {numericValue}
          </Typography>
          <Typography sx={{ color: "#7b898c", fontWeight: 650, fontSize: "0.64rem", mt: 0.3 }}>
            {unitLabel}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ color: "#354447", fontSize: "0.78rem", fontWeight: 750, mb: 1 }}>
          {label}
        </Typography>
        <TextField
          name={name}
          type="number"
          value={value}
          onChange={onChange}
          fullWidth
          size="small"
          sx={drawerFieldStyles}
          slotProps={{ htmlInput: { min: 0, max: maxValue }, input: { endAdornment: unit } }}
        />
        <Typography sx={{ color: "#96a1a3", fontSize: "0.64rem", mt: 0.7 }}>
          Indicador visual sobre {maxValue} {unit}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ResguardoVehicularDrawer({ open, onClose }: Props) {
  const [formData, setFormData] = useState({
    articuloId: "", 
    folio: "",
    fecha: "",
    numeroInventario: "",
    vehiculo: "",
    serie: "",
    cargaGasolinaElectrica: "",
    cargaInicial: "",
    cargaFinal: "",
    gasolinaInicial: "",
    gasolinaFinal: "",
    kilometrajeInicial: "",
    kilometrajeFinal: "",
    resguardante: "", 
    comentarios: ""
  });

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingCarga, setLoadingCarga] = useState(false);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorSubmit, setErrorSubmit] = useState("");
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const cargarDatos = useCallback(async () => {
    await Promise.resolve();
    setLoadingCarga(true);
    setErrorCarga("");

    const [resultadoCategorias, resultadoUsuarios] = await Promise.allSettled([
      inventariosApi.get<Categoria[] | ApiList<Categoria>>("/categorias", {
        params: { limit: 1000, fields: "tipo,descripcion" },
      }),
      inventariosApi.get<Usuario[] | ApiList<Usuario>>("/usuarios", {
        params: { limit: 1000, fields: "nombre,correo,activo" },
      }),
    ]);

    const categoriasTransporte = new Set(CATEGORIAS_TRANSPORTE_CONOCIDAS);
    if (resultadoCategorias.status === "fulfilled") {
      const respuesta = resultadoCategorias.value.data;
      const categorias = Array.isArray(respuesta) ? respuesta : respuesta.data || respuesta.items || [];
      categorias.filter(esCategoriaTransporte).forEach((categoria) => {
        const id = categoria.id || categoria._id;
        if (id) categoriasTransporte.add(id);
      });
    } else {
      console.error("Error al identificar la categoría Transporte:", resultadoCategorias.reason);
    }

    const [resultadoVehiculos, ...resultadosHistoricos] = await Promise.allSettled([
      inventariosApi.get<Vehiculo[] | ApiList<Vehiculo>>("/articulos", {
        params: { categorias: Array.from(categoriasTransporte).join(","), limit: 1000 },
      }),
      ...VEHICULOS_HISTORICOS_IDS.map((id) => inventariosApi.get<Vehiculo>(`/articulos/${id}`)),
    ]);

    const vehiculosPorId = new Map<string, Vehiculo>();
    if (resultadoVehiculos.status === "fulfilled") {
      const respuesta = resultadoVehiculos.value.data;
      const lista = Array.isArray(respuesta) ? respuesta : respuesta.data || respuesta.items || [];
      lista.forEach((vehiculo) => {
        const id = vehiculo.id || vehiculo._id;
        if (id) vehiculosPorId.set(id, vehiculo);
      });
    }

    resultadosHistoricos.forEach((resultado) => {
      if (resultado.status !== "fulfilled") return;
      const vehiculo = resultado.value.data;
      const id = vehiculo.id || vehiculo._id;
      if (id) vehiculosPorId.set(id, vehiculo);
    });

    setVehiculos(Array.from(vehiculosPorId.values()));
    if (resultadoVehiculos.status === "rejected" && vehiculosPorId.size === 0) {
      setVehiculos([]);
      setErrorCarga("No fue posible cargar la lista de vehículos.");
      console.error("Error al cargar vehículos:", resultadoVehiculos.reason);
    }

    if (resultadoUsuarios.status === "fulfilled") {
      const respuesta = resultadoUsuarios.value.data;
      const lista = Array.isArray(respuesta) ? respuesta : respuesta.data || respuesta.items || [];
      setUsuarios(lista.filter((usuario) => usuario.activo === true));
    } else {
      setUsuarios([]);
      setErrorCarga((actual) => actual || "No fue posible cargar la lista de empleados.");
      console.error("Error al cargar usuarios:", resultadoUsuarios.reason);
    }

    setLoadingCarga(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    const cargaInicial = window.setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => window.clearTimeout(cargaInicial);
  }, [open, cargarDatos]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;
    const vehiculoSeleccionado = vehiculos.find(
      (vehiculo) => (vehiculo.id || vehiculo._id) === formData.articuloId
    );

    const limite = name === "cargaInicial" || name === "cargaFinal"
      ? 100
      : name === "gasolinaInicial" || name === "gasolinaFinal"
        ? obtenerCapacidadGasolina(vehiculoSeleccionado)
        : undefined;

    if (value !== "" && limite !== undefined) {
      value = String(Math.min(Math.max(Number(value), 0), limite));
    }
    if (name === "folio" || name === "comentarios") {
      value = sanitizeSafeText(value);
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleVehiculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedId = e.target.value;
  const vehiculoSeleccionado = vehiculos.find(
      (v) => (v.id || v._id) === selectedId
    );

    setFormData({
      ...formData,
      articuloId: selectedId,
      numeroInventario: vehiculoSeleccionado?.numeroInventario || "",
      serie: vehiculoSeleccionado?.noSerie || "",
      cargaGasolinaElectrica: obtenerTipoCarga(vehiculoSeleccionado),
      cargaInicial: "",
      cargaFinal: "",
      gasolinaInicial: "",
      gasolinaFinal: "",
      kilometrajeInicial: "",
      kilometrajeFinal: "",
    });
  };

  const handleSubmit = async () => {
    setErrorSubmit("");

    if (!formData.articuloId) {
      setErrorSubmit("Selecciona un vehículo.");
      return;
    }
    if (!formData.resguardante) {
      setErrorSubmit("Selecciona un empleado responsable.");
      return;
    }

    setLoadingSubmit(true);
    try {
      const payload: Record<string, unknown> = { ...formData };

      const { articuloId } = payload;
      delete payload.articuloId;
      delete payload.cargaGasolinaElectrica;

      ["folio", "fecha", "vehiculo", "comentarios"].forEach((campo) => {
        if (typeof payload[campo] === "string" && payload[campo].trim() === "") {
          delete payload[campo];
        }
      });
      [
        "cargaInicial",
        "cargaFinal",
        "gasolinaInicial",
        "gasolinaFinal",
        "kilometrajeInicial",
        "kilometrajeFinal",
      ].forEach((campo) => {
        if (payload[campo] === "") {
          delete payload[campo];
        } else if (payload[campo] !== undefined) {
          payload[campo] = Number(payload[campo]);
        }
      });

      const response = await inventariosApi.post<Blob>(
        `/resguardos/vehiculo/${articuloId}/resguardo/download`,
        payload,
        {
          responseType: "blob",
          timeout: 60000,
        },
      );

      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Resguardo_Vehicular_${formData.folio || "Documento"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      let message = "No fue posible generar el resguardo vehicular.";

      if (axios.isAxiosError(error)) {
        let errorData = error.response?.data as unknown;
        if (errorData instanceof Blob) {
          const text = await errorData.text();
          try {
            errorData = JSON.parse(text);
          } catch {
            if (text.trim()) message = text;
          }
        }

        if (errorData && typeof errorData === "object") {
          const backendError = errorData as { message?: string; errors?: string[] };
          if (backendError.message) message = backendError.message;
          else if (Array.isArray(backendError.errors) && backendError.errors.length > 0) {
            message = backendError.errors.join(" · ");
          }
        }

        if (!error.response) {
          message = "No se pudo conectar con el backend. Verifica que esté ejecutándose en el puerto 8080.";
        }
      }

      setErrorSubmit(message);
    } finally {
      setLoadingSubmit(false);
    }
  };

  const vehiculoSeleccionado = vehiculos.find(
    (vehiculo) => (vehiculo.id || vehiculo._id) === formData.articuloId
  );
  const capacidadGasolina = obtenerCapacidadGasolina(vehiculoSeleccionado);
  const actions = (
    <>
      <Button
        variant="text"
        onClick={onClose}
        disabled={loadingSubmit}
        sx={drawerSecondaryButtonStyles}
      >
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={handleSubmit}
        disabled={loadingSubmit || loadingCarga}
        startIcon={loadingSubmit ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon />}
        sx={drawerPrimaryButtonStyles}
      >
        {loadingSubmit ? "Generando resguardo..." : "Guardar y descargar"}
      </Button>
    </>
  );

  return (
    <CenteredDrawer
      open={open}
      onClose={onClose}
      title="Nuevo resguardo vehicular"
      subtitle="Registra los datos del vehículo y del empleado responsable"
      icon={<DirectionsCarRoundedIcon />}
      actions={actions}
      size="wide"
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 2.1fr) minmax(300px, 0.9fr)" },
          gap: 2,
          alignItems: "stretch",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            alignContent: "start",
            gap: 1.5,
            p: 2,
            border: "1px solid #e3e9ea",
            borderRadius: "16px",
            bgcolor: "#fbfcfc",
          }}
        >
          <DrawerSectionTitle
            icon={<DirectionsCarRoundedIcon fontSize="small" />}
            title="Datos del vehículo"
            description="Completa la información del vehículo."
          />

          {errorCarga && (
            <Alert
              severity="error"
              sx={{ gridColumn: { xs: "auto", sm: "span 2" }, borderRadius: "12px", alignItems: "center" }}
              action={
                <Button color="inherit" size="small" onClick={() => void cargarDatos()} disabled={loadingCarga} sx={{ fontWeight: 750, textTransform: "none" }}>
                  Reintentar
                </Button>
              }
            >
              {errorCarga}
            </Alert>
          )}

          {errorSubmit && (
            <Alert severity="error" sx={{ gridColumn: "1 / -1", borderRadius: "12px" }}>
              {errorSubmit}
            </Alert>
          )}

          <TextField
            select
            name="articuloId"
            label="Vehículo"
            value={formData.articuloId}
            onChange={handleVehiculoChange}
            fullWidth
            required
            disabled={loadingCarga}
            sx={{ ...drawerFieldStyles, gridColumn: { xs: "auto", sm: "span 2" } }}
            slotProps={{
              select: {
                MenuProps: drawerDropdownMenuProps,
                renderValue: (value) => {
                  const vehiculo = vehiculos.find((item) => (item.id || item._id) === value);
                  return vehiculo
                    ? `${vehiculo.descripcion || vehiculo.nombre || "Vehículo"} · ${vehiculo.numeroInventario || "Sin inventario"}`
                    : "Selecciona un vehículo";
                },
              },
            }}
          >
            {vehiculos.length > 0 ? (
              vehiculos.map((vehiculo) => (
                <MenuItem key={vehiculo.id || vehiculo._id} value={vehiculo.id || vehiculo._id}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, lineHeight: 1.25 }} noWrap>
                      {vehiculo.descripcion || vehiculo.nombre || "Vehículo sin descripción"}
                    </Typography>
                    <Typography sx={{ color: "#7b898c", fontSize: "0.72rem", mt: 0.25 }} noWrap>
                      Inventario: {vehiculo.numeroInventario || "Sin número"}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value="">
                {loadingCarga ? "Cargando vehículos..." : "No hay vehículos disponibles"}
              </MenuItem>
            )}
          </TextField>

          <TextField name="folio" label="Folio" value={formData.folio} onChange={handleChange} fullWidth sx={drawerFieldStyles} />
          <TextField
            name="fecha"
            label="Fecha"
            type="date"
            value={formData.fecha}
            onChange={handleChange}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
            sx={drawerFieldStyles}
          />
          <TextField
            name="numeroInventario"
            label="Número de inventario"
            value={formData.numeroInventario}
            fullWidth
            disabled
            sx={drawerFieldStyles}
          />
          <TextField name="serie" label="Serie" value={formData.serie} fullWidth disabled sx={drawerFieldStyles} />
          <TextField
            select
            name="cargaGasolinaElectrica"
            label="Tipo de carga"
            value={formData.cargaGasolinaElectrica}
            fullWidth
            disabled
            sx={drawerFieldStyles}
            slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}
          >
            <MenuItem value="No aplica">No aplica</MenuItem>
            <MenuItem value="Gasolina">Gasolina</MenuItem>
            <MenuItem value="Eléctrico">Eléctrico</MenuItem>
          </TextField>

          {formData.cargaGasolinaElectrica === "Eléctrico" && (
            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                gap: 1.5,
                p: 1.5,
                border: "1px solid #dce8ee",
                borderRadius: "14px",
                bgcolor: "#f5f9fb",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, gridColumn: "1 / -1" }}>
                <ElectricBoltRoundedIcon sx={{ color: "#5081a5", fontSize: 20 }} />
                <Box>
                  <Typography sx={{ color: "#33484f", fontSize: "0.8rem", fontWeight: 750 }}>
                    Nivel de batería
                  </Typography>
                  <Typography sx={{ color: "#7b898c", fontSize: "0.68rem" }}>
                    Registra el porcentaje al entregar y recibir la unidad.
                  </Typography>
                </Box>
              </Box>
              <LevelGauge
                name="cargaInicial"
                label="Carga inicial"
                value={formData.cargaInicial}
                color="#5081a5"
                maxValue={100}
                unit="%"
                unitLabel="por ciento"
                onChange={handleChange}
              />
              <LevelGauge
                name="cargaFinal"
                label="Carga final"
                value={formData.cargaFinal}
                color="#467a77"
                maxValue={100}
                unit="%"
                unitLabel="por ciento"
                onChange={handleChange}
              />
            </Box>
          )}

          {formData.cargaGasolinaElectrica === "Gasolina" && (
            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
                gap: 1.5,
                p: 1.5,
                border: "1px solid #e4e8dc",
                borderRadius: "14px",
                bgcolor: "#fafbf6",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, gridColumn: "1 / -1" }}>
                <LocalGasStationRoundedIcon sx={{ color: "#68886b", fontSize: 20 }} />
                <Box>
                  <Typography sx={{ color: "#3d4c40", fontSize: "0.8rem", fontWeight: 750 }}>
                    Control de combustible
                  </Typography>
                  <Typography sx={{ color: "#7b898c", fontSize: "0.68rem" }}>
                    Capacidad máxima de esta unidad: {capacidadGasolina} litros.
                  </Typography>
                </Box>
              </Box>

              <LevelGauge
                name="gasolinaInicial"
                label="Gasolina inicial"
                value={formData.gasolinaInicial}
                color="#5081a5"
                maxValue={capacidadGasolina}
                unit="lt"
                unitLabel="litros"
                onChange={handleChange}
              />
              <LevelGauge
                name="gasolinaFinal"
                label="Gasolina final"
                value={formData.gasolinaFinal}
                color="#467a77"
                maxValue={capacidadGasolina}
                unit="lt"
                unitLabel="litros"
                onChange={handleChange}
              />

              <Box
                sx={{
                  gridColumn: "1 / -1",
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "auto repeat(2, minmax(0, 1fr))" },
                  alignItems: "center",
                  gap: 1.25,
                  p: 1.25,
                  border: "1px solid #e2e9e9",
                  borderRadius: "12px",
                  bgcolor: "#ffffff",
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: "#467a77",
                    bgcolor: "#eaf2f2",
                    borderRadius: "10px",
                  }}
                >
                  <SpeedRoundedIcon fontSize="small" />
                </Box>
                <TextField
                  name="kilometrajeInicial"
                  label="Kilometraje inicial"
                  type="number"
                  value={formData.kilometrajeInicial}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  sx={drawerFieldStyles}
                  slotProps={{ htmlInput: { min: 0 }, input: { endAdornment: "km" } }}
                />
                <TextField
                  name="kilometrajeFinal"
                  label="Kilometraje final"
                  type="number"
                  value={formData.kilometrajeFinal}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                  sx={drawerFieldStyles}
                  slotProps={{ htmlInput: { min: 0 }, input: { endAdornment: "km" } }}
                />
              </Box>
            </Box>
          )}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            p: 2,
            border: "1px solid #e3e9ea",
            borderRadius: "16px",
            bgcolor: "#fbfcfc",
          }}
        >
          <DrawerSectionTitle
            icon={<PersonOutlineRoundedIcon fontSize="small" />}
            title="Responsable"
            description="Persona que quedará a cargo de la unidad."
          />

          <TextField
            select
            name="resguardante"
            label="Empleado Responsable"
            value={formData.resguardante}
            onChange={handleChange}
            fullWidth
            required
            disabled={loadingCarga}
            sx={drawerFieldStyles}
            slotProps={{
              select: {
                MenuProps: drawerDropdownMenuProps,
                renderValue: (value) => {
                  const usuario = usuarios.find((item) => (item.id || item._id) === value);
                  return usuario?.nombre || usuario?.correo || "Selecciona un empleado";
                },
              },
            }}
          >
            {usuarios.length > 0 ? (
              usuarios.map((usuario) => (
                <MenuItem key={usuario.id || usuario._id} value={usuario.id || usuario._id}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, lineHeight: 1.25 }} noWrap>
                      {usuario.nombre || "Usuario sin nombre"}
                    </Typography>
                    {usuario.correo && (
                      <Typography sx={{ color: "#7b898c", fontSize: "0.72rem", mt: 0.25 }} noWrap>
                        {usuario.correo}
                      </Typography>
                    )}
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled value="">
                {loadingCarga ? "Cargando usuarios..." : "No hay usuarios disponibles"}
              </MenuItem>
            )}
          </TextField>

          <TextField
            name="comentarios"
            label="Comentarios u observaciones"
            multiline
            minRows={3}
            value={formData.comentarios}
            onChange={handleChange}
            fullWidth
            sx={{ ...drawerFieldStyles, flex: 1 }}
            slotProps={{
              input: {
                startAdornment: (
                  <NotesRoundedIcon sx={{ color: "#9aa5aa", fontSize: 19, mr: 1, alignSelf: "flex-start", mt: 0.3 }} />
                ),
              },
            }}
          />
        </Box>
      </Box>

    </CenteredDrawer>
  );
}
