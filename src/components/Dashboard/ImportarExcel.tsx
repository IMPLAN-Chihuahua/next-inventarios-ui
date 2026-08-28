"use client";

import { ChangeEvent, DragEvent, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import { AlertCircle, CheckCircle2, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import axios from "axios";
import { inventariosApi } from "@/src/services/axios";

interface ImportError {
  fila: number;
  numeroInventario?: string;
  mensaje: string;
}

interface ImportResult {
  importados: number;
  rechazados: number;
  errores: ImportError[];
}

interface Props {
  onImported: () => void;
}

const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ImportarExcel({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const selectFile = (candidate?: File) => {
    setResult(null);
    setErrorMessage("");

    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setErrorMessage("Selecciona un archivo con extensión .xlsx.");
      return;
    }
    if (candidate.size > MAX_FILE_SIZE) {
      setFile(null);
      setErrorMessage("El archivo no puede pesar más de 10 MB.");
      return;
    }

    setFile(candidate);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const { data } = await inventariosApi.post<ImportResult>("/articulos/importar", file, {
        headers: { "Content-Type": EXCEL_MIME },
        timeout: 120000,
      });
      setResult(data);
      if (data.importados > 0) onImported();
    } catch (error) {
      console.error(error);
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as { message?: string } | undefined;
        setErrorMessage(data?.message || "No fue posible importar el archivo.");
      } else {
        setErrorMessage("No fue posible importar el archivo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flex: 1, minHeight: 0, flexDirection: "column", gap: 1.25 }}>
      <Typography sx={{ color: "#778386", fontSize: "0.72rem", lineHeight: 1.45 }}>
        Agregar multiples articulos desde archivo Excel.
      </Typography>

      <Box
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && !loading) inputRef.current?.click();
        }}
        sx={{
          minHeight: 108,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.8,
          px: 2,
          py: 1.5,
          cursor: loading ? "default" : "pointer",
          border: "1.5px dashed",
          borderColor: dragging ? "#467a77" : "#cddadb",
          borderRadius: "14px",
          bgcolor: dragging ? "#eef6f5" : "#fafcfc",
          transition: "all 160ms ease",
          "&:hover": loading ? {} : { borderColor: "#709c99", bgcolor: "#f4f8f8" },
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={handleInputChange} />
        <Box sx={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: "10px", color: "#467a77", bgcolor: "#e5f0ef" }}>
          <UploadCloud size={20} />
        </Box>
        <Typography sx={{ color: "#344346", fontSize: "0.78rem", fontWeight: 750, textAlign: "center" }}>
          Arrastra el Excel o haz clic para elegirlo
        </Typography>
        <Typography sx={{ color: "#909a9c", fontSize: "0.66rem" }}>.xlsx · máximo 10 MB</Typography>
      </Box>

      {file && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
          <FileSpreadsheet size={17} color="#467a77" />
          <Typography noWrap sx={{ flex: 1, minWidth: 0, color: "#465457", fontSize: "0.72rem", fontWeight: 650 }}>
            {file.name}
          </Typography>
          <Button
            aria-label="Quitar archivo"
            onClick={() => setFile(null)}
            disabled={loading}
            sx={{ minWidth: 28, width: 28, height: 28, p: 0, color: "#7b8789", borderRadius: "8px" }}
          >
            <X size={15} />
          </Button>
        </Box>
      )}

      {errorMessage && (
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.8, color: "#b33b3b" }}>
          <AlertCircle size={15} style={{ marginTop: 1, flexShrink: 0 }} />
          <Typography sx={{ fontSize: "0.69rem", lineHeight: 1.35 }}>{errorMessage}</Typography>
        </Box>
      )}

      <Button
        variant="contained"
        onClick={handleImport}
        disabled={!file || loading}
        startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <UploadCloud size={16} />}
        sx={{
          mt: "auto",
          minHeight: 38,
          borderRadius: "10px",
          bgcolor: "#467a77",
          boxShadow: "none",
          textTransform: "none",
          fontSize: "0.75rem",
          fontWeight: 750,
          "&:hover": { bgcolor: "#385f5d", boxShadow: "none" },
        }}
      >
        {loading ? "Importando artículos..." : "Importar artículos"}
      </Button>

      <Dialog
        open={Boolean(result)}
        onClose={() => setResult(null)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="resultado-importacion-title"
        slotProps={{ paper: { sx: { borderRadius: "20px", overflow: "hidden" } } }}
      >
        {result && (
          <>
            <DialogTitle
              id="resultado-importacion-title"
              sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, px: 2.5, py: 2, borderBottom: "1px solid #e7eeee" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.1 }}>
                <Box sx={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "11px", bgcolor: result.rechazados > 0 ? "#fff0e8" : "#e7f2ef" }}>
                  {result.rechazados > 0 ? <AlertCircle size={21} color="#a64d25" /> : <CheckCircle2 size={21} color="#467a77" />}
                </Box>
                <Box>
                  <Typography sx={{ color: "#263638", fontSize: "1rem", fontWeight: 850 }}>
                    Resultado de la importación
                  </Typography>
                  <Typography sx={{ mt: 0.2, color: "#7d898c", fontSize: "0.7rem" }}>
                    Revisa los artículos procesados antes de continuar.
                  </Typography>
                </Box>
              </Box>
              <IconButton aria-label="Cerrar resultado" onClick={() => setResult(null)} size="small" sx={{ color: "#788588" }}>
                <X size={18} />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: "20px !important" }}>
              <Box aria-live="polite" sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", mb: result.rechazados > 0 ? 1.5 : 0 }}>
                <Chip size="small" label={`${result.importados} importados correctamente`} sx={{ height: 28, bgcolor: "#e7f2ef", color: "#356864", fontSize: "0.7rem", fontWeight: 750 }} />
                {result.rechazados > 0 && (
                  <Chip size="small" label={`${result.rechazados} no se importaron`} sx={{ height: 28, bgcolor: "#fff0e8", color: "#a64d25", fontSize: "0.7rem", fontWeight: 750 }} />
                )}
              </Box>

              {result.rechazados > 0 && (
                <Box sx={{ overflow: "hidden", border: "1px solid #f0c9b8", borderRadius: "14px", bgcolor: "#fffaf7" }}>
                  <Box sx={{ px: 1.5, py: 1.1, borderBottom: "1px solid #f2d9ce", bgcolor: "#fff4ee" }}>
                    <Typography sx={{ color: "#8c3f24", fontSize: "0.76rem", fontWeight: 800 }}>
                      Datos que no se importaron
                    </Typography>
                    <Typography sx={{ mt: 0.15, color: "#9b6a57", fontSize: "0.66rem" }}>
                      Corrige estas filas en el Excel y vuelve a importarlas.
                    </Typography>
                  </Box>

                  <Box sx={{ maxHeight: 310, overflowY: "auto", p: 0.8 }}>
                    {result.errores.map((item) => (
                      <Box
                        key={`${item.fila}-${item.numeroInventario ?? "sin-inventario"}`}
                        sx={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: 1, px: 0.9, py: 0.9, borderRadius: "10px", "&:not(:last-of-type)": { mb: 0.5 }, "&:nth-of-type(odd)": { bgcolor: "#fff4ee" } }}
                      >
                        <Box sx={{ minWidth: 48, px: 0.7, py: 0.4, alignSelf: "start", borderRadius: "7px", bgcolor: "#f8dfd3", color: "#914323", fontSize: "0.64rem", fontWeight: 800, textAlign: "center" }}>
                          Fila {item.fila}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ color: "#5d3d32", fontSize: "0.71rem", fontWeight: 750, overflowWrap: "anywhere" }}>
                            {item.numeroInventario ? `Inventario: ${item.numeroInventario}` : "Sin número de inventario"}
                          </Typography>
                          <Typography sx={{ mt: 0.15, color: "#875d4e", fontSize: "0.68rem", lineHeight: 1.4, overflowWrap: "anywhere" }}>
                            {item.mensaje}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: "1px solid #e7eeee" }}>
              <Button onClick={() => setResult(null)} variant="contained" sx={{ minWidth: 110, borderRadius: "10px", bgcolor: "#467a77", boxShadow: "none", textTransform: "none", fontWeight: 750, "&:hover": { bgcolor: "#385f5d", boxShadow: "none" } }}>
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
