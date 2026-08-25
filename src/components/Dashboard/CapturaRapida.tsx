"use client";
import { useEstados } from "@/src/hooks/useEstados";


import { ClipboardEvent, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, MenuItem, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Tooltip, Typography,
} from "@mui/material";
import { ClipboardList, Copy, Plus, Save, Trash2, X } from "lucide-react";
import axios from "axios";
import { inventariosApi } from "@/src/services/axios";

interface Props { onSaved: () => void; controlledOpen?: boolean; onControlledClose?: () => void; hideLauncher?: boolean }
interface Catalogo { _id?: string; id?: string; tipo?: string; descripcion?: string; nombre?: string; activo?: boolean }
interface Fila {
  key: number; numeroInventario: string; descripcion: string; noSerie: string;
  categoria: string; estado: string; localizacion: string; costo: string;
  datosFactura: string; fechaFactura: string; resguardante: string; error?: string;
}

const INVENTARIO_REGEX = /^\d{10}-\d$/;
const formatInventario = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits.length > 10 ? digits.slice(0, 10) + "-" + digits.slice(10) : digits;
};
const today = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
};
const LOCALIZACIONES = ["Área técnica", "Site", "Lactario", "Cocina", "Jurídico", "Sala Dr. Ríos", "Sala capacitaciones", "Dirección", "Subdirección", "Administrativo"];
let nextKey = 1;
const nuevaFila = (): Fila => ({
  key: nextKey++, numeroInventario: "", descripcion: "", noSerie: "", categoria: "",
  estado: "Asignado", localizacion: "", costo: "", datosFactura: "",
  fechaFactura: today(), resguardante: "",
});
const lista = (json: unknown): Catalogo[] => {
  if (Array.isArray(json)) return json as Catalogo[];
  if (!json || typeof json !== "object") return [];
  const data = json as { data?: unknown; items?: unknown };
  const result = data.data ?? data.items;
  return Array.isArray(result) ? result as Catalogo[] : [];
};
const activa = (f: Fila) => Boolean(f.numeroInventario.trim() || f.descripcion.trim() || f.noSerie.trim() || f.categoria || f.estado || f.localizacion || f.costo || f.datosFactura.trim() || f.resguardante);
const errores = (f: Fila) => {
  if (!activa(f)) return [];
  const result: string[] = [];
  if (!INVENTARIO_REGEX.test(f.numeroInventario.trim())) result.push("inventario");
  if (!f.noSerie.trim()) result.push("serie");
  if (!f.categoria) result.push("categoría");
  if (!f.estado) result.push("estado");
  if (!f.localizacion) result.push("localización");
  if (!f.costo || Number(f.costo) < 0 || !Number.isFinite(Number(f.costo))) result.push("costo");
  if (!f.datosFactura.trim()) result.push("factura");
  if (!f.fechaFactura) result.push("fecha");
  if (f.estado === "Asignado" && !f.resguardante) result.push("resguardante");
  return result;
};
const fieldSx = {
  minWidth: 135,
  "& .MuiOutlinedInput-root": { height: 38, borderRadius: "8px", bgcolor: "#fff", fontSize: "0.74rem" },
  "& .MuiInputBase-input": { px: 1.1, py: 0.8 },
};

