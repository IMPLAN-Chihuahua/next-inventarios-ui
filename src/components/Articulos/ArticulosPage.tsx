"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Autocomplete, Avatar, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Drawer, IconButton, InputAdornment, Menu, MenuItem,
  Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { Archive, Boxes, CarFront, ChevronDown, ChevronRight, Edit3, FileSpreadsheet, FilterX, History, MoreHorizontal, Plus, QrCode, Search, SlidersHorizontal, Table2, UserRoundCog, X } from "lucide-react";
import { inventariosApi } from "@/src/services/axios";
import axios from "axios";
import AgregarArticuloDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/AgregarArticuloDrawer";
import AgregarVehiculoDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/AgregarVehiculoDrawer";
import ImprimirEtiquetasDrawer from "@/src/app/(authenticated)/componentsModal/drawersUI/general/ImprimirEtiquetasDrawer";
import ImportarExcel from "@/src/components/Dashboard/ImportarExcel";
import CapturaRapida from "@/src/components/Dashboard/CapturaRapida";
import { useEstados } from "@/src/hooks/useEstados";
import { drawerFieldStyles, drawerPrimaryButtonStyles, drawerSecondaryButtonStyles } from "@/src/app/(authenticated)/componentsModal/drawersUI/CenteredDrawer";

interface Catalogo { _id?: string; id?: string; nombre?: string; tipo?: string; activo?: boolean }
interface Articulo {
  _id: string; numeroInventario: string; descripcion?: string; noSerie?: string; estado: string;
  localizacion?: string; marca?: string; modelo?: string; costo?: number; observaciones?: string;
  categoria?: Catalogo | string; resguardante?: Catalogo | string; fechaAlta?: string; fechaAsignacion?: string;
  datosFactura?: string; fechaFactura?: string; valorLibros?: string; tipoEnergia?: string; capacidadCombustible?: number;
}
interface EditData { numeroInventario: string; descripcion: string; noSerie: string; marca: string; modelo: string; categoria: string; estado: string; resguardante: string; localizacion: string; costo: string; datosFactura: string; fechaFactura: string; fechaAsignacion: string; observaciones: string; tipoEnergia: string; capacidadCombustible: string }
const ESTADOS_BASE = ["Asignado", "Baja", "Donado", "Dictaminar", "Dictaminado"];
const LOCALIZACIONES = ["Área técnica", "Site", "Lactario", "Cocina", "Jurídico", "Sala Dr. Ríos", "Sala capacitaciones", "Dirección", "Subdirección", "Administrativo"];
const normalizeEstado = (value?: string) => ESTADOS_BASE.find((estado) => estado.toLocaleLowerCase("es-MX") === (value || "").toLocaleLowerCase("es-MX")) || value || "";
const objectId = (value?: Catalogo | string | null) => typeof value === "string" ? value : value?._id || value?.id || "";
const inputDate = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : "";
const inventoryFormat = (value: string) => { const digits = value.replace(/\D/g, "").slice(0, 11); return digits.length > 10 ? `${digits.slice(0, 10)}-${digits.slice(10)}` : digits; };
const toEditData = (row: Articulo): EditData => ({ numeroInventario: row.numeroInventario || "", descripcion: row.descripcion || "", noSerie: row.noSerie || "", marca: row.marca || "", modelo: row.modelo || "", categoria: objectId(row.categoria), estado: normalizeEstado(row.estado), resguardante: objectId(row.resguardante), localizacion: row.localizacion || "", costo: row.costo?.toString() || "", datosFactura: row.datosFactura || "", fechaFactura: inputDate(row.fechaFactura), fechaAsignacion: inputDate(row.fechaAsignacion), observaciones: row.observaciones || "", tipoEnergia: row.tipoEnergia || "", capacidadCombustible: row.capacidadCombustible?.toString() || "" });interface ApiResponse { data: Articulo[]; pagination: { total: number; totalPages: number; page: number; limit: number } }
const list = <T,>(value: unknown): T[] => { if (Array.isArray(value)) return value as T[]; if (!value || typeof value !== "object") return []; const data = value as { data?: unknown; items?: unknown }; return Array.isArray(data.data ?? data.items) ? (data.data ?? data.items) as T[] : []; };
const label = (value?: Catalogo | string | null, key: "nombre" | "tipo" = "nombre") => value && typeof value === "object" ? value[key] || "—" : "—";
const statusColor = (estado: string) => ({ Asignado: ["#e8f2f1", "#467a77"], Baja: ["#fae9e7", "#b55a51"], Donado: ["#edf0f6", "#637294"], Dictaminar: ["#fff3dd", "#a77424"], Dictaminado: ["#eee9f5", "#765c92"] }[estado] || ["#eef1f2", "#66757b"]);
const EDIT_FIELD_LABELS: Record<keyof EditData, string> = {
  numeroInventario: "Número de inventario", descripcion: "Descripción", noSerie: "Número de serie",
  marca: "Marca", modelo: "Modelo", categoria: "Categoría", estado: "Estado",
  resguardante: "Resguardante", localizacion: "Localización", costo: "Costo",
  datosFactura: "Datos de factura", fechaFactura: "Fecha de factura",
  fechaAsignacion: "Fecha de asignación", observaciones: "Observaciones",
  tipoEnergia: "Tipo de energía", capacidadCombustible: "Capacidad del tanque"
};

