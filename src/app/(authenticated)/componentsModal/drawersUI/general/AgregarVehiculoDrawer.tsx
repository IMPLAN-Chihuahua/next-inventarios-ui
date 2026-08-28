"use client";
import { useEstados } from "@/src/hooks/useEstados";

import { useCallback, useEffect, useState } from "react";
import { Alert, Box, MenuItem, TextField } from "@mui/material";
import { CarFront, CircleDollarSign, Fuel, UserRound } from "lucide-react";
import StepperDrawer, { DrawerStep } from "../WithStepperCenterDrawer";
import { DrawerSectionTitle, drawerDropdownMenuProps, drawerFieldStyles } from "../CenteredDrawer";
import { inventariosApi } from "@/src/services/axios";
import { sanitizeSafeText } from "@/src/utils/safeText";

interface Props { open: boolean; onClose: () => void; onSaved?: () => void }
interface Usuario { _id?: string; id?: string; nombre?: string; activo?: boolean }
const TRANSPORTE_ID = "0c63012a-e7a2-4239-b7ff-4c17fe9b38dc";
const today = () => { const date = new Date(); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10); };
const formatInventory = (value: string) => { const digits = value.replace(/\D/g, "").slice(0, 11); return digits.length > 10 ? `${digits.slice(0, 10)}-${digits.slice(10)}` : digits; };
const initial = { numeroInventario: "", descripcion: "", noSerie: "", marca: "", modelo: "", tipoEnergia: "Gasolina", capacidadCombustible: "", costo: "", datosFactura: "", fechaFactura: today(), localizacion: "No especificada", estado: "Asignado", resguardante: "", observaciones: "" };
const SAFE_VEHICLE_FIELDS = new Set<keyof typeof initial>(["descripcion", "noSerie", "marca", "modelo", "datosFactura", "localizacion", "observaciones"]);

