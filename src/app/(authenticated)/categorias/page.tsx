"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Paper, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from "@mui/material";
import { Activity, Boxes, Edit3, Plus, Search, Tags, X } from "lucide-react";
import axios from "axios";
import { inventariosApi } from "@/src/services/axios";
import { drawerFieldStyles, drawerPrimaryButtonStyles, drawerSecondaryButtonStyles } from "@/src/app/(authenticated)/componentsModal/drawersUI/CenteredDrawer";
import { sanitizeSafeText } from "@/src/utils/safeText";

type CatalogType = "categorias" | "estados";
interface CatalogItem { _id: string; tipo?: string; nombre?: string; descripcion?: string; articulos: number; valores?: string[] }
interface RelatedArticle { _id: string; numeroInventario: string; descripcion?: string; estado?: string; categoria?: { tipo?: string } | string; resguardante?: { nombre?: string } | string }
const list = <T,>(value: unknown): T[] => { if (Array.isArray(value)) return value as T[]; if (!value || typeof value !== "object") return []; const data = (value as { data?: unknown }).data; return Array.isArray(data) ? data as T[] : []; };
const itemName = (item: CatalogItem) => item.tipo || item.nombre || "Sin nombre";

export default function CategoriasPage() {
  const [tab, setTab] = useState<CatalogType>("categorias");
  const [categorias, setCategorias] = useState<CatalogItem[]>([]); const [estados, setEstados] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true); const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false); const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null); const [name, setName] = useState(""); const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false); const [relatedOpen, setRelatedOpen] = useState(false); const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedSource, setRelatedSource] = useState<CatalogItem | null>(null); const [relatedArticles, setRelatedArticles] = useState<RelatedArticle[]>([]); const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [categoryResponse, stateResponse] = await Promise.all([inventariosApi.get("/categorias/con-conteo"), inventariosApi.get("/estados")]);
      setCategorias(list<CatalogItem>(categoryResponse.data)); setEstados(list<CatalogItem>(stateResponse.data));
    } catch { setMessage({ type: "error", text: "No fue posible cargar los catálogos." }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const items = tab === "categorias" ? categorias : estados;
  const filtered = useMemo(() => { const term = query.trim().toLocaleLowerCase("es-MX"); return term ? items.filter((item) => `${itemName(item)} ${item.descripcion || ""}`.toLocaleLowerCase("es-MX").includes(term)) : items; }, [items, query]);
  const openRelated = async (item: CatalogItem) => {
    setRelatedSource(item); setRelatedArticles([]); setRelatedOpen(true); setRelatedLoading(true);
    try {
      const filter = tab === "categorias" ? { categorias: item._id } : { estados: (item.valores?.length ? item.valores : [itemName(item)]).join(",") };
      const response = await inventariosApi.get("/articulos", { params: { ...filter, limit: 1000, page: 1, fields: "numeroInventario,descripcion,estado,categoria,resguardante" } });
      setRelatedArticles(list<RelatedArticle>(response.data));
    } catch { setMessage({ type: "error", text: "No fue posible cargar los artículos relacionados." }); setRelatedOpen(false); }
    finally { setRelatedLoading(false); }
  };
  const manageRelatedArticles = () => {
    if (!relatedSource || !relatedArticles.length) return;
    window.sessionStorage.setItem("articulos_preseleccionados", JSON.stringify({
      ids: relatedArticles.map((article) => article._id),
      ...(tab === "categorias" ? { categoria: relatedSource._id } : { estado: itemName(relatedSource) })
    }));
    window.location.href = "/articulos";
  };
  const openCreate = () => { setEditing(null); setName(""); setDescription(""); setMessage(null); setDialogOpen(true); };
  const openEdit = (item: CatalogItem) => { setEditing(item); setName(itemName(item)); setDescription(item.descripcion || ""); setMessage(null); setDialogOpen(true); };
  const requestSave = () => { if (!name.trim()) return setMessage({ type: "error", text: `Escribe el nombre ${tab === "categorias" ? "de la categoría" : "del estado"}.` }); if (editing) setConfirmOpen(true); else void save(); };
  const save = async () => {
    setSaving(true); setMessage(null);
    try {
      const payload = tab === "categorias" ? { tipo: name.trim(), descripcion: description.trim() || undefined } : { nombre: name.trim(), descripcion: description.trim() || undefined };
      if (editing) await inventariosApi.patch(`/${tab}/${editing._id}`, payload); else await inventariosApi.post(`/${tab}`, payload);
      setMessage({ type: "success", text: `${tab === "categorias" ? "Categoría" : "Estado"} ${editing ? "actualizado" : "agregado"} correctamente.` });
      setDialogOpen(false); setConfirmOpen(false); await load();
    } catch (error) {
      const response = axios.isAxiosError(error) ? error.response?.data as { message?: string; errors?: string[] } | undefined : undefined;
      setMessage({ type: "error", text: response?.message || response?.errors?.join(" · ") || "No fue posible guardar los cambios." }); setConfirmOpen(false);
    } finally { setSaving(false); }
  };

  return <Box sx={{ minHeight: "calc(100vh - 88px)", bgcolor: "#f6f8f8", pt: { xs: 2.5, md: 3 }, pb: 5, px: { xs: 2, md: 4 } }}><Box sx={{ maxWidth: 1400, mx: "auto" }}>
    <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 2.2 }}><Box><Typography sx={{ color: "#19323a", fontWeight: 900, fontSize: { xs: "1.55rem", md: "1.9rem" }, letterSpacing: "-.035em" }}>Catálogos del inventario</Typography><Typography sx={{ color: "#758286", fontSize: ".78rem", mt: .35 }}>Administra categorías y estados sin perder su relación con los artículos.</Typography></Box><Button variant="contained" startIcon={<Plus size={17} />} onClick={openCreate} sx={{ ...drawerPrimaryButtonStyles, minHeight: 42 }}>Agregar {tab === "categorias" ? "categoría" : "estado"}</Button></Box>
    {message && <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2, borderRadius: "12px" }}>{message.text}</Alert>}
    <Paper sx={{ overflow: "hidden", borderRadius: "17px", border: "1px solid #dde5e5", boxShadow: "0 8px 24px rgba(40,62,64,.045)" }}><Tabs value={tab} onChange={(_, value) => { setTab(value); setQuery(""); setMessage(null); }} sx={{ px: 2, borderBottom: "1px solid #e7ecec", "& .MuiTab-root": { minHeight: 54, textTransform: "none", fontWeight: 800 }, "& .Mui-selected": { color: "#467a77 !important" }, "& .MuiTabs-indicator": { bgcolor: "#467a77" } }}><Tab value="categorias" icon={<Tags size={17} />} iconPosition="start" label={`Categorías (${categorias.length})`} /><Tab value="estados" icon={<Activity size={17} />} iconPosition="start" label={`Estados (${estados.length})`} /></Tabs>
      <Box sx={{ p: 2, borderBottom: "1px solid #e7ecec" }}><TextField size="small" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Buscar ${tab}...`} sx={{ ...drawerFieldStyles, maxWidth: 420 }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={17} /></InputAdornment>, endAdornment: query ? <IconButton size="small" onClick={() => setQuery("")}><X size={15} /></IconButton> : undefined } }} /></Box>
      <Box sx={{ p: { xs: 2, md: 2.5 }, minHeight: 390, bgcolor: "#f8fafa" }}>
        {loading ? <Box sx={{ display: "grid", placeItems: "center", py: 12 }}><CircularProgress size={28} /></Box> : !filtered.length ? <Box sx={{ py: 11, textAlign: "center" }}><Boxes size={36} color="#a5b0b2" /><Typography sx={{ mt: 1, color: "#839093", fontSize: ".8rem" }}>No se encontraron resultados.</Typography></Box> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2,minmax(0,1fr))", lg: "repeat(3,minmax(0,1fr))" }, gap: 1.6 }}>
          {filtered.map((item, index) => { const isCategory = tab === "categorias"; const accent = isCategory ? ["#467a77", "#e7f1f0"] : ["#5081a5", "#eaf1f5"]; return <Paper key={item._id} sx={{ position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 190, p: 2.1, borderRadius: "16px", border: "1px solid #dfe7e7", boxShadow: "0 5px 16px rgba(42,64,66,.045)", transition: "transform .2s ease, box-shadow .2s ease", "&:hover": { transform: "translateY(-3px)", boxShadow: "0 11px 24px rgba(42,64,66,.09)" } }}>
            <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, bgcolor: accent[0] }} />
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1.2 }}><Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}><Box sx={{ width: 42, height: 42, flexShrink: 0, display: "grid", placeItems: "center", borderRadius: "12px", bgcolor: accent[1], color: accent[0] }}>{isCategory ? <Tags size={20} /> : <Activity size={20} />}</Box><Box sx={{ minWidth: 0 }}><Typography noWrap sx={{ color: "#263b41", fontWeight: 850, fontSize: ".92rem" }}>{itemName(item)}</Typography><Typography sx={{ color: "#9aa4a6", fontSize: ".65rem", mt: .2 }}>#{String(index + 1).padStart(2, "0")}</Typography></Box></Box><IconButton size="small" onClick={() => openEdit(item)} sx={{ color: "#657579", bgcolor: "#f4f7f7", "&:hover": { bgcolor: accent[1], color: accent[0] } }}><Edit3 size={15} /></IconButton></Box>
            <Typography sx={{ flex: 1, mt: 1.6, color: item.descripcion ? "#667579" : "#a0aaac", fontSize: ".75rem", lineHeight: 1.55 }}>{item.descripcion || "Sin descripción agregada."}</Typography>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mt: 1.7, pt: 1.35, borderTop: "1px solid #edf1f1" }}><Button disabled={!item.articulos} onClick={() => item.articulos > 0 && void openRelated(item)} size="small" sx={{ minWidth: 0, p: 0, color: item.articulos ? accent[0] : "#9ba5a7", textTransform: "none", fontSize: ".7rem", fontWeight: 800, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}>{item.articulos.toLocaleString("es-MX")} artículo{item.articulos === 1 ? "" : "s"} vinculado{item.articulos === 1 ? "" : "s"}</Button><Typography sx={{ color: "#a0aaac", fontSize: ".64rem" }}>{isCategory ? "Categoría" : "Estado"}</Typography></Box>
          </Paper>; })}
        </Box>}
      </Box>
    </Paper>
    <Dialog open={relatedOpen} onClose={() => setRelatedOpen(false)} fullWidth maxWidth="md" slotProps={{ paper: { sx: { borderRadius: "18px" } } }}><DialogTitle sx={{ borderBottom: "1px solid #e7ecec" }}><Typography sx={{ fontWeight: 850 }}>Artículos relacionados</Typography><Typography sx={{ color: "#7a878a", fontSize: ".72rem", mt: .3 }}>{itemName(relatedSource || { _id: "", articulos: 0 })} · {relatedArticles.length} artículo(s)</Typography></DialogTitle><DialogContent sx={{ pt: "20px !important" }}>
      {relatedLoading ? <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress size={27} /></Box> : !relatedArticles.length ? <Typography sx={{ py: 7, textAlign: "center", color: "#839093", fontSize: ".8rem" }}>No hay artículos relacionados.</Typography> : <TableContainer sx={{ maxHeight: 420, border: "1px solid #e4eaea", borderRadius: "12px" }}><Table stickyHeader size="small"><TableHead><TableRow><TableCell>N.º inventario</TableCell><TableCell>Descripción</TableCell><TableCell>Estado</TableCell><TableCell>Resguardante</TableCell></TableRow></TableHead><TableBody>{relatedArticles.map((article) => <TableRow hover key={article._id}><TableCell sx={{ fontSize: ".74rem", fontWeight: 800 }}>{article.numeroInventario}</TableCell><TableCell sx={{ fontSize: ".74rem" }}>{article.descripcion || "—"}</TableCell><TableCell sx={{ fontSize: ".74rem" }}>{article.estado || "—"}</TableCell><TableCell sx={{ fontSize: ".74rem" }}>{typeof article.resguardante === "object" ? article.resguardante.nombre || "—" : "—"}</TableCell></TableRow>)}</TableBody></Table></TableContainer>}
    </DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={() => setRelatedOpen(false)} sx={drawerSecondaryButtonStyles}>Cerrar</Button><Button onClick={manageRelatedArticles} disabled={relatedLoading || !relatedArticles.length} sx={drawerPrimaryButtonStyles}>Gestionar en Artículos</Button></DialogActions></Dialog>    <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { borderRadius: "18px" } } }}><DialogTitle sx={{ fontWeight: 850, borderBottom: "1px solid #e7ecec" }}>{editing ? "Editar" : "Agregar"} {tab === "categorias" ? "categoría" : "estado"}</DialogTitle><DialogContent sx={{ pt: "22px !important", display: "grid", gap: 2 }}><TextField autoFocus label="Nombre" value={name} onChange={(event) => setName(sanitizeSafeText(event.target.value))} sx={drawerFieldStyles} /><TextField label="Descripción" multiline minRows={3} value={description} onChange={(event) => setDescription(sanitizeSafeText(event.target.value))} sx={drawerFieldStyles} />{editing && <Alert severity="info" sx={{ borderRadius: "11px" }}>{editing.articulos.toLocaleString("es-MX")} artículo(s) utilizan actualmente {tab === "categorias" ? "esta categoría" : "este estado"}.</Alert>}</DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={() => setDialogOpen(false)} disabled={saving} sx={drawerSecondaryButtonStyles}>Cancelar</Button><Button onClick={requestSave} disabled={saving || !name.trim()} sx={drawerPrimaryButtonStyles}>{editing ? "Revisar cambios" : "Agregar"}</Button></DialogActions></Dialog>
    <Dialog open={confirmOpen} onClose={() => !saving && setConfirmOpen(false)} fullWidth maxWidth="xs" slotProps={{ paper: { sx: { borderRadius: "18px" } } }}><DialogTitle sx={{ fontWeight: 850, borderBottom: "1px solid #e7ecec" }}>¿Estás seguro de aplicar los cambios?</DialogTitle><DialogContent sx={{ pt: "20px !important" }}><Typography sx={{ color: "#5f6e72", fontSize: ".82rem", lineHeight: 1.6 }}>Se actualizará <b>{itemName(editing || { _id: "", articulos: 0 })}</b> a <b>{name.trim()}</b>.</Typography><Alert severity="warning" sx={{ mt: 2, borderRadius: "11px" }}>{editing?.articulos.toLocaleString("es-MX")} artículo(s) se verán reflejados con este cambio.{tab === "estados" ? " El estado se actualizará en cada artículo relacionado." : ""}</Alert></DialogContent><DialogActions sx={{ px: 3, pb: 2.5 }}><Button onClick={() => setConfirmOpen(false)} disabled={saving} sx={drawerSecondaryButtonStyles}>Cancelar</Button><Button onClick={() => void save()} disabled={saving} sx={drawerPrimaryButtonStyles}>{saving ? "Guardando..." : "Sí, aplicar cambios"}</Button></DialogActions></Dialog>
  </Box></Box>;
}