interface HistoricoArticulo {
  _id: string; accion: "CREATE" | "UPDATE"; usuario?: Catalogo | string;
  valorAntiguo?: unknown; valorNuevo?: unknown; createdAt?: string;
}
const HISTORY_LABELS: Record<string, string> = {
  numeroInventario: "Número de inventario", descripcion: "Descripción", noSerie: "Número de serie",
  marca: "Marca", modelo: "Modelo", categoria: "Categoría", estado: "Estado", resguardante: "Resguardante",
  localizacion: "Localización", costo: "Costo", datosFactura: "Datos de factura", fechaFactura: "Fecha de factura",
  fechaAsignacion: "Fecha de asignación", observaciones: "Observaciones", tipoEnergia: "Tipo de energía",
  capacidadCombustible: "Capacidad del tanque"
};
const historyValueForArticle = (value: unknown, articleId: string): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return (value.find((item) => item && typeof item === "object" && (item as Record<string, unknown>)._id === articleId) as Record<string, unknown>) || null;
  const record = value as Record<string, unknown>;
  if (record._id === articleId) return record;
  return historyValueForArticle(record.data, articleId);
};
const readableHistoryValue = (value: unknown) => {
  if (value == null || value === "") return "—";
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return String(record.nombre || record.tipo || record.numeroInventario || record._id || "Dato actualizado");
  }
  return String(value);
};
function ArticleHistory({ articleId }: { articleId: string }) {
  const [items, setItems] = useState<HistoricoArticulo[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  useEffect(() => {
    let active = true;
    setLoadingHistory(true); setHistoryError("");
    inventariosApi.get(`/historicos/articulo/${articleId}`).then((response) => {
      if (active) setItems(list<HistoricoArticulo>(response.data));
    }).catch(() => { if (active) setHistoryError("No fue posible cargar el historial del artículo."); })
      .finally(() => { if (active) setLoadingHistory(false); });
    return () => { active = false; };
  }, [articleId]);
  if (loadingHistory) return <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress size={26} /></Box>;
  if (historyError) return <Alert severity="error" sx={{ borderRadius: "11px" }}>{historyError}</Alert>;
  if (!items.length) return <Box sx={{ py: 8, textAlign: "center", color: "#879295" }}><History size={32} /><Typography sx={{ mt: 1, fontSize: ".8rem" }}>Todavía no hay movimientos registrados.</Typography></Box>;
  return <Box sx={{ display: "grid", gap: 1.4 }}>{items.map((item) => {
    const previous = historyValueForArticle(item.valorAntiguo, articleId) || {};
    const current = historyValueForArticle(item.valorNuevo, articleId) || {};
    const fields = item.accion === "CREATE" ? [] : Object.keys(current).filter((field) => !["_id", "createdAt", "updatedAt", "__v"].includes(field) && JSON.stringify(previous[field]) !== JSON.stringify(current[field]));
    return <Box key={item._id} sx={{ position: "relative", pl: 2.6, pb: .4, "&:before": { content: '""', position: "absolute", left: "5px", top: "8px", bottom: "-14px", width: "1px", bgcolor: "#cbdcda" }, "&:last-of-type:before": { bottom: "50%" } }}><Box sx={{ position: "absolute", left: 0, top: 5, width: 11, height: 11, borderRadius: "50%", bgcolor: item.accion === "CREATE" ? "#5081a5" : "#467a77", boxShadow: "0 0 0 4px #eef5f4" }} /><Box sx={{ p: 1.6, border: "1px solid #e1e9e8", borderRadius: "13px", bgcolor: "#fff", boxShadow: "0 3px 12px rgba(48,72,73,.045)" }}><Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mb: fields.length ? 1 : 0 }}><Box><Typography sx={{ fontSize: ".78rem", fontWeight: 800, color: "#34454c" }}>{item.accion === "CREATE" ? "Artículo registrado" : "Artículo actualizado"}</Typography><Typography sx={{ fontSize: ".67rem", color: "#7f8b8e" }}>Por {label(item.usuario)}</Typography></Box><Typography sx={{ flexShrink: 0, fontSize: ".65rem", color: "#8b9699" }}>{item.createdAt ? new Date(item.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" }) : "Registro anterior"}</Typography></Box>{fields.map((field) => <Box key={field} sx={{ py: .65, borderTop: "1px solid #edf1f1" }}><Typography sx={{ fontSize: ".65rem", color: "#748185", fontWeight: 750 }}>{HISTORY_LABELS[field] || field}</Typography><Typography sx={{ mt: .2, fontSize: ".72rem", color: "#4d5b60" }}><span style={{ color: "#a06b65" }}>{readableHistoryValue(previous[field])}</span> → <b style={{ color: "#467a77" }}>{readableHistoryValue(current[field])}</b></Typography></Box>)}</Box></Box>;
  })}</Box>;
}
export default function ArticulosPage() {
  const ESTADOS = useEstados();
  const [rows, setRows] = useState<Articulo[]>([]); const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0); const [limit, setLimit] = useState(25); const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("fechaAlta"); const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [query, setQuery] = useState(""); const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoria, setCategoria] = useState(""); const [estado, setEstado] = useState(""); const [resguardante, setResguardante] = useState("");
  const [categorias, setCategorias] = useState<Catalogo[]>([]); const [usuarios, setUsuarios] = useState<Catalogo[]>([]);
  const [selected, setSelected] = useState<string[]>([]); const [detail, setDetail] = useState<Articulo | null>(null);
  const [editing, setEditing] = useState(false); const [detailTab, setDetailTab] = useState<"informacion" | "historial">("informacion"); const [editData, setEditData] = useState<EditData>(() => toEditData({ _id: "", numeroInventario: "", estado: "" })); const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null); const [menuRow, setMenuRow] = useState<Articulo | null>(null);
  const [addOpen, setAddOpen] = useState(false); const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refresh, setRefresh] = useState(0); const [saving, setSaving] = useState(false);
  const [manageOpen, setManageOpen] = useState(false); const [confirmStateOpen, setConfirmStateOpen] = useState(false); const [bulkMode, setBulkMode] = useState<"resguardante" | "categoria" | "estado">("resguardante"); const [bulkValue, setBulkValue] = useState("");
  const [stateOnlyMode, setStateOnlyMode] = useState(false);
  const [multiAnchor, setMultiAnchor] = useState<HTMLElement | null>(null); const [excelOpen, setExcelOpen] = useState(false); const [quickOpen, setQuickOpen] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false); const [qrOpen, setQrOpen] = useState(false);
  const [descriptionSortAnchor, setDescriptionSortAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("articulos_preseleccionados");
    if (!stored) return;
    try {
      const selection = JSON.parse(stored) as { ids?: string[]; categoria?: string; estado?: string };
      if (Array.isArray(selection.ids)) setSelected(selection.ids);
      if (selection.categoria) setCategoria(selection.categoria);
      if (selection.estado) setEstado(selection.estado);
      setPage(0);
    } finally {
      window.sessionStorage.removeItem("articulos_preseleccionados");
    }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedQuery(query.trim()); setPage(0); }, 350); return () => window.clearTimeout(timer); }, [query]);
  useEffect(() => { void Promise.all([
    inventariosApi.get("/categorias", { params: { limit: 1000, fields: "tipo" } }).then((r) => setCategorias(list<Catalogo>(r.data))),
    inventariosApi.get("/usuarios", { params: { limit: 1000, fields: "nombre,activo" } }).then((r) => setUsuarios(list<Catalogo>(r.data).filter((u) => u.activo === true))),
  ]).catch(() => setMessage({ type: "error", text: "No fue posible cargar los filtros." })); }, []);

  const load = useCallback(async () => { setLoading(true); try { const response = await inventariosApi.get<ApiResponse>("/articulos", { params: { page: page + 1, limit, ...(debouncedQuery && { q: debouncedQuery }), ...(categoria && { categorias: categoria }), ...(estado && { estados: estado }), ...(resguardante && { resguardantes: resguardante }), sortBy, sortOrder } }); setRows((response.data.data || []).map((articulo) => ({ ...articulo, estado: normalizeEstado(articulo.estado) }))); setTotal(response.data.pagination?.total || 0); setSelected([]); } catch { setRows([]); setMessage({ type: "error", text: "No fue posible cargar los artículos." }); } finally { setLoading(false); } }, [page, limit, debouncedQuery, categoria, estado, resguardante, sortBy, sortOrder, refresh]);
  useEffect(() => { void load(); }, [load]);

  const openMenu = (event: React.MouseEvent<HTMLElement>, row: Articulo) => { setAnchor(event.currentTarget); setMenuRow(row); };
  const openDetail = (row: Articulo) => { setDetail(row); setEditData(toEditData(row)); setEditing(false); setDetailTab("informacion"); setAnchor(null); };
  const openHistory = (row: Articulo) => { setDetail(row); setEditData(toEditData(row)); setEditing(false); setDetailTab("historial"); setAnchor(null); };
  const categoriaEsVehiculo = (categoriaId: string) => { const tipo = categorias.find((item) => (item.id || item._id) === categoriaId)?.tipo || ""; return tipo.toLocaleLowerCase("es-MX").includes("vehícul") || tipo.toLocaleLowerCase("es-MX").includes("vehicul"); };
  const changedFields = detail ? (Object.keys(editData) as Array<keyof EditData>).filter((field) => editData[field] !== toEditData(detail)[field]) : [];
  const displayEditValue = (field: keyof EditData, value: string) => {
    if (!value) return "—";
    if (field === "categoria") return categorias.find((item) => (item.id || item._id) === value)?.tipo || value;
    if (field === "resguardante") return usuarios.find((item) => (item.id || item._id) === value)?.nombre || value;
    if (field === "costo") return Number.isFinite(Number(value)) ? Number(value).toLocaleString("es-MX", { style: "currency", currency: "MXN" }) : value;
    if (field === "capacidadCombustible") return `${value} litros`;
    return value;
  };
  const requestEditConfirmation = () => {
    if (!editData.numeroInventario.trim()) return setMessage({ type: "error", text: "El número de inventario no puede estar vacío." });
    if (!editData.categoria) return setMessage({ type: "error", text: "Selecciona una categoría." });
    if (!editData.estado) return setMessage({ type: "error", text: "Selecciona un estado." });
    if (editData.estado === "Asignado" && !editData.resguardante) return setMessage({ type: "error", text: "Selecciona un resguardante para el estado Asignado." });
    if (editData.costo && (!Number.isFinite(Number(editData.costo)) || Number(editData.costo) < 0)) return setMessage({ type: "error", text: "Ingresa un costo válido." });
    if (editData.tipoEnergia === "Gasolina" && (!editData.capacidadCombustible || Number(editData.capacidadCombustible) < 1 || Number(editData.capacidadCombustible) > 120)) return setMessage({ type: "error", text: "La capacidad del tanque debe estar entre 1 y 120 litros." });
    setMessage(null);
    setConfirmEditOpen(true);
  };
  const updateArticle = async () => { if (!detail || !changedFields.length) return; setSaving(true); try { const payload: Record<string, string | number | null> = {}; changedFields.forEach((field) => { const value = editData[field].trim(); if (field === "costo" || field === "capacidadCombustible") { if (value) payload[field] = Number(value); } else if (value) payload[field] = value; }); if (editData.estado === "Asignado") { if (!editData.resguardante) throw new Error("Selecciona un resguardante para el estado Asignado"); payload.resguardante = editData.resguardante; } await inventariosApi.patch(`/articulos/${detail._id}`, payload); setMessage({ type: "success", text: "Artículo actualizado correctamente." }); setConfirmEditOpen(false); setEditing(false); setDetail(null); setRefresh((v) => v + 1); } catch (requestError) { const data = axios.isAxiosError(requestError) ? requestError.response?.data as { message?: string; errors?: string[] } | undefined : undefined; setMessage({ type: "error", text: data?.message || data?.errors?.join(" · ") || (requestError instanceof Error ? requestError.message : "No fue posible actualizar el artículo.") }); setConfirmEditOpen(false); } finally { setSaving(false); } };  const markAsBaja = async (ids: string[]) => { if (!ids.length || !window.confirm(`¿Marcar ${ids.length} artículo(s) como Baja?`)) return; setSaving(true); try { await inventariosApi.patch("/bulk/articulos", { articulos: ids, change: { estado: "Baja" } }); setMessage({ type: "success", text: "Los artículos fueron marcados como Baja." }); setAnchor(null); setDetail(null); setRefresh((v) => v + 1); } catch { setMessage({ type: "error", text: "No fue posible actualizar los artículos." }); } finally { setSaving(false); } };
  const applyBulkChange = async () => {
    if (!selected.length || !bulkValue) return;
    setSaving(true);
    try {
      const change = bulkMode === "resguardante" ? { resguardante: bulkValue } : bulkMode === "categoria" ? { categoria: bulkValue } : { estado: bulkValue };
      const response = await inventariosApi.patch<{ message?: string }>("/bulk/articulos", { articulos: selected, change });
      setMessage({ type: "success", text: response.data?.message || (bulkMode === "resguardante" ? "El resguardante fue actualizado correctamente." : bulkMode === "categoria" ? "La categoría fue actualizada correctamente." : "El estado fue actualizado correctamente.") });
      setManageOpen(false); setStateOnlyMode(false); setBulkValue(""); setSelected([]); setRefresh((v) => v + 1);
    } catch (requestError) {
      const data = axios.isAxiosError(requestError) ? requestError.response?.data as { message?: string; errors?: string[] } | undefined : undefined;
      setMessage({ type: "error", text: data?.message || data?.errors?.join(" · ") || "No fue posible actualizar los artículos seleccionados." });
    } finally { setSaving(false); }
  };
  const clearFilters = () => { setQuery(""); setCategoria(""); setEstado(""); setResguardante(""); setPage(0); };
  const allSelected = rows.length > 0 && rows.every((row) => selected.includes(row._id));
  const selectedArticles = useMemo(() => rows.filter((row) => selected.includes(row._id)), [rows, selected]);

  return <Box sx={{ minHeight: "calc(100vh - 88px)", bgcolor: "#f6f8f8", pt: { xs: 2.5, md: 3 }, pb: 5, px: { xs: 2, md: 4 } }}><Box sx={{ maxWidth: 1500, mx: "auto" }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
  <Box sx={{ display: "flex", alignItems: "center" }}>

    <Box>
      <Typography sx={{ color: "#7b888b", fontSize: ".65rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", lineHeight: 1 }}>Control patrimonial</Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mt: .45 }}><Typography component="h1" sx={{ color: "#263538", fontWeight: 800, fontSize: { xs: "1.2rem", md: "1.42rem" }, letterSpacing: "-.025em", lineHeight: 1.2 }}>Artículos del inventario</Typography><Chip size="small" label={`${total.toLocaleString("es-MX")} registrados`} sx={{ height: 23, bgcolor: "#eef2f2", color: "#667477", fontSize: ".65rem", fontWeight: 700 }} /></Box>
    </Box>
  </Box>
  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
  <Button variant="contained" size="small" startIcon={<Plus size={16} />} onClick={() => setAddOpen(true)} sx={{ ...drawerPrimaryButtonStyles, minHeight: 40, px: 2.25, boxShadow: "0 6px 14px rgba(70,122,119,.18)" }}>Agregar artículo</Button>
  <Button variant="outlined" size="small" startIcon={<CarFront size={16} />} onClick={() => setVehicleOpen(true)} sx={{ minHeight: 40, px: 2, borderRadius: "11px", borderColor: "#a9bfc5", color: "#406f8d", bgcolor: "#fff", textTransform: "none", fontWeight: 700, "&:hover": { borderColor: "#5081a5", bgcolor: "#f3f8fa" } }}>Agregar vehículo</Button>
  <Button variant="outlined" size="small" endIcon={<ChevronDown size={16} />} onClick={(event) => setMultiAnchor(event.currentTarget)} sx={{ minHeight: 40, px: 2, borderRadius: "11px", borderColor: "#b9c9ca", color: "#467a77", bgcolor: "#fff", textTransform: "none", fontWeight: 700, "&:hover": { borderColor: "#709c99", bgcolor: "#f4f8f8" } }}>Agregar múltiples artículos</Button>