export default function AgregarVehiculoDrawer({

  open, onClose, onSaved }: Props) {
  const ESTADOS = useEstados();
  const [form, setForm] = useState(initial); const [usuarios, setUsuarios] = useState<Usuario[]>([]); const [error, setError] = useState(""); const [saving, setSaving] = useState(false);
  const loadUsers = useCallback(async () => { try { const response = await inventariosApi.get("/usuarios", { params: { limit: 1000, fields: "nombre,activo" } }); const data = Array.isArray(response.data) ? response.data : response.data.data || []; setUsuarios((data as Usuario[]).filter((u) => u.activo === true)); } catch { setError("No fue posible cargar los empleados activos."); } }, []);
  useEffect(() => { if (open && !usuarios.length) void loadUsers(); }, [open, usuarios.length, loadUsers]);
  const set = (name: keyof typeof form, value: string) => {
    const sanitizedValue = name === "numeroInventario"
      ? formatInventory(value)
      : SAFE_VEHICLE_FIELDS.has(name) ? sanitizeSafeText(value) : value;
    setForm((current) => ({ ...current, [name]: sanitizedValue, ...(name === "estado" && sanitizedValue !== "Asignado" ? { resguardante: "" } : {}) }));
  };
  const validateVehicle = () => { if (!/^\d{10}-\d$/.test(form.numeroInventario) || !form.noSerie.trim() || !form.descripcion.trim()) { setError("Completa descripción, número de serie y un inventario válido de 11 dígitos."); return false; } if (form.tipoEnergia === "Gasolina" && (!form.capacidadCombustible || Number(form.capacidadCombustible) <= 0 || Number(form.capacidadCombustible) > 120)) { setError("Indica una capacidad del tanque entre 1 y 120 litros."); return false; } setError(""); return true; };
  const validateInvoice = () => { if (!form.costo || !form.datosFactura.trim() || !form.fechaFactura) { setError("Completa costo, datos de factura y fecha de factura."); return false; } setError(""); return true; };
  const validateAssignment = () => { if (form.estado === "Asignado" && !form.resguardante) { setError("Selecciona un empleado responsable."); return false; } setError(""); return true; };
  const save = async () => { if (!validateVehicle() || !validateInvoice() || !validateAssignment()) return false; setSaving(true); try { const payload: Record<string, string | number> = { ...form, categoria: TRANSPORTE_ID, costo: Number(form.costo) }; if (form.tipoEnergia === "Gasolina") payload.capacidadCombustible = Number(form.capacidadCombustible); else delete payload.capacidadCombustible; if (form.estado !== "Asignado") delete payload.resguardante; await inventariosApi.post("/articulos", payload); setForm({ ...initial, fechaFactura: today() }); onSaved?.(); return true; } catch { setError("No fue posible guardar el vehículo. Revisa que inventario y serie no estén repetidos."); return false; } finally { setSaving(false); } };
  const panel = { display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.5, p: 2, border: "1px solid #e3e9ea", borderRadius: "16px", bgcolor: "#fbfcfc" };
  const alert = error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null;
  const steps: DrawerStep[] = [
    { label: "Vehículo y energía", validate: validateVehicle, content: () => <>{alert}<Box sx={panel}><DrawerSectionTitle icon={<CarFront size={18} />} title="Identificación del vehículo" description="Datos principales y tipo de energía de la unidad." /><TextField label="Número de inventario" required value={form.numeroInventario} onChange={(e) => set("numeroInventario", e.target.value)} sx={drawerFieldStyles} /><TextField label="Número de serie" required value={form.noSerie} onChange={(e) => set("noSerie", e.target.value)} sx={drawerFieldStyles} /><TextField label="Descripción" required value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /><TextField label="Marca" value={form.marca} onChange={(e) => set("marca", e.target.value)} sx={drawerFieldStyles} /><TextField label="Modelo" value={form.modelo} onChange={(e) => set("modelo", e.target.value)} sx={drawerFieldStyles} /><DrawerSectionTitle icon={<Fuel size={18} />} title="Fuente de energía" description="Esta información define el indicador del resguardo vehicular." /><TextField select label="Tipo" value={form.tipoEnergia} onChange={(e) => { set("tipoEnergia", e.target.value); set("capacidadCombustible", ""); }} sx={drawerFieldStyles}><MenuItem value="Gasolina">Gasolina</MenuItem><MenuItem value="Eléctrico">Eléctrico</MenuItem><MenuItem value="No aplica">No aplica (bicicletas u otros)</MenuItem></TextField>{form.tipoEnergia === "Gasolina" && <TextField type="number" label="Capacidad del tanque" value={form.capacidadCombustible} onChange={(e) => set("capacidadCombustible", e.target.value)} sx={drawerFieldStyles} slotProps={{ htmlInput: { min: 1, max: 120 }, input: { endAdornment: "litros" } }} />}{form.tipoEnergia === "Eléctrico" && <TextField disabled label="Capacidad de carga" value="100 %" sx={drawerFieldStyles} />}</Box></> },
    { label: "Datos administrativos", validate: validateInvoice, content: () => <>{alert}<Box sx={panel}><DrawerSectionTitle icon={<CircleDollarSign size={18} />} title="Datos de factura" description="Información administrativa del vehículo." /><TextField type="number" label="Costo" value={form.costo} onChange={(e) => set("costo", e.target.value)} sx={drawerFieldStyles} /><TextField label="Datos de factura" value={form.datosFactura} onChange={(e) => set("datosFactura", e.target.value)} sx={drawerFieldStyles} /><TextField type="date" label="Fecha de factura" value={form.fechaFactura} onChange={(e) => set("fechaFactura", e.target.value)} sx={drawerFieldStyles} slotProps={{ inputLabel: { shrink: true } }} /></Box></> },
    { label: "Asignación", validate: validateAssignment, content: () => <>{alert}<Box sx={panel}><DrawerSectionTitle icon={<UserRound size={18} />} title="Estado y responsable" description="Define la situación inicial del vehículo." /><TextField select label="Estado" value={form.estado} onChange={(e) => set("estado", e.target.value)} sx={drawerFieldStyles}>{ESTADOS.map((v) => <MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>{form.estado === "Asignado" && <TextField select label="Empleado responsable" value={form.resguardante} onChange={(e) => set("resguardante", e.target.value)} sx={drawerFieldStyles} slotProps={{ select: { MenuProps: drawerDropdownMenuProps } }}>{usuarios.map((u) => <MenuItem key={u.id || u._id} value={u.id || u._id}>{u.nombre}</MenuItem>)}</TextField>}<TextField multiline minRows={4} label="Observaciones" value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /></Box></> },
  ];
  return <StepperDrawer open={open} onClose={onClose} title="Agregar vehículo" subtitle="Registra la unidad y configura su capacidad para futuros resguardos." icon={<CarFront size={22} />} steps={steps} onFinish={save} finishLabel="Guardar vehículo" disabled={saving} size="wide" />;
}






