"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Building2, CheckCircle2, FileDown, Handshake, PackageSearch, Trash2 } from "lucide-react";
import axios from "axios";
import { inventariosApi } from "@/src/services/axios";
import StepperDrawer, { DrawerStep } from "@/src/app/(authenticated)/componentsModal/drawersUI/WithStepperCenterDrawer";
import { DrawerSectionTitle, drawerDropdownMenuProps, drawerFieldStyles } from "@/src/app/(authenticated)/componentsModal/drawersUI/CenteredDrawer";

interface Props { controlledOpen?: boolean; onControlledClose?: () => void; hideLauncher?: boolean }

interface Usuario { _id?: string; id?: string; nombre?: string; activo?: boolean }
interface Categoria {
  _id?: string;
  id?: string;
  tipo?: string;
  descripcion?: string;
}

interface Articulo {
  _id: string;
  numeroInventario: string;
  descripcion?: string;
  noSerie?: string;
  categoria?: Categoria | string;
  resguardante?: Usuario | string;
}

const CATEGORIA_TRANSPORTE_ID = "0c63012a-e7a2-4239-b7ff-4c17fe9b38dc";
const esVehiculo = (articulo: Articulo) => {
  const categoria = articulo.categoria;
  const categoriaId = typeof categoria === "string" ? categoria : categoria?._id || categoria?.id;
  return categoriaId === CATEGORIA_TRANSPORTE_ID;
};
const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};

const categoriaNombre = (categoria: Articulo["categoria"]) =>
  typeof categoria === "object"
    ? categoria.tipo || categoria.descripcion || "Sin categoría"
    : "Sin categoría";