</Box>
</Box>
    {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2, borderRadius: "12px" }}>{message.text}</Alert>}
    <Paper elevation={0} sx={{ border: "1px solid #e0e7e8", borderRadius: "18px", overflow: "hidden" }}>
      <Box sx={{ p: 2, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(260px,1.5fr) repeat(3,minmax(150px,.7fr)) auto" }, gap: 1.2, bgcolor: "#fbfcfc", borderBottom: "1px solid #e7ecec" }}>
        <TextField size="small" placeholder="Buscar por inventario, serie o descripción" value={query} onChange={(e) => setQuery(e.target.value)} sx={drawerFieldStyles} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={17} /></InputAdornment> } }} />
        <Select size="small" displayEmpty value={estado} onChange={(e) => { setEstado(e.target.value); setPage(0); }} sx={{ ...drawerFieldStyles, bgcolor: "#fff" }}><MenuItem value="">Todos los estados</MenuItem>{ESTADOS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</Select>
        <Select size="small" displayEmpty value={categoria} onChange={(e) => { setCategoria(e.target.value); setPage(0); }} sx={{ ...drawerFieldStyles, bgcolor: "#fff" }}><MenuItem value="">Todas las categorías</MenuItem>{categorias.map((v) => <MenuItem key={v.id || v._id} value={v.id || v._id}>{v.tipo}</MenuItem>)}</Select>
        <Select size="small" displayEmpty value={resguardante} onChange={(e) => { setResguardante(e.target.value); setPage(0); }} sx={{ ...drawerFieldStyles, bgcolor: "#fff" }}><MenuItem value="">Todos los resguardantes</MenuItem>{usuarios.map((v) => <MenuItem key={v.id || v._id} value={v.id || v._id}>{v.nombre}</MenuItem>)}</Select>
        
        <Tooltip title="Limpiar filtros"><IconButton onClick={clearFilters} sx={{ border: "1px solid #dfe6e7", borderRadius: "10px" }}><FilterX size={18} /></IconButton></Tooltip>
      </Box>
      {selected.length > 0 && <Box sx={{ px: 2, py: 1.2, display: "flex", alignItems: "center", gap: 2, bgcolor: "#edf5f4", borderBottom: "1px solid #dce8e7" }}><Typography sx={{ fontSize: ".8rem", fontWeight: 750, color: "#467a77" }}>{selected.length} seleccionados</Typography><Button size="small" variant="contained" startIcon={<SlidersHorizontal size={15} />} onClick={() => { setStateOnlyMode(false); setBulkMode("resguardante"); setBulkValue(""); setManageOpen(true); }} sx={{ bgcolor: "#467a77", boxShadow: "none", textTransform: "none", "&:hover": { bgcolor: "#385f5d", boxShadow: "none" } }}>Gestionar selección</Button><Button size="small" variant="outlined" startIcon={<QrCode size={15} />} onClick={() => setQrOpen(true)} sx={{ borderColor: "#7ea5a2", color: "#467a77", bgcolor: "#fff", textTransform: "none", fontWeight: 750, "&:hover": { borderColor: "#467a77", bgcolor: "#f7fbfa" } }}>Imprimir etiquetas QR</Button></Box>}
      <TableContainer sx={{ minHeight: 430 }}><Table stickyHeader><TableHead><TableRow>{["", "N.º de inventario", "Descripción", "Categoría", "Estado", "Resguardante", "Localización", ""].map((h, i) => <TableCell key={i} sx={{ bgcolor: "#f3f6f6", color: "#697679", fontSize: ".69rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>{i === 0 ? <Checkbox size="small" checked={allSelected} indeterminate={selected.length > 0 && !allSelected} onChange={() => setSelected(allSelected ? [] : rows.map((r) => r._id))} /> : i === 2 ? <Button size="small" endIcon={<ChevronDown size={14} />} onClick={(event) => setDescriptionSortAnchor(event.currentTarget)} sx={{ minWidth: 0, p: 0, color: "#697679", fontSize: ".69rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>Descripción</Button> : h}</TableCell>)}</TableRow></TableHead><TableBody>
        {loading ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><CircularProgress size={28} /></TableCell></TableRow> : !rows.length ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 10 }}><Boxes size={36} color="#aab5b7" /><Typography sx={{ mt: 1, color: "#7d898c" }}>No se encontraron artículos</Typography></TableCell></TableRow> : rows.map((row) => { const colors = statusColor(row.estado); const name = label(row.resguardante); return <TableRow hover key={row._id} onDoubleClick={() => openDetail(row)} sx={{ cursor: "pointer", "& td": { borderColor: "#edf0f1" } }}><TableCell><Checkbox size="small" checked={selected.includes(row._id)} onChange={() => setSelected((current) => current.includes(row._id) ? current.filter((id) => id !== row._id) : [...current, row._id])} /></TableCell><TableCell><Typography sx={{ fontSize: ".79rem", fontWeight: 800, color: "#34454c" }}>{row.numeroInventario}</Typography><Typography sx={{ fontSize: ".67rem", color: "#899499" }}>{row.noSerie || "Sin serie"}</Typography></TableCell><TableCell sx={{ maxWidth: 260 }}><Typography noWrap sx={{ fontSize: ".77rem", color: "#435156" }}>{row.descripcion || "Sin descripción"}</Typography></TableCell><TableCell sx={{ fontSize: ".75rem" }}>{label(row.categoria, "tipo")}</TableCell><TableCell><Chip size="small" label={row.estado} sx={{ bgcolor: colors[0], color: colors[1], fontWeight: 750, fontSize: ".68rem" }} /></TableCell><TableCell><Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Avatar sx={{ width: 27, height: 27, bgcolor: name === "—" ? "#dfe5e6" : "#e8f0eb", color: "#467a77", fontSize: ".67rem" }}>{name === "—" ? "–" : name.slice(0, 1)}</Avatar><Typography noWrap sx={{ maxWidth: 150, fontSize: ".74rem" }}>{name}</Typography></Box></TableCell><TableCell sx={{ fontSize: ".74rem" }}>{row.localizacion || "—"}</TableCell><TableCell><IconButton size="small" onClick={(e) => openMenu(e, row)}><MoreHorizontal size={18} /></IconButton></TableCell></TableRow>; })}
      </TableBody></Table></TableContainer><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, alignItems: "center", gap: 2, px: 2, py: 1.5, borderTop: "1px solid #e7ecec", bgcolor: "#fff" }}>
  <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: { xs: "center", md: "flex-start" } }}>
    <Select size="small" value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(0); }} sx={{ minWidth: 126, height: 34, borderRadius: "9px", bgcolor: "#fff", fontSize: ".72rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#dfe5e7" } }}>
      {[10, 25, 50, 100].map((value) => <MenuItem key={value} value={value}>{value} artículos</MenuItem>)}
    </Select>
    <Typography sx={{ color: "#8a9598", fontSize: ".7rem" }}>{total ? `${page * limit + 1}–${Math.min((page + 1) * limit, total)} de ${total}` : "0 artículos"}</Typography>
  </Box>
  <Pagination count={Math.max(1, Math.ceil(total / limit))} page={page + 1} onChange={(_, value) => setPage(value - 1)} siblingCount={1} boundaryCount={1} hidePrevButton hideNextButton shape="rounded" sx={{ justifySelf: "center", "& .MuiPagination-ul": { flexWrap: "nowrap" }, "& .MuiPaginationItem-root": { minWidth: 32, height: 32, borderRadius: "8px", color: "#526064", fontSize: ".73rem", fontWeight: 650 }, "& .Mui-selected": { bgcolor: "#eef3f3 !important", color: "#26383a", fontWeight: 850 } }} />
  <Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" }, gap: 1 }}>
    <Button variant="outlined" disabled={page === 0 || loading} onClick={() => setPage((value) => Math.max(0, value - 1))} sx={{ minHeight: 34, borderRadius: "9px", borderColor: "#dfe5e7", color: "#455357", textTransform: "none", fontSize: ".72rem" }}>‹&nbsp; Anterior</Button>
    <Button variant="outlined" disabled={page + 1 >= Math.ceil(total / limit) || loading} onClick={() => setPage((value) => value + 1)} sx={{ minHeight: 34, borderRadius: "9px", borderColor: "#dfe5e7", color: "#455357", textTransform: "none", fontSize: ".72rem" }}>Siguiente&nbsp; ›</Button>
  </Box>
