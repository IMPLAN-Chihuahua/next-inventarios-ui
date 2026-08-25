"use client";

import { useState, useEffect, useCallback } from "react";
import {
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
import CenteredDrawer, {
  DrawerSectionTitle,
  drawerDropdownMenuProps,
  drawerFieldStyles,
  drawerPrimaryButtonStyles,
  drawerSecondaryButtonStyles,
} from "../CenteredDrawer";

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

const CATEGORIA_TRANSPORTE_ID = "0c63012a-e7a2-4239-b7ff-4c17fe9b38dc";

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
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const cargarDatos = useCallback(async () => {
    await Promise.resolve();
    setLoadingCarga(true);
    try {
      const [resVehiculos, resUsuarios] = await Promise.all([
        fetch(`/api/v1/articulos?categorias=${CATEGORIA_TRANSPORTE_ID}&limit=1000`),
        fetch('/api/v1/usuarios?limit=1000&fields=nombre,correo,activo')
      ]);

      if (resVehiculos.ok) {
        const jsonVehiculos = await resVehiculos.json();
        const listaArticulos = Array.isArray(jsonVehiculos)
          ? jsonVehiculos
          : (jsonVehiculos.data || jsonVehiculos.items || []);
        setVehiculos(listaArticulos);
      } else {
        const errorBody = await resVehiculos.text();
        console.error("Error al cargar articulos:", resVehiculos.status, errorBody);
      }

      if (resUsuarios.ok) {
        const jsonUsuarios = await resUsuarios.json();
        const listaUsuarios = Array.isArray(jsonUsuarios)
          ? jsonUsuarios
          : (jsonUsuarios.data || jsonUsuarios.items || []);
        setUsuarios((listaUsuarios as Usuario[]).filter((usuario) => usuario.activo === true));
      } else {
        const errorBody = await resUsuarios.text();
        console.error("Error al cargar usuarios:", resUsuarios.status, errorBody);
      }
    } catch (error) {
      console.error("Error al cargar los catálogos (excepción):", error);
    } finally {
      setLoadingCarga(false);
    }
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
    if (!formData.articuloId) {
      alert("Por favor, selecciona un vehículo.");
      return;
    }
      if (!formData.resguardante) {
    alert("Por favor, selecciona un empleado responsable.");
    return;
  }

    setLoadingSubmit(true);
    try {
      const payload: Record<string, unknown> = { ...formData };
      
      const { articuloId } = payload;
      delete payload.articuloId;
      delete payload.cargaGasolinaElectrica;

      if (!payload.fecha) delete payload.fecha;
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

      const response = await fetch(`/api/v1/resguardos/vehiculo/${articuloId}/resguardo/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error desconocido del servidor" }));
        console.error("Detalles del error del backend:", errorData);
        throw new Error(errorData.message || "Error al generar el resguardo");
      }

      const blob = await response.blob();
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
      console.error(error);
      alert("Error al intentar generar el resguardo.");
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







