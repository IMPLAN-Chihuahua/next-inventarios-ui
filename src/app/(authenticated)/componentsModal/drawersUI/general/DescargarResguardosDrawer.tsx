"use client";

import { useCallback, useEffect, useState } from "react";
import { Box, Button, CircularProgress, MenuItem, TextField, Typography } from "@mui/material";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CenteredDrawer, {
  drawerDropdownMenuProps,
  drawerFieldStyles,
  drawerPrimaryButtonStyles,
  drawerSecondaryButtonStyles,
} from "../CenteredDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Usuario {
  id?: string;
  _id?: string;
  nombre?: string;
  activo?: boolean;
}

export default function DescargarResguardosDrawer({ open, onClose }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    setLoadingUsuarios(true);
    try {
      const response = await fetch("/api/v1/usuarios?limit=1000&fields=nombre,activo");
      if (!response.ok) throw new Error("No fue posible cargar los trabajadores.");

      const json = await response.json();
      const lista = Array.isArray(json) ? json : (json.data || json.items || []);
      setUsuarios((lista as Usuario[]).filter((usuario) => usuario.activo === true));
    } catch (error) {
      console.error(error);
      setUsuarios([]);
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    const cargaInicial = window.setTimeout(() => {
      void cargarUsuarios();
    }, 0);

    return () => window.clearTimeout(cargaInicial);
  }, [open, cargarUsuarios]);

  const handleDownload = async () => {
    if (!usuarioId) return;

    setLoadingDownload(true);
    try {
      const response = await fetch(`/api/v1/usuarios/${usuarioId}/resguardo/download`, {
        method: "POST",
      });

      if (response.status === 204) {
        alert("El trabajador seleccionado no tiene artículos asignados para generar un resguardo.");
        return;
      }

      if (!response.ok) {
        throw new Error("No fue posible generar el resguardo del trabajador.");
      }

      const usuario = usuarios.find((item) => (item.id || item._id) === usuarioId);
      const nombre = (usuario?.nombre || "Trabajador").replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, "_");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `Resguardo_${nombre}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al descargar el resguardo.");
    } finally {
      setLoadingDownload(false);
    }
  };

  const actions = (
    <>
      <Button onClick={onClose} disabled={loadingDownload} sx={drawerSecondaryButtonStyles}>
        Cancelar
      </Button>
      <Button
        variant="contained"
        onClick={handleDownload}
        disabled={!usuarioId || loadingUsuarios || loadingDownload}
        startIcon={
          loadingDownload ? <CircularProgress size={16} color="inherit" /> : <FileDownloadRoundedIcon />
        }
        sx={drawerPrimaryButtonStyles}
      >
        {loadingDownload ? "Generando resguardo..." : "Descargar Excel"}
      </Button>
    </>
  );

  return (
    <CenteredDrawer
      open={open}
      onClose={onClose}
      title="Descargar resguardo"
      subtitle="Selecciona al trabajador para descargar su resguardo."
      icon={<FileDownloadRoundedIcon />}
      actions={actions}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          border: "1px solid #e3e9ea",
          borderRadius: "14px",
          bgcolor: "#fbfcfc",
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            display: { xs: "none", sm: "grid" },
            placeItems: "center",
            flexShrink: 0,
            color: "#467a77",
            bgcolor: "#eaf2f2",
            borderRadius: "11px",
          }}
        >
          <PersonOutlineRoundedIcon />
        </Box>

        <TextField
          select
          fullWidth
          required
          label="Trabajador"
          value={usuarioId}
          onChange={(event) => setUsuarioId(event.target.value)}
          disabled={loadingUsuarios}
          sx={drawerFieldStyles}
          slotProps={{
            select: {
              MenuProps: drawerDropdownMenuProps,
              renderValue: (value) => {
                const usuario = usuarios.find((item) => (item.id || item._id) === value);
                return usuario?.nombre || "Selecciona un trabajador";
              },
            },
          }}
        >
          {usuarios.length > 0 ? (
            usuarios.map((usuario) => (
              <MenuItem key={usuario.id || usuario._id} value={usuario.id || usuario._id}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: "0.84rem", fontWeight: 700, lineHeight: 1.25 }} noWrap>
                    {usuario.nombre || "Trabajador sin nombre"}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled value="">
              {loadingUsuarios ? "Cargando trabajadores..." : "No hay trabajadores disponibles"}
            </MenuItem>
          )}
        </TextField>
      </Box>
    </CenteredDrawer>
  );
}



