"use client";

import { useEffect, useState } from "react";
import {
  Alert, Autocomplete, Box, Button, Checkbox, FormControlLabel, MenuItem, TextField, Typography,
} from "@mui/material";
import { CheckCircle2, FileDown, PackageSearch, ShieldCheck, Trash2, UserRound } from "lucide-react";
import axios from "axios";
import { inventariosApi } from "@/src/services/axios";
import { sanitizeSafeText } from "@/src/utils/safeText";
import StepperDrawer, { DrawerStep } from "@/src/app/(authenticated)/componentsModal/drawersUI/WithStepperCenterDrawer";
import { DrawerSectionTitle, drawerDropdownMenuProps, drawerFieldStyles } from "@/src/app/(authenticated)/componentsModal/drawersUI/CenteredDrawer";

interface Props { onSaved: () => void; controlledOpen?: boolean; onControlledClose?: () => void; hideLauncher?: boolean }
interface Usuario {
  _id?: string; id?: string; nombre?: string; numeroEmpleado?: string;
  departamento?: string; puesto?: string; activo?: boolean;
}
interface Categoria { _id?: string; id?: string; }
interface Articulo {
  _id: string; numeroInventario: string; descripcion?: string; noSerie?: string; estado?: string;
  categoria?: Categoria | string; resguardante?: Usuario | string;
}

const CATEGORIA_TRANSPORTE_ID = "0c63012a-e7a2-4239-b7ff-4c17fe9b38dc";
const esVehiculo = (articulo: Articulo) => {
  const categoria = articulo.categoria;
  const categoriaId = typeof categoria === "string" ? categoria : categoria?._id || categoria?.id;
  return categoriaId === CATEGORIA_TRANSPORTE_ID;
};
const getList = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (!value || typeof value !== "object") return [];
  const response = value as { data?: unknown; items?: unknown };
  const list = response.data ?? response.items;
  return Array.isArray(list) ? list as T[] : [];
};

