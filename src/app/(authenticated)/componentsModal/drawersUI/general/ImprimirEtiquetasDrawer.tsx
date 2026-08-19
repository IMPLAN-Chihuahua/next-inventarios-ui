"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import QRCode from "react-qr-code";
import { useReactToPrint } from "react-to-print";
import CenteredDrawer, {
  drawerFieldStyles,
  drawerPrimaryButtonStyles,
  drawerSecondaryButtonStyles,
} from "../CenteredDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Articulo {
  id?: string;
  _id?: string;
  descripcion?: string;
  numeroInventario?: string;
  marca?: string;
  modelo?: string;
  noSerie?: string;
}

const getList = (json: unknown): Articulo[] => {
  if (Array.isArray(json)) return json as Articulo[];
  if (!json || typeof json !== "object") return [];

  const response = json as Record<string, unknown>;
  const list = response.data ?? response.items;
  return Array.isArray(list) ? (list as Articulo[]) : [];
};

const getArticuloId = (articulo: Articulo) => articulo.id || articulo._id || "";
const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");

export default function ImprimirEtiquetasDrawer({ open, onClose }: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [resultados, setResultados] = useState<Articulo[]>([]);
  const [seleccionados, setSeleccionados] = useState<Record<string, Articulo>>({});
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  const articulosSeleccionados = useMemo(() => Object.values(seleccionados), [seleccionados]);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Etiquetas-QR-Inventario",
    pageStyle: `
      @page { margin: 8mm; }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .qr-print-sheet {
          display: grid !important;
          grid-template-columns: repeat(2, 268.8px) !important;
          justify-content: center !important;
          gap: 8px !important;
          max-height: none !important;
          overflow: visible !important;
          padding: 0 !important;
          border: 0 !important;
        }
        .qr-print-label {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
      }
    `,
  });

  useEffect(() => {
    const debounce = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(debounce);
  }, [search]);

  const buscarArticulos = useCallback(async (query: string, signal: AbortSignal) => {
    if (query.length < 2) {
      setResultados([]);
      setSearchError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setSearchError("");
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "100",
        fields: "descripcion,numeroInventario,marca,modelo,noSerie",
      });
      const response = await fetch(`/api/v1/articulos?${params.toString()}`, { signal });

      if (!response.ok) throw new Error("No fue posible buscar los artículos.");

      const normalizedQuery = normalizeText(query);
      const articulos = getList(await response.json()).filter((articulo) => {
        const descripcion = normalizeText(articulo.descripcion || "");
        const numeroInventario = normalizeText(articulo.numeroInventario || "");
        return descripcion.includes(normalizedQuery) || numeroInventario.includes(normalizedQuery);
      });
      setResultados(articulos);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error(error);
      setResultados([]);
      setSearchError("Ocurrió un error al buscar los artículos.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    const busqueda = window.setTimeout(() => {
      void buscarArticulos(debouncedSearch, controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(busqueda);
      controller.abort();
    };
  }, [open, debouncedSearch, buscarArticulos]);

  const toggleArticulo = (articulo: Articulo) => {
    const id = getArticuloId(articulo);
    if (!id) return;

    setSeleccionados((current) => {
      const next = { ...current };
      if (next[id]) delete next[id];
      else next[id] = articulo;
      return next;
    });
  };

  const seleccionarResultados = () => {
    setSeleccionados((current) => {
      const next = { ...current };
      resultados.forEach((articulo) => {
        const id = getArticuloId(articulo);
        if (id) next[id] = articulo;
      });
      return next;
    });
  };

  const eliminarSeleccion = (articulo: Articulo) => {
    const id = getArticuloId(articulo);
    setSeleccionados((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };

  const handleClose = () => {
    setSearch("");
    setDebouncedSearch("");
    setResultados([]);
    setSeleccionados({});
    setSearchError("");
    onClose();
  };

  const actions = (
    <>
      <Button onClick={handleClose} sx={drawerSecondaryButtonStyles}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={() => handlePrint()}
        disabled={articulosSeleccionados.length === 0}
        startIcon={<QrCode2RoundedIcon />}
        sx={drawerPrimaryButtonStyles}
      >
        Generar e imprimir ({articulosSeleccionados.length})
      </Button>
    </>
  );

  return (
    <CenteredDrawer
      open={open}
      onClose={handleClose}
      title="Imprimir etiquetas QR"
      subtitle="Busca por descripción o número de inventario y conserva tus selecciones."
      icon={<QrCode2RoundedIcon />}
      actions={actions}
      size="standard"
    >
      <TextField
        fullWidth
        autoFocus
        label="Buscar artículo"
        placeholder='Ej. "sill" o "5110100107-1"'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={drawerFieldStyles}
        slotProps={{
          input: {
            startAdornment: <SearchRoundedIcon sx={{ color: "#829092", mr: 1 }} />,
            endAdornment: search ? (
              <IconButton size="small" aria-label="Limpiar búsqueda" onClick={() => setSearch("")}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            ) : undefined,
          },
        }}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mt: 2,
          mb: 1,
        }}
      >
        <Typography sx={{ color: "#354447", fontSize: "0.82rem", fontWeight: 750 }}>
          Resultados {debouncedSearch.length >= 2 ? `(${resultados.length})` : ""}
        </Typography>
        {resultados.length > 0 && (
          <Button
            size="small"
            onClick={seleccionarResultados}
            sx={{ color: "#467a77", textTransform: "none", fontWeight: 700 }}
          >
            Seleccionar resultados
          </Button>
        )}
      </Box>

      <Box
        sx={{
          minHeight: 220,
          maxHeight: 330,
          overflowY: "auto",
          border: "1px solid #e3e9ea",
          borderRadius: "14px",
          bgcolor: "#fbfcfc",
          p: 0.75,
        }}
      >
        {loading ? (
          <Box sx={{ minHeight: 205, display: "grid", placeItems: "center" }}>
            <Box sx={{ textAlign: "center" }}>
              <CircularProgress size={28} sx={{ color: "#467a77" }} />
              <Typography sx={{ color: "#7b898c", fontSize: "0.76rem", mt: 1 }}>
                Buscando artículos...
              </Typography>
            </Box>
          </Box>
        ) : searchError ? (
          <Alert severity="error" sx={{ borderRadius: "10px" }}>
            {searchError}
          </Alert>
        ) : debouncedSearch.length < 2 ? (
          <Box sx={{ minHeight: 205, display: "grid", placeItems: "center", textAlign: "center", px: 3 }}>
            <Box>
              <SearchRoundedIcon sx={{ color: "#a8b3b5", fontSize: 34 }} />
              <Typography sx={{ color: "#647275", fontSize: "0.8rem", fontWeight: 700, mt: 0.75 }}>
                Escribe al menos dos caracteres
              </Typography>
              <Typography sx={{ color: "#939ea0", fontSize: "0.7rem", mt: 0.4 }}>
                Busca coincidencias parciales en la descripción o el número de inventario.
              </Typography>
            </Box>
          </Box>
        ) : resultados.length === 0 ? (
          <Box sx={{ minHeight: 205, display: "grid", placeItems: "center", textAlign: "center", px: 3 }}>
            <Typography sx={{ color: "#7b898c", fontSize: "0.78rem" }}>
              No se encontraron artículos que coincidan con “{debouncedSearch}”.
            </Typography>
          </Box>
        ) : (
          resultados.map((articulo) => {
            const id = getArticuloId(articulo);
            const selected = Boolean(seleccionados[id]);

            return (
              <ButtonBase
                key={id}
                onClick={() => toggleArticulo(articulo)}
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "flex-start",
                  textAlign: "left",
                  gap: 1,
                  p: 1.25,
                  mb: 0.5,
                  border: "1px solid",
                  borderColor: selected ? "#9cbfbd" : "transparent",
                  borderRadius: "10px",
                  bgcolor: selected ? "#edf5f4" : "#ffffff",
                  transition: "all 140ms ease",
                  "&:last-of-type": { mb: 0 },
                  "&:hover": { bgcolor: selected ? "#e7f1f0" : "#f3f7f7" },
                }}
              >
                <Checkbox
                  checked={selected}
                  tabIndex={-1}
                  disableRipple
                  sx={{ color: "#9aabad", "&.Mui-checked": { color: "#467a77" } }}
                />
                <Box sx={{ minWidth: 0, py: 0.35 }}>
                  <Typography sx={{ color: "#344447", fontSize: "0.8rem", fontWeight: 700 }}>
                    {articulo.descripcion || "Artículo sin descripción"}
                  </Typography>
                  <Typography sx={{ color: "#849093", fontSize: "0.68rem", mt: 0.35 }}>
                    Inventario: {articulo.numeroInventario || "Sin número"}
                    {articulo.marca ? ` · ${articulo.marca}` : ""}
                    {articulo.modelo ? ` ${articulo.modelo}` : ""}
                  </Typography>
                </Box>
              </ButtonBase>
            );
          })
        )}
      </Box>

      {articulosSeleccionados.length > 0 && (
        <>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography sx={{ color: "#354447", fontSize: "0.78rem", fontWeight: 750 }}>
                Seleccionados ({articulosSeleccionados.length})
              </Typography>
              <Button
                size="small"
                onClick={() => setSeleccionados({})}
                sx={{ color: "#7b898c", textTransform: "none", fontSize: "0.7rem" }}
              >
                Limpiar selección
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, maxHeight: 82, overflowY: "auto" }}>
              {articulosSeleccionados.map((articulo) => (
                <Chip
                  key={getArticuloId(articulo)}
                  label={articulo.numeroInventario || articulo.descripcion || "Artículo"}
                  onDelete={() => eliminarSeleccion(articulo)}
                  size="small"
                  sx={{ bgcolor: "#eaf2f2", color: "#3d6462", fontWeight: 650, fontSize: "0.68rem" }}
                />
              ))}
            </Box>
          </Box>

          <Typography sx={{ color: "#354447", fontSize: "0.78rem", fontWeight: 750, mt: 2, mb: 1 }}>
            Vista previa de impresión
          </Typography>
          <Box
            ref={printRef}
            className="qr-print-sheet"
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, 268.8px)",
              justifyContent: "center",
              gap: 1,
              maxHeight: 200,
              overflowY: "auto",
              p: 1,
              border: "1px solid #e3e9ea",
              borderRadius: "14px",
              bgcolor: "#ffffff",
            }}
          >
            {articulosSeleccionados.map((articulo) => (
              <Box
                key={getArticuloId(articulo)}
                className="qr-print-label"
                sx={{
                  boxSizing: "border-box",
                  width: "268.8px",
                  height: "84.48px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 1,
                  border: "1px solid #111111",
                  borderRadius: "4px",
                  bgcolor: "#ffffff",
                  overflow: "hidden",
                }}
              >
                <Box sx={{ width: 45, height: 45, flexShrink: 0 }}>
                  <QRCode
                    value={getArticuloId(articulo)}
                    size={45}
                    style={{ display: "block", width: "100%", height: "100%" }}
                    viewBox="0 0 256 256"
                  />
                </Box>
                <Typography
                  sx={{ color: "#000000", fontSize: "9px", fontWeight: 800, lineHeight: 1.05, textAlign: "center", mt: 0.25 }}
                >
                  {articulo.numeroInventario || "Sin número de inventario"}
                </Typography>
                <Typography
                  title={articulo.descripcion}
                  sx={{
                    width: 80,
                    color: "#000000",
                    fontSize: "5px",
                    lineHeight: 1,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    mt: 0.2,
                  }}
                >
                  {articulo.descripcion || "Artículo sin descripción"}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      )}
    </CenteredDrawer>
  );
}
