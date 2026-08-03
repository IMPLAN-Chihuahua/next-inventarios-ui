"use client";

import { Box, TextField, Button } from "@mui/material";
import CenteredDrawer from "../CenteredDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImprimirEtiquetasDrawer({ open, onClose }: Props) {
  return (
    <CenteredDrawer open={open} onClose={onClose} title="Imprimir Etiquetas QR">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField fullWidth label="Buscar artículo o categoría" />
        <Button variant="contained" onClick={onClose}>
          Generar e imprimir
        </Button>
      </Box>
    </CenteredDrawer>
  );
}