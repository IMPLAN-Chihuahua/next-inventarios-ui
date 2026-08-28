"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, Avatar, Box, Button, Checkbox, Chip, CircularProgress, Drawer, FormControlLabel, IconButton, InputAdornment, Menu, MenuItem, Pagination, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import { BadgeCheck, BriefcaseBusiness, Building2, Edit3, FilterX, Hash, Mail, MoreHorizontal, Plus, Search, UserRound, UsersRound, X } from "lucide-react";
import axios from "axios";
import { inventariosApi } from "@/src/services/axios";
import { drawerFieldStyles, drawerPrimaryButtonStyles, drawerSecondaryButtonStyles } from "@/src/app/(authenticated)/componentsModal/drawersUI/CenteredDrawer";
import { sanitizeSafeText } from "@/src/utils/safeText";

interface Usuario { _id: string; nombre: string; correo: string; rol?: string; activo?: boolean; departamento?: string; puesto?: string; numeroEmpleado?: string }
interface ApiResponse { data: Usuario[]; pagination: { total: number; totalPages: number; page: number; limit: number } }
interface AssignedArticle { _id: string; numeroInventario?: string; descripcion?: string }
interface ArticlesResponse { data: AssignedArticle[]; pagination?: { total?: number } }
interface FormData { nombre: string; correo: string; clave: string; rol: string; activo: string; departamento: string; puesto: string; numeroEmpleado: string }
const DEPARTAMENTOS = ["Geomática", "TICs", "Planes y programas", "Vinculación y Difusión", "Jurídico", "Administración", "Dirección", "Subdirección", "Intendencia", "Recursos Humanos, Materiales y Administrativos", "Mantenimiento y Mensajería", "Recepción", "Coordinación Administrativa"];
const emptyForm = (): FormData => ({ nombre: "", correo: "", clave: "", rol: "User", activo: "true", departamento: "", puesto: "", numeroEmpleado: "" });
const toForm = (usuario: Usuario): FormData => ({ nombre: usuario.nombre || "", correo: usuario.correo || "", clave: "", rol: usuario.rol || "User", activo: usuario.activo === false ? "false" : "true", departamento: usuario.departamento || "", puesto: usuario.puesto || "", numeroEmpleado: usuario.numeroEmpleado || "" });
const SAFE_USER_FIELDS = new Set<keyof FormData>(["nombre", "departamento", "puesto", "numeroEmpleado"]);