export default function CapturaRapida({

  onSaved, controlledOpen, onControlledClose, hideLauncher = false }: Props) {
  const ESTADOS = useEstados();
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen ?? localOpen;
  const setOpen = (value: boolean) => {
    if (controlledOpen === undefined) setLocalOpen(value);
    else if (!value) onControlledClose?.();
  };
  const [filas, setFilas] = useState<Fila[]>(() => Array.from({ length: 2 }, nuevaFila));
  const [categorias, setCategorias] = useState<Catalogo[]>([]);
  const [usuarios, setUsuarios] = useState<Catalogo[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState<Record<number, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (!open || categorias.length) return;
    const controller = new AbortController();
    const load = async () => {
      setLoadingCatalogs(true);
      try {
        const [c, u] = await Promise.all([
          inventariosApi.get("/categorias", {
            params: { limit: 1000, fields: "tipo,descripcion" },
            signal: controller.signal,
          }),
          inventariosApi.get("/usuarios", {
            params: { limit: 1000, fields: "nombre,activo" },
            signal: controller.signal,
          }),
        ]);
        setCategorias(lista(c.data));
        setUsuarios(lista(u.data).filter((usuario) => usuario.activo === true));
      } catch {
        if (!controller.signal.aborted) setMessage({ type: "error", text: "No fue posible cargar categorías y resguardantes." });
      } finally {
        if (!controller.signal.aborted) setLoadingCatalogs(false);
      }
    };
    void load();
    return () => controller.abort();
  }, [open, categorias.length]);

  const activas = useMemo(() => filas.filter(activa), [filas]);
  const validas = activas.filter((fila) => errores(fila).length === 0).length;
  const invalidas = activas.length - validas;
  const markTouched = (key: number, field: string) => setTouched((current) => ({ ...current, [key]: Array.from(new Set([...(current[key] || []), field])) }));
  const showError = (fila: Fila, error: string) => errores(fila).includes(error) && (submitted || (touched[fila.key] || []).includes(error));
  const visibleInvalidas = activas.filter((fila) => errores(fila).some((error) => showError(fila, error))).length;

  const update = (key: number, field: keyof Fila, value: string) => {
    setFilas((current) => current.map((fila) => fila.key === key ? {
      ...fila, [field]: field === "numeroInventario" ? formatInventario(value) : value, error: undefined,
      ...(field === "estado" && value !== "Asignado" ? { resguardante: "" } : {}),
      ...(field === "resguardante" && value ? { estado: "Asignado" } : {}),
    } : fila));
    setMessage(null);
  };
  const remove = (key: number) => setFilas((current) => current.length <= 2 ? current : current.filter((f) => f.key !== key));
  const duplicate = (fila: Fila) => setFilas((current) => [...current, { ...fila, key: nextKey++, numeroInventario: "", noSerie: "", error: undefined }]);

  const paste = (event: ClipboardEvent<HTMLInputElement>, start: number) => {
    const lines = event.clipboardData.getData("text").trim().split(/\r?\n/).map((line) => line.split("\t"));
    if (lines.length < 2 && (lines[0]?.length || 0) < 2) return;
    event.preventDefault();
    const fields: Array<Exclude<keyof Fila, "key" | "error">> = ["numeroInventario", "descripcion", "noSerie", "categoria", "estado", "localizacion", "costo", "datosFactura", "fechaFactura", "resguardante"];
    setFilas((current) => {
      const result = [...current];
      while (result.length < start + lines.length) result.push(nuevaFila());
      lines.forEach((cells, rowIndex) => {
        const row: Fila = { ...result[start + rowIndex], error: undefined };
        cells.forEach((cell, columnIndex) => { const field = fields[columnIndex]; if (field) row[field] = field === "numeroInventario" ? formatInventario(cell) : cell.trim(); });
        result[start + rowIndex] = row;
      });
      return result;
    });
  };

  const save = async () => {
    if (activas.length < 2) return setMessage({ type: "error", text: "La captura rápida requiere al menos dos artículos." });
    if (invalidas) return setMessage({ type: "error", text: "Corrige las filas incompletas antes de guardar." });
    setSaving(true);
    setSubmitted(false);
    setMessage(null);
    const failures = new Map<number, string>();
    let saved = 0;
    for (const fila of activas) {
      const payload: Record<string, string | number> = {
        numeroInventario: fila.numeroInventario.trim(), descripcion: fila.descripcion.trim(),
        noSerie: fila.noSerie.trim(), categoria: fila.categoria, estado: fila.estado,
        localizacion: fila.localizacion, costo: Number(fila.costo),
        datosFactura: fila.datosFactura.trim(), fechaFactura: fila.fechaFactura,
      };
      if (fila.estado === "Asignado") payload.resguardante = fila.resguardante;
      try {
        await inventariosApi.post("/articulos", payload);
        saved++;
      } catch (error) {
        let detail = "No se pudo guardar";
        if (axios.isAxiosError(error)) {
          const data = error.response?.data as { message?: string; errors?: string[] } | undefined;
          detail = data?.message || data?.errors?.join(" · ") || detail;
        }
        failures.set(fila.key, detail);
      }
    }
    setFilas((current) => {
      const remaining: Fila[] = current.filter((f) => !activa(f) || failures.has(f.key)).map((f) => ({ ...f, error: failures.get(f.key) }));
      while (remaining.length < 2) remaining.push(nuevaFila());
      return remaining;
    });
    if (saved) onSaved();
    setMessage(failures.size
      ? { type: "error", text: saved + " guardados y " + failures.size + " rechazados. Revisa las filas marcadas." }
      : { type: "success", text: saved + " artículos guardados correctamente." });
    setSaving(false);
  };

  const input = (fila: Fila, field: keyof Fila, placeholder = "", sx = fieldSx) => (
    <TextField value={String(fila[field] || "")} placeholder={placeholder} error={showError(fila, field === "numeroInventario" ? "inventario" : field === "noSerie" ? "serie" : field === "datosFactura" ? "factura" : field)} onBlur={() => markTouched(fila.key, field === "numeroInventario" ? "inventario" : field === "noSerie" ? "serie" : field === "datosFactura" ? "factura" : field)} onChange={(e) => update(fila.key, field, e.target.value)} sx={sx} slotProps={field === "numeroInventario" ? { htmlInput: { maxLength: 12, inputMode: "numeric" } } : undefined} />
  );

  return (
    <>
      {!hideLauncher && <Box sx={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", px: 1 }}>
        <Box sx={{ width: 56, height: 56, display: "grid", placeItems: "center", borderRadius: "16px", bgcolor: "#e8f1ef", color: "#467A77", mb: 1.5 }}><ClipboardList size={28} /></Box>
        <Typography sx={{ color: "#334548", fontSize: "0.91rem", fontWeight: 750 }}>Captura Rápida</Typography>
        <Typography sx={{ color: "#7d898c", fontSize: "0.72rem", lineHeight: 1.5, mt: 0.6, maxWidth: 230 }}>Capturar articulos en una tabla tipo Excel.</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} startIcon={<Plus size={16} />} sx={{ mt: 2, borderRadius: "10px", bgcolor: "#467A77", boxShadow: "none", textTransform: "none", fontWeight: 750 }}>Abrir captura rápida</Button>
      </Box>}

      <Dialog open={open} onClose={() => !saving && setOpen(false)} maxWidth={false} fullWidth slotProps={{ paper: { sx: { width: "calc(100vw - 48px)", maxWidth: 1500, height: "calc(100vh - 64px)", borderRadius: "18px" } } }}>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5, borderBottom: "1px solid #e9eeee" }}>
          <Box sx={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "12px", bgcolor: "#e8f1ef", color: "#467A77" }}><ClipboardList size={22} /></Box>
          <Box sx={{ flex: 1 }}><Typography sx={{ fontSize: "1rem", fontWeight: 800, color: "#2f4144" }}>Captura rápida de artículos</Typography><Typography sx={{ fontSize: "0.72rem", color: "#7e898c" }}>Cada fila es un artículo; las filas vacías se ignoran.</Typography></Box>
          <IconButton onClick={() => setOpen(false)} disabled={saving}><X size={20} /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", p: 0, bgcolor: "#f8faf9" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2.5, py: 1.5, bgcolor: "#fff", borderBottom: "1px solid #e9eeee" }}>
            <Button size="small" startIcon={<Plus size={15} />} onClick={() => setFilas((c) => [...c, nuevaFila()])} sx={{ textTransform: "none", color: "#467A77", fontWeight: 700 }}>Agregar fila</Button>
            <Typography sx={{ fontSize: "0.69rem", color: "#7e898c" }}> </Typography><Box sx={{ flex: 1 }} />
            
          </Box>
          {message && <Alert severity={message.type} sx={{ mx: 2.5, mt: 1.5, borderRadius: "10px" }}>{message.text}</Alert>}
          <TableContainer sx={{ flex: 1, px: 2.5, py: 1.5 }}>
            <Table stickyHeader size="small" sx={{ borderCollapse: "separate", borderSpacing: "0 7px", minWidth: 1590 }}>
              <TableHead><TableRow>{["#", "Inventario *", "Descripción", "Serie *", "Categoría *", "Estado *", "Localización *", "Costo *", "Factura *", "Fecha factura *", "Resguardante", "Acciones"].map((h) => <TableCell key={h} sx={{ border: 0, bgcolor: "#f8faf9", color: "#738083", fontSize: "0.68rem", fontWeight: 800, whiteSpace: "nowrap" }}>{h}</TableCell>)}</TableRow></TableHead>
              <TableBody>{filas.map((fila, index) => (
                <TableRow key={fila.key} sx={{ "& td": { bgcolor: fila.error ? "#fff3f0" : visibleInvalidas && errores(fila).some((error) => showError(fila, error)) ? "#fffbf6" : "#fff", borderTop: "1px solid #e8eded", borderBottom: "1px solid #e8eded" } }}>
                  <TableCell sx={{ color: "#849093", fontSize: "0.72rem" }}>{index + 1}</TableCell>
                  <TableCell><Box onPaste={(e) => paste(e as ClipboardEvent<HTMLInputElement>, index)}>{input(fila, "numeroInventario", "0000000000-0")}</Box></TableCell>
                  <TableCell>{input(fila, "descripcion", "Descripción", { ...fieldSx, minWidth: 190 })}</TableCell>
                  <TableCell>{input(fila, "noSerie", "Serie")}</TableCell>
                  <TableCell><TextField select value={fila.categoria} error={showError(fila, "categoría")} onBlur={() => markTouched(fila.key, "categoría")} onChange={(e) => update(fila.key, "categoria", e.target.value)} sx={{ ...fieldSx, minWidth: 165 }}>{categorias.length ? categorias.map((c) => <MenuItem key={c.id || c._id} value={c.id || c._id}>{c.tipo || c.descripcion}</MenuItem>) : <MenuItem disabled value="">{loadingCatalogs ? "Cargando categorías..." : "Sin categorías disponibles"}</MenuItem>}</TextField></TableCell>
                  <TableCell><TextField select value={fila.estado} error={showError(fila, "estado")} onBlur={() => markTouched(fila.key, "estado")} onChange={(e) => update(fila.key, "estado", e.target.value)} sx={fieldSx}>{ESTADOS.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}</TextField></TableCell>
                  <TableCell><TextField select value={fila.localizacion} error={showError(fila, "localización")} onBlur={() => markTouched(fila.key, "localización")} onChange={(e) => update(fila.key, "localizacion", e.target.value)} sx={{ ...fieldSx, minWidth: 160 }}>{LOCALIZACIONES.map((l) => <MenuItem key={l} value={l}>{l}</MenuItem>)}</TextField></TableCell>
                  <TableCell><TextField type="number" value={fila.costo} error={showError(fila, "costo")} onBlur={() => markTouched(fila.key, "costo")} onChange={(e) => update(fila.key, "costo", e.target.value)} sx={{ ...fieldSx, minWidth: 105 }} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} /></TableCell>
                  <TableCell>{input(fila, "datosFactura", "Factura")}</TableCell>
                  <TableCell><TextField type="date" value={fila.fechaFactura} error={showError(fila, "fecha")} onBlur={() => markTouched(fila.key, "fecha")} onChange={(e) => update(fila.key, "fechaFactura", e.target.value)} sx={{ ...fieldSx, minWidth: 145 }} /></TableCell>
                  <TableCell><TextField select value={fila.resguardante} error={showError(fila, "resguardante")} onBlur={() => markTouched(fila.key, "resguardante")} onChange={(e) => update(fila.key, "resguardante", e.target.value)} sx={{ ...fieldSx, minWidth: 180 }} helperText={fila.estado !== "Asignado" ? "Al elegirlo, el estado cambia a Asignado" : undefined}>{usuarios.length ? usuarios.map((u) => <MenuItem key={u.id || u._id} value={u.id || u._id}>{u.nombre}</MenuItem>) : <MenuItem disabled value="">{loadingCatalogs ? "Cargando resguardantes..." : "Sin resguardantes disponibles"}</MenuItem>}</TextField></TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}><Tooltip title="Duplicar"><IconButton size="small" onClick={() => duplicate(fila)}><Copy size={15} /></IconButton></Tooltip><Tooltip title={filas.length <= 2 ? "La captura requiere mínimo dos filas" : "Eliminar"}><span><IconButton size="small" color="error" disabled={filas.length <= 2} onClick={() => remove(fila.key)}><Trash2 size={15} /></IconButton></span></Tooltip>{fila.error && <Typography title={fila.error} noWrap sx={{ maxWidth: 110, color: "#b34f42", fontSize: "0.62rem" }}>{fila.error}</Typography>}</TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: "1px solid #e9eeee" }}>
          <Button onClick={() => setOpen(false)} disabled={saving} sx={{ color: "#687579", textTransform: "none" }}>Cerrar</Button>
          <Button variant="contained" onClick={save} disabled={saving || activas.length < 2} startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <Save size={16} />} sx={{ bgcolor: "#467A77", borderRadius: "10px", boxShadow: "none", textTransform: "none", fontWeight: 750 }}>{saving ? "Guardando..." : "Guardar " + (validas || "") + " artículos"}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}



















