"use client";

import { Box, TextField, Button } from "@mui/material";
import CenteredDrawer from "../CenteredDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DescargarResguardosDrawer({ open, onClose }: Props) {
  return (
    <CenteredDrawer open={open} onClose={onClose} title="Descargar Resguardos">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField 
          fullWidth 
          label="Desde" 
          type="date" 
          slotProps={{ inputLabel: { shrink: true } }} 
        />
        <TextField 
          fullWidth 
          label="Hasta" 
          type="date" 
          slotProps={{ inputLabel: { shrink: true } }} 
        />
        <Button variant="contained" onClick={onClose}>
          Descargar PDF
        </Button>
      </Box>
    </CenteredDrawer>
  );
}