</Box>
    </Paper>
  </Box>
  <Menu anchorEl={descriptionSortAnchor} open={Boolean(descriptionSortAnchor)} onClose={() => setDescriptionSortAnchor(null)} slotProps={{ paper: { sx: { mt: .7, minWidth: 155, p: .5, borderRadius: "11px", border: "1px solid #e1e7e8" } } }}><MenuItem selected={sortBy === "descripcion" && sortOrder === "asc"} onClick={() => { setSortBy("descripcion"); setSortOrder("asc"); setPage(0); setDescriptionSortAnchor(null); }} sx={{ borderRadius: "8px", fontSize: ".76rem" }}>Ordenar A–Z</MenuItem><MenuItem selected={sortBy === "descripcion" && sortOrder === "desc"} onClick={() => { setSortBy("descripcion"); setSortOrder("desc"); setPage(0); setDescriptionSortAnchor(null); }} sx={{ borderRadius: "8px", fontSize: ".76rem" }}>Ordenar Z–A</MenuItem><MenuItem onClick={() => { setSortBy("fechaAlta"); setSortOrder("desc"); setPage(0); setDescriptionSortAnchor(null); }} sx={{ borderRadius: "8px", fontSize: ".76rem", color: "#6f7b7e" }}>Restablecer recientes</MenuItem></Menu>
  <Menu anchorEl={multiAnchor} open={Boolean(multiAnchor)} onClose={() => setMultiAnchor(null)} slotProps={{ paper: { sx: { mt: 1, minWidth: 245, p: .75, borderRadius: "13px", border: "1px solid #e1e8e8", boxShadow: "0 14px 35px rgba(31,49,51,.15)" } } }}>
    <MenuItem onClick={() => { setMultiAnchor(null); setExcelOpen(true); }} sx={{ gap: 1.2, borderRadius: "9px", py: 1.1 }}><FileSpreadsheet size={18} color="#467a77" /><Box><Typography sx={{ fontSize: ".8rem", fontWeight: 750 }}>Desde Excel</Typography><Typography sx={{ fontSize: ".67rem", color: "#849093" }}>Importar un archivo .xlsx</Typography></Box></MenuItem>
    <MenuItem onClick={() => { setMultiAnchor(null); setQuickOpen(true); }} sx={{ gap: 1.2, borderRadius: "9px", py: 1.1 }}><Table2 size={18} color="#5081a5" /><Box><Typography sx={{ fontSize: ".8rem", fontWeight: 750 }}>Desde tabla</Typography><Typography sx={{ fontSize: ".67rem", color: "#849093" }}>Capturar varias filas manualmente</Typography></Box></MenuItem>
  </Menu>
  <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={() => menuRow && openDetail(menuRow)}><ChevronRight size={16} />&nbsp; Ver detalles</MenuItem><MenuItem onClick={() => menuRow && openHistory(menuRow)}><History size={16} />&nbsp; Historial</MenuItem><MenuItem onClick={() => { if (menuRow) { openDetail(menuRow); setEditing(true); } }}><Edit3 size={16} />&nbsp; Editar</MenuItem><MenuItem onClick={() => { if (!menuRow) return; setSelected([menuRow._id]); setStateOnlyMode(true); setBulkMode("estado"); setBulkValue(normalizeEstado(menuRow.estado)); setAnchor(null); setManageOpen(true); }} sx={{ color: "#b55a51" }}><Archive size={16} />&nbsp; Cambiar estado</MenuItem></Menu>
  <Drawer anchor="right" open={Boolean(detail)} onClose={() => { setDetail(null); setEditing(false); }} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 480 }, p: 3 } } }}>{detail && <><Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}><Box><Typography sx={{ fontWeight: 850, fontSize: "1.2rem" }}>{editing ? "Editar artículo" : detailTab === "historial" ? "Historial del artículo" : "Detalle del artículo"}</Typography><Typography sx={{ color: "#758286", fontSize: ".76rem" }}>{detail.numeroInventario}</Typography></Box><IconButton onClick={() => setDetail(null)}><X /></IconButton></Box>{!editing && detailTab === "historial" ? <ArticleHistory articleId={detail._id} /> : editing ? <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.5 }}>