const getList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const data = (value as { data?: unknown; items?: unknown }).data ?? (value as { items?: unknown }).items;
  return Array.isArray(data) ? data as T[] : [];
};
export default function ResguardoExterno({ controlledOpen, onControlledClose, hideLauncher = false }: Props) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => { if (controlledOpen === undefined) setLocalOpen(value); else if (!value) onControlledClose?.(); };
  const [folio, setFolio] = useState("");
  const [fecha, setFecha] = useState(today());
  const [receptor, setReceptor] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Articulo[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [searching, setSearching] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nuevoResguardante, setNuevoResguardante] = useState("");

  useEffect(() => {
    if (!open || usuarios.length) return;
    const controller = new AbortController();
    inventariosApi.get("/usuarios", { params: { limit: 1000, fields: "nombre,activo" }, signal: controller.signal })
      .then((response) => setUsuarios(getList<Usuario>(response.data).filter((usuario) => usuario.activo === true)))
      .catch(() => { if (!controller.signal.aborted) setError("No fue posible cargar los empleados activos."); });
    return () => controller.abort();
  }, [open, usuarios.length]);
  useEffect(() => {
    const value = query.trim();
    if (!open || value.length < 2) {
      setOptions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await inventariosApi.get<{ data: Articulo[] }>("/articulos/buscar", {
          params: { q: value },
          signal: controller.signal,
        });
        setOptions(
          (response.data.data || []).filter(
            (option) => !esVehiculo(option) && !articulos.some((selected) => selected._id === option._id),
          ),
        );
      } catch {
        if (!controller.signal.aborted) setOptions([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, open, articulos]);

  const reset = () => {
    setFolio("");
    setFecha(today());
    setReceptor("");
    setComentarios("");
    setQuery("");
    setOptions([]);
    setArticulos([]);
    setError("");
  };

  const close = () => {
    if (downloading) return;
    setOpen(false);
    reset();
  };

  const responsableId = (value?: Usuario | string) => typeof value === "string" ? value : value?.id || value?._id || "";
  const responsableNombre = (value?: Usuario | string) => typeof value === "object" ? value.nombre || "Responsable actual" : "Responsable actual";
  const articulosConResponsable = articulos.filter((articulo) => responsableId(articulo.resguardante));
  const nuevoResponsable = usuarios.find((usuario) => (usuario.id || usuario._id) === nuevoResguardante);
  const download = async () => {
    if (!folio.trim() || !fecha || !receptor.trim() || articulos.length === 0) {
      setError("Completa folio, fecha, nombre del receptor y agrega al menos un artículo.");
      return;
    }

    setDownloading(true);
    setError("");
    try {
      const response = await inventariosApi.post(
        "/resguardos/externo/download",
        {
          folio: folio.trim(),
          fechaResguardo: fecha,
          resguardante: receptor.trim(),
          comentarios: comentarios.trim() || undefined,
          articlesIds: articulos.map((articulo) => articulo._id),
        },
        {
          responseType: "blob",
          timeout: 120000,
        },
      );

      if (nuevoResguardante && articulosConResponsable.length) {
        await inventariosApi.patch("/bulk/articulos", { articulos: articulosConResponsable.map((articulo) => articulo._id), change: { resguardante: nuevoResguardante } });
      }

      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      const safeFolio = folio.trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
      anchor.href = url;
      anchor.download = "Resguardo_externo_" + safeFolio + ".xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (requestError) {
      console.error(requestError);
      if (axios.isAxiosError(requestError) && requestError.response?.status === 422) {
        setError("Revisa los datos del resguardo. La API rechazó uno de los campos.");
      } else {
        setError("No fue posible generar el resguardo externo.");
      }
      return false;
    } finally {
      setDownloading(false);
    }
  };

  const validateGeneral = () => { if (folio.trim() && fecha && receptor.trim()) { setError(""); return true; } setError("Completa el folio, la fecha y el nombre de quien recibe."); return false; };
  const validateArticles = () => { if (articulos.length) { setError(""); return true; } setError("Agrega al menos un artículo al resguardo."); return false; };
  const articleList = <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: .9, maxHeight: 300, overflowY: "auto" }}>{!articulos.length ? <Typography sx={{ py: 4, color: "#90999e", fontSize: ".76rem", textAlign: "center" }}>Aún no has agregado artículos.</Typography> : articulos.map((articulo, index) => <Box key={articulo._id} sx={{ display: "grid", gridTemplateColumns: { xs: "32px minmax(0,1fr) 36px", sm: "36px minmax(0,1.5fr) minmax(110px,.8fr) minmax(110px,.8fr) 36px" }, gap: 1, alignItems: "center", p: 1.15, border: "1px solid #e3eaee", borderLeft: "4px solid #7da8c0", borderRadius: "12px", bgcolor: "#fbfdfe" }}><Typography sx={{ color: "#8b969b", fontSize: ".72rem", textAlign: "center" }}>{index + 1}</Typography><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "#34454c", fontSize: ".78rem", fontWeight: 750 }}>{articulo.numeroInventario}</Typography><Typography noWrap sx={{ color: "#879298", fontSize: ".68rem" }}>{articulo.descripcion || "Sin descripción"}</Typography></Box><Typography noWrap sx={{ display: { xs: "none", sm: "block" }, color: "#66757b", fontSize: ".7rem" }}>{categoriaNombre(articulo.categoria)}</Typography><Typography noWrap sx={{ display: { xs: "none", sm: "block" }, color: "#66757b", fontSize: ".7rem" }}>{articulo.noSerie || "Sin serie"}</Typography><Button color="error" onClick={() => setArticulos((current) => current.filter((item) => item._id !== articulo._id))}><Trash2 size={15} /></Button></Box>)}</Box>;
  const steps: DrawerStep[] = [
    { label: "Datos del préstamo", validate: validateGeneral, content: () => <>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, p: 2, bgcolor: "#fff", border: "1px solid #e4eaec", borderRadius: "16px" }}><DrawerSectionTitle icon={<Handshake size={18} />} title="Datos del préstamo" description="Identifica el documento y a quien recibe los bienes." /><TextField required label="Folio" value={folio} onChange={(e) => setFolio(e.target.value)} sx={drawerFieldStyles} /><TextField required label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} sx={drawerFieldStyles} slotProps={{ inputLabel: { shrink: true } }} /><TextField required label="Persona o empresa que recibe" value={receptor} onChange={(e) => setReceptor(e.target.value)} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /><TextField label="Comentarios opcionales" value={comentarios} onChange={(e) => setComentarios(e.target.value)} multiline minRows={3} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /></Box></> },
    { label: "Seleccionar bienes", validate: validateArticles, content: () => <>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box sx={{ p: 2, bgcolor: "#fff", border: "1px solid #e4eaec", borderRadius: "16px" }}><DrawerSectionTitle icon={<PackageSearch size={18} />} title="Bienes en préstamo" description="Busca y agrega los artículos que saldrán de la institución." /><Autocomplete options={options} loading={searching} filterOptions={(items) => items} inputValue={query} value={null} getOptionLabel={(o) => o.numeroInventario + " · " + (o.descripcion || "Sin descripción")} isOptionEqualToValue={(o,v) => o._id === v._id} onInputChange={(_,v) => setQuery(v)} onChange={(_,v) => { if (!v) return; setArticulos((current) => [...current,v]); setQuery(""); setOptions([]); setError(""); }} noOptionsText={query.trim().length < 2 ? "Escribe al menos dos caracteres" : "Sin coincidencias"} renderInput={(params) => <TextField {...params} placeholder="Buscar por inventario, serie o descripción" sx={{ ...drawerFieldStyles, mt: 1.5 }} />} />{articleList}</Box></> },
    { label: "Revisar", content: () => <Box sx={{ p: 2.5, border: "1px solid #dce8ec", borderRadius: "16px", bgcolor: "#f8fbfc" }}><DrawerSectionTitle icon={<CheckCircle2 size={18} />} title="Todo listo para generar" description="Confirma los datos antes de descargar el formato." /><Box sx={{ mt: 2, display: "grid", gap: 1 }}><Typography><b>Folio:</b> {folio}</Typography><Typography><b>Receptor:</b> {receptor}</Typography><Typography><b>Fecha:</b> {fecha}</Typography><Typography><b>Artículos:</b> {articulos.length}</Typography></Box>{articulosConResponsable.length > 0 && <Alert severity="warning" sx={{ mt: 2, borderRadius: "12px" }}><Typography sx={{ fontSize: ".76rem", fontWeight: 800, mb: .7 }}>{articulosConResponsable.length} artículo(s) ya tienen resguardante:</Typography>{articulosConResponsable.map((articulo) => <Typography key={articulo._id} sx={{ fontSize: ".72rem", mb: .25 }}><b>{articulo.numeroInventario}</b> tiene como resguardante a {responsableNombre(articulo.resguardante)}.</Typography>)}<TextField select fullWidth label="¿Quieres cambiarlo por? (opcional)" value={nuevoResguardante} onChange={(event) => setNuevoResguardante(event.target.value)} sx={{ ...drawerFieldStyles, mt: 1.5 }} slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}><MenuItem value="">Conservar responsable actual</MenuItem>{usuarios.map((usuario) => <MenuItem key={usuario.id || usuario._id} value={usuario.id || usuario._id}>{usuario.nombre}</MenuItem>)}</TextField>{nuevoResponsable && <Typography sx={{ mt: .8, fontSize: ".7rem" }}>Al finalizar se cambiará por <b>{nuevoResponsable.nombre}</b>.</Typography>}</Alert>}{articleList}</Box> },
  ];
  return <>{!hideLauncher && <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}><Typography sx={{ color: "#67757b", fontSize: ".72rem" }}>Genera el formato institucional para préstamos externos.</Typography><Button size="small" variant="contained" startIcon={<FileDown size={15} />} onClick={() => setOpen(true)} sx={{ bgcolor: "#5081A5", textTransform: "none" }}>Crear</Button></Box>}<StepperDrawer open={open} onClose={close} title="Resguardo externo" subtitle="Completa cada etapa para generar el préstamo institucional." icon={<Building2 size={22} />} steps={steps} onFinish={download} finishLabel="Generar y descargar" disabled={downloading} size="wide" /></>;
}











