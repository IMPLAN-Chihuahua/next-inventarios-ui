"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, MenuItem, TextField, Typography } from "@mui/material";
import AddBoxRoundedIcon from "@mui/icons-material/AddBoxRounded";
import AssignmentIndRoundedIcon from "@mui/icons-material/AssignmentIndRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import axios from "axios";
import { inventariosApi } from "@/src/services/axios";
import StepperDrawer, { DrawerStep } from "../WithStepperCenterDrawer";
import {
  DrawerSectionTitle,
  drawerDropdownMenuProps,
  drawerFieldStyles,
} from "../CenteredDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Categoria {
  id?: string;
  _id?: string;
  tipo?: string;
  descripcion?: string;
}

interface Usuario {
  id?: string;
  _id?: string;
  nombre?: string;
}

interface ArticuloFormData {
  categoria: string;
  costo: string;
  datosFactura: string;
  descripcion: string;
  estado: string;
  fechaAsignacion: string;
  fechaFactura: string;
  localizacion: string;
  marca: string;
  modelo: string;
  noSerie: string;
  numeroInventario: string;
  observaciones: string;
  resguardante: string;
}

const ESTADOS = ["Asignado", "Baja", "Donado", "Dictaminar", "Dictaminado"];
const LOCALIZACIONES = [
  "Área técnica",
  "Site",
  "Lactario",
  "Cocina",
  "Jurídico",
  "Sala Dr. Ríos",
  "Sala capacitaciones",
  "Dirección",
  "Subdirección",
  "Administrativo",
];

const initialFormData: ArticuloFormData = {
  categoria: "",
  costo: "",
  datosFactura: "",
  descripcion: "",
  estado: "",
  fechaAsignacion: "",
  fechaFactura: "",
  localizacion: "",
  marca: "",
  modelo: "",
  noSerie: "",
  numeroInventario: "",
  observaciones: "",
  resguardante: "",
};

const getList = <T,>(json: unknown): T[] => {
  if (Array.isArray(json)) return json as T[];
  if (!json || typeof json !== "object") return [];

  const response = json as Record<string, unknown>;
  const list = response.data ?? response.items;
  return Array.isArray(list) ? (list as T[]) : [];
};

const panelStyles = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
  alignContent: "start",
  gap: 1.5,
  p: 2,
  border: "1px solid #e3e9ea",
  borderRadius: "16px",
  bgcolor: "#fbfcfc",
};