<TextField label="Número de inventario" value={editData.numeroInventario} onChange={(e) => setEditData({ ...editData, numeroInventario: e.target.value })} sx={drawerFieldStyles} /><TextField label="Número de serie" value={editData.noSerie} onChange={(e) => setEditData({ ...editData, noSerie: e.target.value })} sx={drawerFieldStyles} />
<TextField label="Descripción" value={editData.descripcion} onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /><TextField label="Marca" value={editData.marca} onChange={(e) => setEditData({ ...editData, marca: e.target.value })} sx={drawerFieldStyles} /><TextField label="Modelo" value={editData.modelo} onChange={(e) => setEditData({ ...editData, modelo: e.target.value })} sx={drawerFieldStyles} />
<TextField select label="Categoría" value={editData.categoria} onChange={(e) => { const categoria = e.target.value; setEditData({ ...editData, categoria, ...(!categoriaEsVehiculo(categoria) ? { tipoEnergia: "", capacidadCombustible: "" } : {}) }); }} sx={drawerFieldStyles}>{categorias.map((v) => <MenuItem key={v.id || v._id} value={v.id || v._id}>{v.tipo}</MenuItem>)}</TextField><TextField select label="Estado" value={editData.estado} onChange={(e) => setEditData({ ...editData, estado: e.target.value, ...(e.target.value !== "Asignado" ? { resguardante: "" } : {}) })} sx={drawerFieldStyles}>{ESTADOS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
{editData.estado === "Asignado" && <TextField select label="Resguardante" value={editData.resguardante} onChange={(e) => setEditData({ ...editData, resguardante: e.target.value })} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }}>{usuarios.map((v) => <MenuItem key={v.id || v._id} value={v.id || v._id}>{v.nombre}</MenuItem>)}</TextField>}
<Autocomplete freeSolo options={LOCALIZACIONES} value={editData.localizacion} onChange={(_, value) => setEditData({ ...editData, localizacion: value || "" })} onInputChange={(_, value) => setEditData((current) => ({ ...current, localizacion: value }))} renderInput={(params) => <TextField {...params} label="Localización" sx={drawerFieldStyles} />} /><TextField type="number" label="Costo" value={editData.costo} onChange={(e) => setEditData({ ...editData, costo: e.target.value })} sx={drawerFieldStyles} /><TextField label="Datos de factura" value={editData.datosFactura} onChange={(e) => setEditData({ ...editData, datosFactura: e.target.value })} sx={drawerFieldStyles} />
<TextField type="date" label="Fecha de factura" value={editData.fechaFactura} onChange={(e) => setEditData({ ...editData, fechaFactura: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={drawerFieldStyles} /><TextField type="date" label="Fecha de asignación" value={editData.fechaAsignacion} onChange={(e) => setEditData({ ...editData, fechaAsignacion: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} sx={drawerFieldStyles} />
{categoriaEsVehiculo(editData.categoria) && <><TextField select label="Tipo de energía" value={editData.tipoEnergia} onChange={(e) => setEditData({ ...editData, tipoEnergia: e.target.value, capacidadCombustible: "" })} sx={drawerFieldStyles}><MenuItem value="">No especificado</MenuItem><MenuItem value="Gasolina">Gasolina</MenuItem><MenuItem value="Eléctrico">Eléctrico</MenuItem><MenuItem value="No aplica">No aplica</MenuItem></TextField>{editData.tipoEnergia === "Gasolina" && <TextField type="number" label="Capacidad del tanque" value={editData.capacidadCombustible} onChange={(e) => setEditData({ ...editData, capacidadCombustible: e.target.value })} slotProps={{ htmlInput: { min: 1, max: 120 }, input: { endAdornment: "litros" } }} sx={drawerFieldStyles} />}</>}
<TextField label="Observaciones" multiline minRows={4} value={editData.observaciones} onChange={(e) => setEditData({ ...editData, observaciones: e.target.value })} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /><Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, gridColumn: { sm: "1/-1" } }}><Button onClick={() => { setEditing(false); setEditData(toEditData(detail)); }} sx={drawerSecondaryButtonStyles}>Cancelar</Button><Button onClick={requestEditConfirmation} disabled={!changedFields.length} sx={{ ...drawerPrimaryButtonStyles, transition: "background-color .15s ease, transform .12s ease", "&:active": { bgcolor: "#315f7a", transform: "scale(.97)" } }}>Guardar cambios</Button></Box></Box> : <Box sx={{ display: "grid", gap: 1.2 }}>{[["Número de inventario", detail.numeroInventario], ["Descripción", detail.descripcion], ["Categoría", label(detail.categoria, "tipo")], ["Estado", detail.estado], ["Resguardante", label(detail.resguardante)], ["Serie", detail.noSerie], ["Marca / Modelo", `${detail.marca || "—"} ${detail.modelo || ""}`], ["Localización", detail.localizacion], ["Costo", detail.costo != null ? `$${detail.costo.toLocaleString("es-MX")}` : "—"], ["Observaciones", detail.observaciones]].map(([k,v]) => <Box key={k} sx={{ p: 1.5, bgcolor: "#f7f9f9", borderRadius: "11px" }}><Typography sx={{ color: "#879195", fontSize: ".67rem", textTransform: "uppercase", fontWeight: 750 }}>{k}</Typography><Typography sx={{ mt: .35, color: "#34454c", fontSize: ".82rem" }}>{v || "—"}</Typography></Box>)}<Button startIcon={<Edit3 size={16} />} onClick={() => setEditing(true)} sx={{ ...drawerPrimaryButtonStyles, mt: 1 }}>Editar artículo</Button></Box>}</>}</Drawer>
  <Dialog open={confirmEditOpen} onClose={() => !saving && setConfirmEditOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: "18px" } } }}><DialogTitle sx={{ fontWeight: 850, borderBottom: "1px solid #e7ecec" }}>¿Estás seguro de que quieres editar este artículo?</DialogTitle><DialogContent sx={{ pt: "20px !important" }}><Typography sx={{ color: "#6f7c80", fontSize: ".8rem", mb: 1.5 }}>Se aplicarán los siguientes cambios a <b>{detail?.numeroInventario}</b>:</Typography><Box sx={{ display: "grid", gap: .8, maxHeight: 300, overflowY: "auto" }}>{changedFields.map((field) => { const previous = detail ? toEditData(detail)[field] : ""; return <Box key={field} sx={{ p: 1.2, bgcolor: "#f7f9f9", borderRadius: "10px" }}><Typography sx={{ color: "#657377", fontSize: ".68rem", fontWeight: 800, textTransform: "uppercase" }}>{EDIT_FIELD_LABELS[field]}</Typography><Typography sx={{ fontSize: ".76rem", mt: .3 }}><span style={{ color: "#9a6660" }}>{displayEditValue(field, previous)}</span> → <b style={{ color: "#467a77" }}>{displayEditValue(field, editData[field])}</b></Typography></Box>; })}</Box></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={() => setConfirmEditOpen(false)} disabled={saving} sx={drawerSecondaryButtonStyles}>Cancelar</Button><Button onClick={() => void updateArticle()} disabled={saving || !changedFields.length} sx={drawerPrimaryButtonStyles}>{saving ? "Guardando..." : "Sí, editar artículo"}</Button></DialogActions></Dialog>
  <Dialog open={manageOpen} onClose={() => !saving && setManageOpen(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "18px" } } }}>
    <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.2, borderBottom: "1px solid #e7ecec" }}><Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", bgcolor: "#eaf2f2", color: "#467a77", borderRadius: "11px" }}><UserRoundCog size={20} /></Box><Box><Typography sx={{ fontWeight: 800 }}>{stateOnlyMode ? "Cambiar estado" : "Gestionar selección"}</Typography><Typography sx={{ color: "#7b878a", fontSize: ".72rem" }}>{selected.length} artículo(s) seleccionados</Typography></Box></DialogTitle>
    <DialogContent sx={{ pt: "20px !important", display: "grid", gap: 2 }}>{!stateOnlyMode && <TextField select label="Acción" value={bulkMode} onChange={(e) => { setBulkMode(e.target.value as "resguardante" | "categoria" | "estado"); setBulkValue(""); }} sx={drawerFieldStyles}><MenuItem value="resguardante">Cambiar resguardante</MenuItem><MenuItem value="categoria">Cambiar categoría</MenuItem><MenuItem value="estado">Cambiar estado</MenuItem></TextField>}{bulkMode === "resguardante" ? <TextField select label="Nuevo resguardante" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} sx={drawerFieldStyles}>{usuarios.map((u) => <MenuItem key={u.id || u._id} value={u.id || u._id}>{u.nombre}</MenuItem>)}</TextField> : bulkMode === "categoria" ? <TextField select label="Nueva categoría" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} sx={drawerFieldStyles}>{categorias.map((category) => <MenuItem key={category.id || category._id} value={category.id || category._id}>{category.tipo}</MenuItem>)}</TextField> : <TextField select label="Nuevo estado" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} sx={drawerFieldStyles}>{ESTADOS.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>}<Alert severity="info" sx={{ borderRadius: "11px" }}>{bulkMode === "resguardante" ? "Los artículos quedarán en estado Asignado bajo el nuevo responsable. Para generar su documento, utiliza Resguardo interno." : bulkMode === "categoria" ? "La nueva categoría se aplicará a todos los artículos seleccionados." : "El cambio se aplicará a todos los artículos seleccionados."}</Alert></DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={() => setManageOpen(false)} disabled={saving} sx={drawerSecondaryButtonStyles}>Cancelar</Button><Button onClick={() => bulkMode === "estado" ? setConfirmStateOpen(true) : void applyBulkChange()} disabled={saving || !bulkValue} sx={drawerPrimaryButtonStyles}>{saving ? "Actualizando..." : "Aplicar cambio"}</Button></DialogActions>
  </Dialog>
  <Dialog open={confirmStateOpen} onClose={() => !saving && setConfirmStateOpen(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "18px" } } }}>
    <DialogTitle sx={{ fontWeight: 850, borderBottom: "1px solid #e7ecec" }}>¿Estás seguro de aplicar el cambio de estado?</DialogTitle>
    <DialogContent sx={{ pt: "20px !important" }}><Typography sx={{ color: "#657377", fontSize: ".82rem", lineHeight: 1.6 }}>Se cambiará el estado de <b>{selected.length} artículo(s)</b> a:</Typography><Chip label={bulkValue || "Sin seleccionar"} sx={{ mt: 1.5, bgcolor: statusColor(bulkValue)[0], color: statusColor(bulkValue)[1], fontWeight: 800 }} /><Alert severity="warning" sx={{ mt: 2, borderRadius: "11px" }}>Esta acción actualizará inmediatamente los artículos seleccionados.</Alert></DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={() => setConfirmStateOpen(false)} disabled={saving} sx={drawerSecondaryButtonStyles}>Cancelar</Button><Button onClick={() => { setConfirmStateOpen(false); void applyBulkChange(); }} disabled={saving || !bulkValue} sx={drawerPrimaryButtonStyles}>{saving ? "Aplicando..." : "Sí, aplicar cambio"}</Button></DialogActions>
  </Dialog>  <Dialog open={excelOpen} onClose={() => setExcelOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: "20px" } } }}><DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e8eeee" }}><Box><Typography sx={{ fontWeight: 800 }}>Importar artículos desde Excel</Typography><Typography sx={{ color: "#7d898c", fontSize: ".72rem" }}>Selecciona o arrastra el archivo con los artículos.</Typography></Box><IconButton onClick={() => setExcelOpen(false)}><X size={19} /></IconButton></DialogTitle><DialogContent sx={{ pt: "22px !important" }}><ImportarExcel onImported={() => { setRefresh((v) => v + 1); }} /></DialogContent></Dialog>
  <CapturaRapida controlledOpen={quickOpen} onControlledClose={() => setQuickOpen(false)} hideLauncher onSaved={() => setRefresh((v) => v + 1)} />
  <ImprimirEtiquetasDrawer open={qrOpen} onClose={() => setQrOpen(false)} initialSelected={selectedArticles} />
  <AgregarVehiculoDrawer open={vehicleOpen} onClose={() => setVehicleOpen(false)} onSaved={() => { setVehicleOpen(false); setRefresh((v) => v + 1); }} />
  <AgregarArticuloDrawer open={addOpen} onClose={() => { setAddOpen(false); setRefresh((v) => v + 1); }} />
  </Box>;
}



