export default function ResguardoInterno({ onSaved, controlledOpen, onControlledClose, hideLauncher = false }: Props) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => { if (controlledOpen === undefined) setLocalOpen(value); else if (!value) onControlledClose?.(); };
  const [folio, setFolio] = useState("");
  const [usuarioId, setUsuarioId] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Articulo[]>([]);
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmarReasignacion, setConfirmarReasignacion] = useState(false);

  useEffect(() => {
    if (!open || usuarios.length) return;
    const controller = new AbortController();
    const load = async () => {
      setLoadingUsers(true);
      try {
        const response = await inventariosApi.get("/usuarios", {
          params: { limit: 1000, fields: "nombre,numeroEmpleado,departamento,puesto,activo" },
          signal: controller.signal,
        });
        setUsuarios(getList<Usuario>(response.data).filter((usuario) => usuario.activo === true));
      } catch {
        if (!controller.signal.aborted) setError("No fue posible cargar los trabajadores.");
      } finally {
        if (!controller.signal.aborted) setLoadingUsers(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [open, usuarios.length]);

  useEffect(() => {
    const value = query.trim();
    if (!open || value.length < 2) {
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
        setOptions((response.data.data || []).filter((option) => !esVehiculo(option) && !articulos.some((item) => item._id === option._id)));
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

  const selectedUser = usuarios.find((item) => (item.id || item._id) === usuarioId);
  const responsableId = (value?: Usuario | string) => typeof value === "string" ? value : value?.id || value?._id || "";
  const responsableNombre = (value?: Usuario | string) => typeof value === "object" ? value.nombre || "Responsable actual" : "Responsable actual";
  const articulosConOtroResponsable = articulos.filter((articulo) => responsableId(articulo.resguardante) && responsableId(articulo.resguardante) !== usuarioId);

  const reset = () => {
    setFolio("");
    setUsuarioId("");
    setQuery("");
    setOptions([]);
    setArticulos([]);
    setError("");
  };
  const close = () => {
    if (saving) return;
    setOpen(false);
    reset();
  };

  const save = async () => {
    if (!folio.trim() || !usuarioId || !articulos.length) {
      setError("Completa el folio, selecciona un trabajador y agrega al menos un artículo.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await inventariosApi.post(
        "/resguardos/interno/download",
        {
          folio: folio.trim(),
          resguardante: usuarioId,
          articlesIds: articulos.map((item) => item._id),
        },
        { responseType: "blob", timeout: 120000 },
      );
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      const safeName = (selectedUser?.nombre || "trabajador").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "_");
      anchor.href = url;
      anchor.download = "Resguardo_interno_" + safeName + ".xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      onSaved();
      return true;
    } catch (requestError) {
      console.error(requestError);
      if (axios.isAxiosError(requestError)) {
        let responseData = requestError.response?.data as
          | Blob
          | { message?: string; errors?: string[] }
          | undefined;

        if (responseData instanceof Blob) {
          try {
            responseData = JSON.parse(await responseData.text()) as { message?: string; errors?: string[] };
          } catch {
            responseData = undefined;
          }
        }

        const message = responseData?.message || responseData?.errors?.join(" · ");
        setError(message || (requestError.response?.status === 422
          ? "Revisa los datos del resguardo."
          : "No fue posible asignar los artículos y generar el resguardo."));
      } else {
        setError("No fue posible asignar los artículos y generar el resguardo.");
      }
      return false;
    } finally {
      setSaving(false);
    }
  };

  const validateResponsible = () => { if (folio.trim() && usuarioId) { setError(""); return true; } setError("Completa el folio y selecciona un empleado responsable."); return false; };
  const validateArticles = () => { if (articulos.length) { setError(""); return true; } setError("Agrega al menos un artículo al resguardo."); return false; };
  const validateReview = () => { if (!articulosConOtroResponsable.length || confirmarReasignacion) { setError(""); return true; } setError("Confirma el cambio de resguardante antes de finalizar."); return false; };
  const articleList = <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: .9, maxHeight: 300, overflowY: "auto" }}>{!articulos.length ? <Typography sx={{ py: 4, color: "#90999e", fontSize: ".76rem", textAlign: "center" }}>Aún no has agregado artículos.</Typography> : articulos.map((articulo, index) => <Box key={articulo._id} sx={{ display: "grid", gridTemplateColumns: "36px minmax(0,1fr) 120px 36px", gap: 1, alignItems: "center", p: 1.15, border: "1px solid #e0e9e8", borderLeft: "4px solid #6f9d99", borderRadius: "12px", bgcolor: "#fbfdfd" }}><Typography sx={{ color: "#8b969b", fontSize: ".72rem", textAlign: "center" }}>{index + 1}</Typography><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "#34454c", fontSize: ".78rem", fontWeight: 750 }}>{articulo.numeroInventario}</Typography><Typography noWrap sx={{ color: "#879298", fontSize: ".68rem" }}>{articulo.descripcion || "Sin descripción"}</Typography></Box><Typography noWrap sx={{ color: "#66757b", fontSize: ".7rem" }}>{articulo.estado || "Sin estado"}</Typography><Button color="error" onClick={() => setArticulos((current) => current.filter((item) => item._id !== articulo._id))}><Trash2 size={15} /></Button></Box>)}</Box>;
  const steps: DrawerStep[] = [
    { label: "Responsable", validate: validateResponsible, content: () => <>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1.5fr" }, gap: 1.5, p: 2, bgcolor: "#fff", border: "1px solid #e4eaec", borderRadius: "16px" }}><DrawerSectionTitle icon={<UserRound size={18} />} title="Responsable del resguardo" description="Selecciona al empleado activo que quedará a cargo de los bienes." /><TextField required label="Folio" value={folio} onChange={(e) => setFolio(sanitizeSafeText(e.target.value))} sx={drawerFieldStyles} /><TextField select required label="Empleado responsable" value={usuarioId} onChange={(e) => { setUsuarioId(e.target.value); setConfirmarReasignacion(false); }} disabled={loadingUsers} sx={drawerFieldStyles} slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}>{usuarios.length ? usuarios.map((u) => <MenuItem key={u.id || u._id} value={u.id || u._id}>{u.nombre}</MenuItem>) : <MenuItem disabled value="">{loadingUsers ? "Cargando..." : "Sin trabajadores activos"}</MenuItem>}</TextField>{selectedUser && <Box sx={{ gridColumn: { sm: "1/-1" }, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3,1fr)" }, gap: 1, p: 1.5, bgcolor: "#eef6f5", borderLeft: "4px solid #467A77", borderRadius: "12px" }}><Typography>Empleado: <b>{selectedUser.numeroEmpleado || "—"}</b></Typography><Typography>Área: <b>{selectedUser.departamento || "—"}</b></Typography><Typography>Puesto: <b>{selectedUser.puesto || "—"}</b></Typography></Box>}</Box></> },
    { label: "Seleccionar bienes", validate: validateArticles, content: () => <>{error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}<Box sx={{ p: 2, bgcolor: "#fff", border: "1px solid #e4eaec", borderRadius: "16px" }}><DrawerSectionTitle icon={<PackageSearch size={18} />} title="Bienes a resguardar" description="Agrega los artículos que quedarán bajo responsabilidad del empleado." /><Autocomplete options={query.trim().length < 2 ? [] : options} loading={searching} filterOptions={(items) => items} inputValue={query} value={null} getOptionLabel={(o) => o.numeroInventario + " · " + (o.descripcion || "Sin descripción")} isOptionEqualToValue={(o,v) => o._id === v._id} onInputChange={(_,v) => { setQuery(v); if (v.trim().length < 2) setOptions([]); }} onChange={(_,v) => { if(!v)return; setArticulos((current)=>[...current,v]); setQuery(""); setOptions([]); setError(""); }} noOptionsText={query.trim().length < 2 ? null : "Sin coincidencias"} renderInput={(params) => <TextField {...params} placeholder="Buscar por inventario, serie o descripción" sx={{ ...drawerFieldStyles, mt: 1.5 }} />} />{articleList}</Box></> },
    { label: "Revisar", validate: validateReview, content: () => <Box sx={{ p: 2.5, border: "1px solid #dce8e7", borderRadius: "16px", bgcolor: "#f7fbfa" }}><DrawerSectionTitle icon={<CheckCircle2 size={18} />} title="Confirmar asignación" description="Al finalizar, los bienes quedarán asignados y se descargará el formato." /><Box sx={{ mt: 2, display: "grid", gap: 1 }}><Typography><b>Folio:</b> {folio}</Typography><Typography><b>Responsable:</b> {selectedUser?.nombre}</Typography><Typography><b>Artículos:</b> {articulos.length}</Typography></Box>{articulosConOtroResponsable.length > 0 && <Alert severity="warning" sx={{ mt: 2, borderRadius: "12px", alignItems: "flex-start" }}><Typography sx={{ fontSize: ".76rem", fontWeight: 800, mb: .7 }}>{articulosConOtroResponsable.length} artículo(s) ya tienen resguardante:</Typography>{articulosConOtroResponsable.map((articulo) => <Typography key={articulo._id} sx={{ fontSize: ".72rem", mb: .25 }}><b>{articulo.numeroInventario}</b> tiene como resguardante a {responsableNombre(articulo.resguardante)}.</Typography>)}<FormControlLabel sx={{ mt: 1, alignItems: "flex-start" }} control={<Checkbox size="small" checked={confirmarReasignacion} onChange={(event) => setConfirmarReasignacion(event.target.checked)} />} label={<Typography sx={{ fontSize: ".73rem", pt: .35 }}>Sí, quiero cambiar {articulosConOtroResponsable.length === 1 ? "este artículo" : "estos artículos"} por <b>{selectedUser?.nombre}</b>.</Typography>} /></Alert>}{error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}{articleList}</Box> },
  ];
  return <>{!hideLauncher && <Box sx={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}><Typography sx={{ color: "#67757b", fontSize: ".72rem" }}>Asigna artículos a un trabajador y genera su formato.</Typography><Button size="small" variant="contained" startIcon={<FileDown size={15} />} onClick={() => setOpen(true)} sx={{ bgcolor: "#709c99", textTransform: "none" }}>Crear</Button></Box>}<StepperDrawer open={open} onClose={close} title="Crear resguardo interno" subtitle="Completa cada etapa para asignar y documentar los bienes." icon={<ShieldCheck size={22} />} steps={steps} onFinish={save} finishLabel="Asignar y descargar" disabled={saving || loadingUsers} size="wide" /></>;
}