export default function AgregarArticuloDrawer({ open, onClose }: Props) {
  const [formData, setFormData] = useState<ArticuloFormData>(initialFormData);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const cargarCatalogos = useCallback(async () => {
    setLoadingCatalogos(true);
    setErrorMessage("");

    try {
      const [categoriasResponse, usuariosResponse] = await Promise.all([
        fetch("/api/v1/categorias?limit=1000&fields=tipo,descripcion"),
        fetch("/api/v1/usuarios?limit=1000&fields=nombre"),
      ]);

      if (!categoriasResponse.ok || !usuariosResponse.ok) {
        throw new Error("No fue posible cargar las categorías o los trabajadores.");
      }

      const [categoriasJson, usuariosJson] = await Promise.all([
        categoriasResponse.json(),
        usuariosResponse.json(),
      ]);

      setCategorias(getList<Categoria>(categoriasJson));
      setUsuarios(getList<Usuario>(usuariosJson));
    } catch (error) {
      console.error(error);
      setErrorMessage("No fue posible cargar los catálogos del formulario.");
    } finally {
      setLoadingCatalogos(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const cargaInicial = window.setTimeout(() => {
      void cargarCatalogos();
    }, 0);

    return () => window.clearTimeout(cargaInicial);
  }, [open, cargarCatalogos]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "estado" && value !== "Asignado" ? { resguardante: "" } : {}),
    }));
    setErrorMessage("");
  };

  const handleClose = () => {
    setFormData(initialFormData);
    setErrorMessage("");
    onClose();
  };

  const validateGeneral = () => {
    if (
      !formData.categoria ||
      !formData.estado ||
      !formData.numeroInventario.trim() ||
      !formData.localizacion.trim()
    ) {
      setErrorMessage("Completa categoría, estado, número de inventario y localización para continuar.");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const validateInvoiceAndTechnical = () => {
    if (!formData.costo || !formData.datosFactura.trim() || !formData.fechaFactura || !formData.noSerie.trim()) {
      setErrorMessage("Completa costo, número de factura, fecha de factura y número de serie para continuar.");
      return false;
    }

    const costo = Number(formData.costo);
    if (!Number.isFinite(costo) || costo < 0) {
      setErrorMessage("El costo debe ser un número válido mayor o igual a cero.");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const validateAssignment = () => {
    if (formData.estado === "Asignado" && !formData.resguardante) {
      setErrorMessage("Selecciona un resguardante para un artículo con estado Asignado.");
      return false;
    }

    setErrorMessage("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateGeneral() || !validateInvoiceAndTechnical() || !validateAssignment()) return false;

    const payload: Record<string, string | number> = {
      categoria: formData.categoria,
      costo: Number(formData.costo),
      datosFactura: formData.datosFactura.trim(),
      estado: formData.estado,
      fechaFactura: formData.fechaFactura,
      localizacion: formData.localizacion.trim(),
      noSerie: formData.noSerie.trim(),
      numeroInventario: formData.numeroInventario.trim(),
    };

    const optionalFields: Array<keyof ArticuloFormData> = [
      "descripcion",
      "fechaAsignacion",
      "marca",
      "modelo",
      "observaciones",
    ];

    optionalFields.forEach((field) => {
      const value = formData[field].trim();
      if (value) payload[field] = value;
    });

    if (formData.estado === "Asignado") payload.resguardante = formData.resguardante;

    setErrorMessage("");
    try {
      await inventariosApi.post("/articulos", payload);
      setFormData(initialFormData);
      alert("Artículo guardado correctamente.");
      return true;
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string; errors?: string[] } | undefined;
        setErrorMessage(
          data?.message ||
            data?.errors?.join(" · ") ||
            "No fue posible guardar el artículo. Verifica que el número de inventario no esté repetido.",
        );
      } else {
        setErrorMessage("No fue posible guardar el artículo.");
      }
      return false;
    }
  };

  const errorAlert = errorMessage ? (
    <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>
      {errorMessage}
    </Alert>
  ) : null;

  const steps: DrawerStep[] = [
    {
      label: "Datos generales",
      validate: validateGeneral,
      content: () => (
        <>
          {errorAlert}
          <Box sx={panelStyles}>
            <DrawerSectionTitle
              icon={<Inventory2RoundedIcon fontSize="small" />}
              title="Identificación del artículo"
              description="Información principal para localizarlo dentro del inventario."
            />

            <TextField
              select
              required
              name="categoria"
              label="Categoría"
              value={formData.categoria}
              onChange={handleChange}
              disabled={loadingCatalogos}
              fullWidth
              sx={drawerFieldStyles}
              slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}
            >
              {categorias.length > 0 ? (
                categorias.map((categoria) => (
                  <MenuItem key={categoria.id || categoria._id} value={categoria.id || categoria._id}>
                    {categoria.tipo || categoria.descripcion || "Categoría sin nombre"}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  {loadingCatalogos ? "Cargando categorías..." : "No hay categorías disponibles"}
                </MenuItem>
              )}
            </TextField>

            <TextField
              select
              required
              name="estado"
              label="Estado"
              value={formData.estado}
              onChange={handleChange}
              fullWidth
              sx={drawerFieldStyles}
              slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}
            >
              {ESTADOS.map((estado) => (
                <MenuItem key={estado} value={estado}>
                  {estado}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              name="numeroInventario"
              label="Número de inventario"
              value={formData.numeroInventario}
              onChange={handleChange}
              fullWidth
              sx={drawerFieldStyles}
            />
            <TextField
              select
              required
              name="localizacion"
              label="Localización"
              value={formData.localizacion}
              onChange={handleChange}
              fullWidth
              sx={drawerFieldStyles}
              slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}
            >
              {LOCALIZACIONES.map((localizacion) => (
                <MenuItem key={localizacion} value={localizacion}>
                  {localizacion}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              name="descripcion"
              label="Descripción"
              value={formData.descripcion}
              onChange={handleChange}
              multiline
              minRows={3}
              fullWidth
              sx={{ ...drawerFieldStyles, gridColumn: "1 / -1" }}
            />
          </Box>
        </>
      ),
    },
    {
      label: "Factura y datos técnicos",
      validate: validateInvoiceAndTechnical,
      content: () => (
        <>
          {errorAlert}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
            <Box sx={panelStyles}>
              <DrawerSectionTitle
                icon={<ReceiptLongRoundedIcon fontSize="small" />}
                title="Información de factura"
                description="Datos económicos y comprobante de adquisición."
              />
              <TextField
                required
                name="costo"
                label="Costo"
                type="number"
                value={formData.costo}
                onChange={handleChange}
                fullWidth
                sx={drawerFieldStyles}
                slotProps={{ htmlInput: { min: 0, step: "0.01" }, input: { startAdornment: "$" } }}
              />
              <TextField
                required
                name="datosFactura"
                label="Número de factura"
                value={formData.datosFactura}
                onChange={handleChange}
                fullWidth
                sx={drawerFieldStyles}
              />
              <TextField
                required
                name="fechaFactura"
                label="Fecha de factura"
                type="date"
                value={formData.fechaFactura}
                onChange={handleChange}
                fullWidth
                sx={{ ...drawerFieldStyles, gridColumn: "1 / -1" }}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <Box sx={panelStyles}>
              <DrawerSectionTitle
                icon={<BuildRoundedIcon fontSize="small" />}
                title="Datos técnicos"
                description="Características para identificar físicamente el artículo."
              />
              <TextField
                name="marca"
                label="Marca"
                value={formData.marca}
                onChange={handleChange}
                fullWidth
                sx={drawerFieldStyles}
              />
              <TextField
                name="modelo"
                label="Modelo"
                value={formData.modelo}
                onChange={handleChange}
                fullWidth
                sx={drawerFieldStyles}
              />
              <TextField
                required
                name="noSerie"
                label="Número de serie"
                value={formData.noSerie}
                onChange={handleChange}
                fullWidth
                sx={{ ...drawerFieldStyles, gridColumn: "1 / -1" }}
              />
            </Box>
          </Box>
        </>
      ),
    },
    {
      label: "Asignación y revisión",
      validate: validateAssignment,
      content: () => {
        const categoria = categorias.find((item) => (item.id || item._id) === formData.categoria);
        const resguardante = usuarios.find((item) => (item.id || item._id) === formData.resguardante);

        return (
          <>
            {errorAlert}
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2 }}>
              <Box sx={panelStyles}>
                <DrawerSectionTitle
                  icon={<AssignmentIndRoundedIcon fontSize="small" />}
                  title="Asignación"
                  description="Define quién tendrá el artículo y desde qué fecha."
                />
                <TextField
                  select
                  name="resguardante"
                  label="Resguardante"
                  value={formData.resguardante}
                  onChange={handleChange}
                  required={formData.estado === "Asignado"}
                  disabled={loadingCatalogos || formData.estado !== "Asignado"}
                  helperText={
                    formData.estado === "Asignado"
                      ? "Obligatorio para artículos asignados"
                      : "Disponible únicamente con estado Asignado"
                  }
                  fullWidth
                  sx={{ ...drawerFieldStyles, gridColumn: "1 / -1" }}
                  slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}
                >
                  {usuarios.length > 0 ? (
                    usuarios.map((usuario) => (
                      <MenuItem key={usuario.id || usuario._id} value={usuario.id || usuario._id}>
                        {usuario.nombre || "Trabajador sin nombre"}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      {loadingCatalogos ? "Cargando trabajadores..." : "No hay trabajadores disponibles"}
                    </MenuItem>
                  )}
                </TextField>
                <TextField
                  name="fechaAsignacion"
                  label="Fecha de asignación"
                  type="date"
                  value={formData.fechaAsignacion}
                  onChange={handleChange}
                  fullWidth
                  sx={{ ...drawerFieldStyles, gridColumn: "1 / -1" }}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <DrawerSectionTitle
                  icon={<NotesRoundedIcon fontSize="small" />}
                  title="Observaciones"
                  description="Agrega cualquier detalle relevante."
                />
                <TextField
                  name="observaciones"
                  label="Observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ ...drawerFieldStyles, gridColumn: "1 / -1" }}
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.25,
                  p: 2,
                  border: "1px solid #dce8e7",
                  borderRadius: "16px",
                  bgcolor: "#f4f8f8",
                }}
              >
                <Typography sx={{ color: "#2d4445", fontSize: "0.9rem", fontWeight: 800 }}>
                  Resumen del artículo
                </Typography>
                {[
                  ["Inventario", formData.numeroInventario],
                  ["Categoría", categoria?.tipo || categoria?.descripcion || "—"],
                  ["Estado", formData.estado],
                  ["Localización", formData.localizacion],
                  ["Factura", formData.datosFactura],
                  ["Costo", `$${Number(formData.costo || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`],
                  ["Serie", formData.noSerie],
                  ["Resguardante", resguardante?.nombre || "No aplica"],
                ].map(([label, value]) => (
                  <Box
                    key={label}
                    sx={{ display: "flex", justifyContent: "space-between", gap: 2, pb: 1, borderBottom: "1px solid #e3ebea" }}
                  >
                    <Typography sx={{ color: "#7b898c", fontSize: "0.74rem" }}>{label}</Typography>
                    <Typography sx={{ color: "#344548", fontSize: "0.74rem", fontWeight: 700, textAlign: "right" }}>
                      {value || "—"}
                    </Typography>
                  </Box>
                ))}
                <Typography sx={{ color: "#849093", fontSize: "0.68rem", mt: "auto" }}>
                  El identificador interno se generará automáticamente como UUID versión 4 al guardar.
                </Typography>
              </Box>
            </Box>
          </>
        );
      },
    },
  ];

  return (
    <StepperDrawer
      open={open}
      onClose={handleClose}
      title="Agregar artículo"
      subtitle="Completa cada etapa para registrar el artículo en el inventario."
      icon={<AddBoxRoundedIcon />}
      steps={steps}
      onFinish={handleSubmit}
      finishLabel="Guardar artículo"
      disabled={loadingCatalogos}
      size="wide"
    />
  );
}