export default function UsersPage() {
  const [rows, setRows] = useState<Usuario[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0); const [limit, setLimit] = useState(25); const [query, setQuery] = useState(""); const [debouncedQuery, setDebouncedQuery] = useState(""); const [activeFilter, setActiveFilter] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false); const [editing, setEditing] = useState<Usuario | null>(null); const [form, setForm] = useState<FormData>(emptyForm);
  const [detailUser, setDetailUser] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null); const [menuUser, setMenuUser] = useState<Usuario | null>(null);
  const [activeUsers, setActiveUsers] = useState<Usuario[]>([]); const [assignedCount, setAssignedCount] = useState(0); const [replacementId, setReplacementId] = useState(""); const [checkingAssignments, setCheckingAssignments] = useState(false);
  const [assignedArticles, setAssignedArticles] = useState<AssignedArticle[]>([]); const [transferAll, setTransferAll] = useState(true); const [articleAssignments, setArticleAssignments] = useState<Record<string, string>>({});

  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedQuery(query.trim()); setPage(0); }, 350); return () => window.clearTimeout(timer); }, [query]);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await inventariosApi.get<ApiResponse>("/usuarios", { params: { page: page + 1, limit, ...(debouncedQuery ? { q: debouncedQuery } : {}), ...(activeFilter ? { activo: activeFilter } : {}) }, signal });
      setRows(response.data.data || []); setTotal(response.data.pagination?.total || 0);
    } catch (error) { if (!axios.isCancel(error)) setMessage({ type: "error", text: "No fue posible cargar los empleados." }); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [page, limit, debouncedQuery, activeFilter]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal); return () => controller.abort(); }, [load]);

  const resetReassignment = () => { setReplacementId(""); setAssignedCount(0); setAssignedArticles([]); setTransferAll(true); setArticleAssignments({}); };
  const openCreate = () => { setEditing(null); setForm(emptyForm()); resetReassignment(); setMessage(null); setDrawerOpen(true); };
  const openEdit = (usuario: Usuario) => { setEditing(usuario); setForm(toForm(usuario)); resetReassignment(); setAnchor(null); setDrawerOpen(true); };
  const openDetails = (usuario: Usuario) => { setAnchor(null); setDetailUser(usuario); };
  const set = (field: keyof FormData, value: string) => setForm((current) => ({
    ...current,
    [field]: SAFE_USER_FIELDS.has(field) ? sanitizeSafeText(value) : value,
  }));
  const validate = () => {
    if (!form.nombre.trim() || !form.numeroEmpleado.trim() || !form.correo.trim() || !form.departamento || !form.puesto.trim()) return "Completa nombre, número de empleado, correo, departamento y puesto.";
    if (!/^\S+@\S+\.\S+$/.test(form.correo)) return "Ingresa un correo electrónico válido.";
    if (!editing && !form.clave.trim()) return "La contraseña es obligatoria para un usuario nuevo.";
    if (editing?.activo !== false && form.activo === "false" && assignedCount > 0 && transferAll && !replacementId) return `Selecciona un nuevo resguardante para los ${assignedCount} artículos asignados.`;
    if (editing?.activo !== false && form.activo === "false" && assignedCount > 0 && !transferAll && assignedArticles.some(article => !articleAssignments[article._id])) return "Selecciona un nuevo resguardante para cada artículo.";
    return "";
  };

  useEffect(() => {
    if (!drawerOpen || !editing || editing.activo === false || form.activo !== "false") { setAssignedCount(0); setReplacementId(""); return; }
    const controller = new AbortController();
    const checkAssignments = async () => {
      setCheckingAssignments(true);
      try {
        const [articlesResponse, usersResponse] = await Promise.all([
          inventariosApi.get<ArticlesResponse>(`/usuarios/${editing._id}/articulos`, { params: { page: 1, limit: 1000, fields: "numeroInventario,descripcion" }, signal: controller.signal }),
          inventariosApi.get<ApiResponse>("/usuarios", { params: { page: 1, limit: 100, activo: true }, signal: controller.signal }),
        ]);
        setAssignedCount(articlesResponse.data.pagination?.total || 0);
        setAssignedArticles(articlesResponse.data.data || []);
        setActiveUsers((usersResponse.data.data || []).filter(user => user._id !== editing._id && user.activo === true));
      } catch (error) { if (!axios.isCancel(error)) setMessage({ type: "error", text: "No fue posible comprobar los artículos bajo resguardo." }); }
      finally { if (!controller.signal.aborted) setCheckingAssignments(false); }
    };
    void checkAssignments();
    return () => controller.abort();
  }, [drawerOpen, editing, form.activo]);
  const save = async () => {
    const validation = validate(); if (validation) return setMessage({ type: "error", text: validation });
    setSaving(true); setMessage(null);
    try {
      const payload: Record<string, unknown> = { nombre: form.nombre.trim(), correo: form.correo.trim(), rol: form.rol, activo: form.activo === "true", departamento: form.departamento, puesto: form.puesto.trim(), numeroEmpleado: form.numeroEmpleado.trim() };
      if (form.clave.trim()) payload.clave = form.clave;
      if (editing?.activo !== false && form.activo === "false" && assignedCount > 0) {
        if (transferAll) payload.nuevoResguardante = replacementId;
        else payload.reasignaciones = assignedArticles.map(article => ({ articulo: article._id, resguardante: articleAssignments[article._id] }));
      }
      if (editing) await inventariosApi.patch(`/usuarios/${editing._id}`, payload); else await inventariosApi.post("/usuarios", payload);
      setMessage({ type: "success", text: `Empleado ${editing ? "actualizado" : "agregado"} correctamente.` }); setDrawerOpen(false); await load();
    } catch (error) {
      const data = axios.isAxiosError(error) ? error.response?.data as { message?: string; errors?: string[] } | undefined : undefined;
      setMessage({ type: "error", text: data?.message || data?.errors?.join(" · ") || "No fue posible guardar el empleado. Revisa que nombre y correo no estén repetidos." });
    } finally { setSaving(false); }
  };
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const reassignmentIncomplete = Boolean(editing?.activo !== false && form.activo === "false" && assignedCount > 0 && (transferAll ? !replacementId : assignedArticles.some(article => !articleAssignments[article._id])));

  return <Box sx={{ minHeight: "calc(100vh - 88px)", bgcolor: "#f6f8f8", pt: { xs: 2.5, md: 3 }, pb: 5, px: { xs: 2, md: 4 } }}><Box sx={{ maxWidth: 1500, mx: "auto" }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}><Box><Typography sx={{ color: "#19323a", fontWeight: 900, fontSize: { xs: "1.55rem", md: "1.9rem" }, letterSpacing: "-.035em" }}>Empleados y usuarios</Typography><Typography sx={{ color: "#758286", fontSize: ".78rem", mt: .35 }}>{total.toLocaleString("es-MX")} empleados registrados en el sistema</Typography></Box><Button variant="contained" startIcon={<Plus size={17} />} onClick={openCreate} sx={{ ...drawerPrimaryButtonStyles, minHeight: 42, px: 2.2 }}>Agregar usuario</Button></Box>
    {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2, borderRadius: "12px" }}>{message.text}</Alert>}
    <Paper sx={{ overflow: "hidden", borderRadius: "17px", border: "1px solid #dde5e5", boxShadow: "0 8px 24px rgba(40,62,64,.045)" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, p: 2, borderBottom: "1px solid #e7ecec" }}><TextField fullWidth size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, correo o departamento" sx={{ ...drawerFieldStyles, maxWidth: 520 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={17} /></InputAdornment>, endAdornment: query ? <IconButton size="small" onClick={() => setQuery("")}><X size={15} /></IconButton> : undefined } }} /><TextField select size="small" label="Estado" value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(0); }} sx={{ ...drawerFieldStyles, minWidth: 155 }}><MenuItem value="">Todos</MenuItem><MenuItem value="true">Activos</MenuItem><MenuItem value="false">Inactivos</MenuItem></TextField><Tooltip title="Limpiar filtros"><IconButton onClick={() => { setQuery(""); setActiveFilter(""); setPage(0); }} sx={{ border: "1px solid #dfe6e7", borderRadius: "10px" }}><FilterX size={18} /></IconButton></Tooltip></Box>
      <TableContainer sx={{ minHeight: 430 }}><Table stickyHeader><TableHead><TableRow>{["Empleado", "N.º empleado", "Departamento", "Puesto", "Estado", ""].map((heading) => <TableCell key={heading} sx={{ bgcolor: "#f3f6f6", color: "#697679", fontSize: ".69rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: ".04em" }}>{heading}</TableCell>)}</TableRow></TableHead><TableBody>{loading ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><CircularProgress size={28} /></TableCell></TableRow> : !rows.length ? <TableRow><TableCell colSpan={6} align="center" sx={{ py: 10 }}><UsersRound size={36} color="#aab5b7" /><Typography sx={{ mt: 1, color: "#7d898c" }}>No se encontraron empleados</Typography></TableCell></TableRow> : rows.map((usuario) => <TableRow hover key={usuario._id} onDoubleClick={() => openDetails(usuario)} sx={{ cursor: "pointer", "& td": { borderColor: "#edf0f1" } }}><TableCell><Box sx={{ display: "flex", alignItems: "center", gap: 1.1 }}><Avatar sx={{ width: 34, height: 34, bgcolor: "#e7f0ef", color: "#467a77", fontSize: ".75rem", fontWeight: 800 }}>{usuario.nombre?.slice(0, 1).toUpperCase()}</Avatar><Box><Typography sx={{ fontSize: ".78rem", fontWeight: 800, color: "#34454c" }}>{usuario.nombre}</Typography><Typography sx={{ fontSize: ".67rem", color: "#879295" }}>{usuario.correo}</Typography></Box></Box></TableCell><TableCell sx={{ fontSize: ".75rem", fontWeight: 700 }}>{usuario.numeroEmpleado || "—"}</TableCell><TableCell sx={{ fontSize: ".74rem", maxWidth: 240 }}>{usuario.departamento || "—"}</TableCell><TableCell sx={{ fontSize: ".74rem" }}>{usuario.puesto || "—"}</TableCell><TableCell><Chip size="small" label={usuario.activo === false ? "Inactivo" : "Activo"} sx={{ bgcolor: usuario.activo === false ? "#fae9e7" : "#e7f3eb", color: usuario.activo === false ? "#b55a51" : "#44775a", fontWeight: 750, fontSize: ".67rem" }} /></TableCell><TableCell><IconButton size="small" onClick={(event) => { setAnchor(event.currentTarget); setMenuUser(usuario); }}><MoreHorizontal size={18} /></IconButton></TableCell></TableRow>)}</TableBody></Table></TableContainer>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr auto 1fr" }, alignItems: "center", gap: 2, px: 2, py: 1.5, borderTop: "1px solid #e7ecec" }}><Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: { xs: "center", md: "flex-start" } }}><Select size="small" value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(0); }} sx={{ minWidth: 126, height: 34, borderRadius: "9px", fontSize: ".72rem" }}>{[10,25,50,100].map((value) => <MenuItem key={value} value={value}>{value} empleados</MenuItem>)}</Select><Typography sx={{ color: "#8a9598", fontSize: ".7rem" }}>{total ? `${page * limit + 1}–${Math.min((page + 1) * limit, total)} de ${total}` : "0 empleados"}</Typography></Box><Pagination count={totalPages} page={page + 1} onChange={(_, value) => setPage(value - 1)} siblingCount={1} boundaryCount={1} hidePrevButton hideNextButton shape="rounded" sx={{ justifySelf: "center", "& .MuiPaginationItem-root": { minWidth: 32, height: 32, borderRadius: "8px", fontSize: ".73rem" }, "& .Mui-selected": { bgcolor: "#eef3f3 !important", fontWeight: 850 } }} /><Box sx={{ display: "flex", justifyContent: { xs: "center", md: "flex-end" }, gap: 1 }}><Button size="small" disabled={page === 0} onClick={() => setPage((current) => current - 1)} sx={{ textTransform: "none", color: "#526064" }}>Anterior</Button><Button size="small" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => current + 1)} sx={{ textTransform: "none", color: "#526064" }}>Siguiente</Button></Box></Box>
    </Paper>
    <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}><MenuItem onClick={() => menuUser && openEdit(menuUser)}><Edit3 size={16} />&nbsp; Editar usuario</MenuItem></Menu>
    <Drawer anchor="right" open={Boolean(detailUser)} onClose={() => setDetailUser(null)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 470 }, bgcolor: "#f8fafa" } } }}>
      {detailUser && <Box sx={{ minHeight: "100%", display: "flex", flexDirection: "column" }}>
        <Box sx={{ px: 3, pt: 3, pb: 2.5, bgcolor: "#fff", borderBottom: "1px solid #e5ebeb" }}><Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}><Box><Typography sx={{ color: "#7b898c", fontSize: ".68rem", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Detalles del usuario</Typography><Typography sx={{ color: "#253b40", fontSize: "1.3rem", fontWeight: 900, mt: .4 }}>Información del empleado</Typography></Box><IconButton onClick={() => setDetailUser(null)}><X size={20} /></IconButton></Box></Box>
        <Box sx={{ p: 3, flex: 1 }}><Paper variant="outlined" sx={{ p: 2.5, borderRadius: "18px", borderColor: "#dfe7e7", boxShadow: "0 8px 24px rgba(37,59,64,.04)" }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.6, pb: 2.3, borderBottom: "1px solid #e9eeee" }}><Avatar sx={{ width: 58, height: 58, bgcolor: "#e3efed", color: "#467a77", fontSize: "1.25rem", fontWeight: 900 }}>{detailUser.nombre?.slice(0, 1).toUpperCase()}</Avatar><Box sx={{ minWidth: 0 }}><Typography sx={{ color: "#2d4247", fontSize: "1rem", fontWeight: 850 }}>{detailUser.nombre}</Typography><Chip size="small" icon={<BadgeCheck size={13} />} label={detailUser.activo === false ? "Inactivo" : "Activo"} sx={{ mt: .7, bgcolor: detailUser.activo === false ? "#fae9e7" : "#e7f3eb", color: detailUser.activo === false ? "#b55a51" : "#44775a", fontWeight: 750, fontSize: ".66rem" }} /></Box></Box><Box sx={{ display: "grid", gap: .4, mt: 1.3 }}><DetailRow icon={<Hash size={17} />} label="Número de empleado" value={detailUser.numeroEmpleado} /><DetailRow icon={<Mail size={17} />} label="Correo electrónico" value={detailUser.correo} /><DetailRow icon={<Building2 size={17} />} label="Departamento" value={detailUser.departamento} /><DetailRow icon={<BriefcaseBusiness size={17} />} label="Puesto" value={detailUser.puesto} /></Box></Paper></Box>
        <Box sx={{ p: 2.5, bgcolor: "#fff", borderTop: "1px solid #e1e8e8" }}><Button fullWidth variant="contained" startIcon={<Edit3 size={17} />} onClick={() => { const usuario = detailUser; setDetailUser(null); openEdit(usuario); }} sx={{ ...drawerPrimaryButtonStyles, minHeight: 48 }}>Editar usuario</Button></Box>
      </Box>}
    </Drawer>
    <Drawer anchor="right" open={drawerOpen} onClose={() => !saving && setDrawerOpen(false)} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 500 }, p: 3 } } }}><Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}><Box><Typography sx={{ fontWeight: 850, fontSize: "1.2rem" }}>{editing ? "Editar usuario" : "Agregar usuario"}</Typography><Typography sx={{ color: "#758286", fontSize: ".76rem", mt: .3 }}>{editing ? editing.numeroEmpleado : "Registra un empleado con acceso al sistema"}</Typography></Box><IconButton onClick={() => setDrawerOpen(false)}><X /></IconButton></Box><Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))" }, gap: 1.5 }}><TextField label="Nombre completo" required value={form.nombre} onChange={(event) => set("nombre", event.target.value)} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /><TextField label="Número de empleado" required value={form.numeroEmpleado} onChange={(event) => set("numeroEmpleado", event.target.value)} sx={drawerFieldStyles} /><TextField label="Correo electrónico" required type="email" value={form.correo} onChange={(event) => set("correo", event.target.value)} sx={drawerFieldStyles} /><TextField select label="Departamento" required value={form.departamento} onChange={(event) => set("departamento", event.target.value)} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }}>{DEPARTAMENTOS.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField><TextField label="Puesto" required value={form.puesto} onChange={(event) => set("puesto", event.target.value)} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} /><TextField select label="Rol" value={form.rol} onChange={(event) => set("rol", event.target.value)} sx={drawerFieldStyles}><MenuItem value="User">Usuario</MenuItem><MenuItem value="Admin">Administrador</MenuItem></TextField><TextField select label="Estado" value={form.activo} onChange={(event) => set("activo", event.target.value)} sx={drawerFieldStyles}><MenuItem value="true">Activo</MenuItem><MenuItem value="false">Inactivo</MenuItem></TextField>{!editing && <TextField label="Contraseña" required type="password" value={form.clave} onChange={(event) => set("clave", event.target.value)} sx={{ ...drawerFieldStyles, gridColumn: { sm: "1/-1" } }} />}{editing?.activo !== false && form.activo === "false" && <Box sx={{ gridColumn: { sm: "1/-1" }, p: 1.6, border: "1px solid", borderColor: assignedCount > 0 ? "#efc9bf" : "#dce7e5", borderRadius: "13px", bgcolor: assignedCount > 0 ? "#fff8f5" : "#f5f9f8" }}>{checkingAssignments ? <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><CircularProgress size={18} /><Typography sx={{ fontSize: ".75rem", color: "#66777a" }}>Comprobando artículos asignados...</Typography></Box> : assignedCount > 0 ? <><Alert severity="warning" sx={{ mb: 1.2, borderRadius: "10px" }}>Este empleado tiene <strong>{assignedCount} artículos</strong> bajo resguardo. Todos deben tener un nuevo resguardante.</Alert><FormControlLabel control={<Checkbox checked={transferAll} onChange={(event) => { setTransferAll(event.target.checked); setReplacementId(""); setArticleAssignments({}); }} sx={{ color: "#7b918f", "&.Mui-checked": { color: "#467a77" } }} />} label={<Typography sx={{ fontSize: ".76rem", fontWeight: 800, color: "#405356" }}>Transferir todos los artículos a una sola persona</Typography>} sx={{ mx: 0, mb: 1.2 }} />{transferAll ? <TextField select fullWidth required label="Nuevo resguardante para todos" value={replacementId} onChange={(event) => setReplacementId(event.target.value)} sx={drawerFieldStyles}><MenuItem value="" disabled>Selecciona un empleado activo</MenuItem>{activeUsers.map(user => <MenuItem key={user._id} value={user._id}>{user.nombre}{user.numeroEmpleado ? ` · ${user.numeroEmpleado}` : ""}</MenuItem>)}</TextField> : <Box sx={{ display: "grid", gap: 1, maxHeight: 340, overflowY: "auto", pr: .4 }}>{assignedArticles.map(article => <Box key={article._id} sx={{ p: 1.2, border: "1px solid #e1e8e8", borderRadius: "11px", bgcolor: "#fff" }}><Typography sx={{ fontSize: ".72rem", fontWeight: 850, color: "#35484c" }}>{article.descripcion || "Artículo sin descripción"}</Typography><Typography sx={{ fontSize: ".65rem", color: "#859194", mt: .2, mb: .8 }}>Inventario: {article.numeroInventario || "Sin número"}</Typography><TextField select fullWidth size="small" label="Nuevo resguardante" value={articleAssignments[article._id] || ""} onChange={(event) => setArticleAssignments(current => ({ ...current, [article._id]: event.target.value }))} sx={drawerFieldStyles}><MenuItem value="" disabled>Selecciona un empleado activo</MenuItem>{activeUsers.map(user => <MenuItem key={user._id} value={user._id}>{user.nombre}{user.numeroEmpleado ? ` · ${user.numeroEmpleado}` : ""}</MenuItem>)}</TextField></Box>)}</Box>}</> : <Alert severity="success" sx={{ borderRadius: "10px" }}>Este empleado no tiene artículos bajo resguardo y puede desactivarse.</Alert>}</Box>}<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, gridColumn: { sm: "1/-1" }, mt: 1 }}><Button onClick={() => setDrawerOpen(false)} disabled={saving} sx={drawerSecondaryButtonStyles}>Cancelar</Button><Button onClick={() => void save()} disabled={saving || checkingAssignments || reassignmentIncomplete} startIcon={<UserRound size={16} />} sx={drawerPrimaryButtonStyles}>{saving ? "Guardando..." : editing ? "Guardar cambios" : "Agregar usuario"}</Button></Box></Box></Drawer>
  </Box></Box>;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return <Box sx={{ display: "flex", alignItems: "center", gap: 1.3, py: 1.25, borderBottom: "1px solid #edf1f1", "&:last-child": { borderBottom: 0 } }}><Box sx={{ width: 35, height: 35, borderRadius: "10px", bgcolor: "#edf4f3", color: "#57807d", display: "grid", placeItems: "center", flexShrink: 0 }}>{icon}</Box><Box sx={{ minWidth: 0 }}><Typography sx={{ color: "#919c9e", fontSize: ".63rem", fontWeight: 750, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</Typography><Typography sx={{ color: "#34474b", fontSize: ".78rem", fontWeight: 750, mt: .15, overflowWrap: "anywhere" }}>{value || "No especificado"}</Typography></Box></Box>;
}



