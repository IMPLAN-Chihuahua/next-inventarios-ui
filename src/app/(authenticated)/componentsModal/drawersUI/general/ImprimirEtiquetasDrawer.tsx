"use client";

import { TextField, Button } from "@mui/material";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import CenteredDrawer, {
  drawerFieldStyles,
  drawerPrimaryButtonStyles,
  drawerSecondaryButtonStyles,
} from "../CenteredDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ImprimirEtiquetasDrawer({ open, onClose }: Props) {
  const actions = (
    <>
      <Button onClick={onClose} sx={drawerSecondaryButtonStyles}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={onClose}
        startIcon={<QrCode2RoundedIcon />}
        sx={drawerPrimaryButtonStyles}
      >
        Generar e imprimir
      </Button>
    </>
  );

  return (
    <CenteredDrawer
      open={open}
      onClose={onClose}
      title="Imprimir etiquetas QR"
      subtitle="Busca los artículos o categorías que deseas convertir en etiquetas."
      icon={<QrCode2RoundedIcon />}
      actions={actions}
    >
      <TextField fullWidth label="Buscar artículo o categoría" sx={drawerFieldStyles} />
    </CenteredDrawer>
  );
}
