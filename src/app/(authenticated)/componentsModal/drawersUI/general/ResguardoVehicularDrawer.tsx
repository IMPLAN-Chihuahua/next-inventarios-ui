"use client";

import { useState, useEffect } from "react";
import { Box, TextField, Button, MenuItem } from "@mui/material";
import CenteredDrawer from "../CenteredDrawer";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ResguardoVehicularDrawer({ open, onClose }: Props) {
  const [formData, setFormData] = useState({
    articuloId: "", 
    folio: "",
    fecha: "",
    numeroInventario: "",
    vehiculo: "",
    serie: "",
    cargaGasolinaElectrica: "",
    kilometraje: "",
    resguardante: "", 
    comentarios: ""
  });

  const [vehiculos, setVehiculos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loadingCarga, setLoadingCarga] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    if (open) {
      cargarDatos();
    }
  }, [open]);
  const CATEGORIA_TRANSPORTE_ID = "0c63012a-e7a2-4239-b7ff-4c17fe9b38dc";


  const cargarDatos = async () => {
    setLoadingCarga(true);
    try {
      const [resVehiculos, resUsuarios] = await Promise.all([
        fetch(`/api/v1/articulos?categorias=${CATEGORIA_TRANSPORTE_ID}&limit=1000`),
        fetch('/api/v1/usuarios')
      ]);

      if (resVehiculos.ok) {
        const jsonVehiculos = await resVehiculos.json();
        const listaArticulos = Array.isArray(jsonVehiculos)
          ? jsonVehiculos
          : (jsonVehiculos.data || jsonVehiculos.items || []);
        setVehiculos(listaArticulos);
      } else {
        const errorBody = await resVehiculos.text();
        console.error("Error al cargar articulos:", resVehiculos.status, errorBody);
      }

      if (resUsuarios.ok) {
        const jsonUsuarios = await resUsuarios.json();
        const listaUsuarios = Array.isArray(jsonUsuarios)
          ? jsonUsuarios
          : (jsonUsuarios.data || jsonUsuarios.items || []);
        setUsuarios(listaUsuarios);
      } else {
        const errorBody = await resUsuarios.text();
        console.error("Error al cargar usuarios:", resUsuarios.status, errorBody);
      }
    } catch (error) {
      console.error("Error al cargar los catálogos (excepción):", error);
    } finally {
      setLoadingCarga(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVehiculoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const selectedId = e.target.value;
  const vehiculoSeleccionado = vehiculos.find(
      (v) => (v.id || v._id) === selectedId
    );

    setFormData({
      ...formData,
      articuloId: selectedId,
      numeroInventario: vehiculoSeleccionado?.numeroInventario || "",
      serie: vehiculoSeleccionado?.noSerie || "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.articuloId) {
      alert("Por favor, selecciona un vehículo.");
      return;
    }
      if (!formData.resguardante) {
    alert("Por favor, selecciona un empleado responsable.");
    return;
  }

    setLoadingSubmit(true);
    try {
      const payload: Record<string, any> = { ...formData };
      
      const { articuloId } = payload;
      delete payload.articuloId;

      if (!payload.fecha) delete payload.fecha;
      if (payload.kilometraje) {
         payload.kilometraje = Number(payload.kilometraje);
      } else {
         delete payload.kilometraje;
      }

      const response = await fetch(`/api/v1/resguardos/vehiculo/${articuloId}/resguardo/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Error desconocido del servidor" }));
        console.error("Detalles del error del backend:", errorData);
        throw new Error(errorData.message || "Error al generar el resguardo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Resguardo_Vehicular_${formData.folio || "Documento"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      onClose();
    } catch (error) {
      console.error(error);
      alert("Error al intentar generar el resguardo.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <CenteredDrawer open={open} onClose={onClose} title="Resguardo Vehicular">
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        
        <TextField
          select
          name="articuloId"
          label="Selecciona el Vehículo"
          value={formData.articuloId}
          onChange={handleVehiculoChange}
          fullWidth
          required
          disabled={loadingCarga}
        >
          {vehiculos.length > 0 ? (
            vehiculos.map((vehiculo: any) => (
              <MenuItem key={vehiculo.id || vehiculo._id} value={vehiculo.id || vehiculo._id}>
                {vehiculo.descripcion || vehiculo.nombre || "Vehículo sin descripción"} ({vehiculo.numeroInventario || "Sin inventario"})
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled value="">
              {loadingCarga ? "Cargando vehículos..." : "No hay vehículos disponibles"}
            </MenuItem>
          )}
        </TextField>

        <TextField 
          name="folio" 
          label="Folio" 
          value={formData.folio} 
          onChange={handleChange} 
          fullWidth 
        />
        <TextField 
          name="fecha" 
          label="Fecha" 
          type="date" 
          value={formData.fecha} 
          onChange={handleChange} 
          fullWidth 
          slotProps={{ inputLabel: { shrink: true } }} 
        />
        <TextField 
          name="numeroInventario" 
          label="Número de Inventario" 
          value={formData.numeroInventario} 
          onChange={handleChange} 
          fullWidth 
        />

        <TextField 
          name="serie" 
          label="Serie" 
          value={formData.serie} 
          onChange={handleChange} 
          fullWidth 
        />
        <TextField
          select
          name="cargaGasolinaElectrica"
          label="Carga de Gasolina / Eléctrica"
          value={formData.cargaGasolinaElectrica}
          onChange={handleChange}
          fullWidth
        >
          <MenuItem value="Gasolina">Gasolina</MenuItem>
          <MenuItem value="Eléctrica">Eléctrica</MenuItem>
        </TextField>
        <TextField 
          name="kilometraje" 
          label="Kilometraje" 
          type="number" 
          value={formData.kilometraje} 
          onChange={handleChange} 
          fullWidth 
        />
        
        <TextField
          select
          name="resguardante"
          label="Empleado Responsable"
          value={formData.resguardante}
          onChange={handleChange}
          fullWidth
          required
          disabled={loadingCarga}
        >
          {usuarios.length > 0 ? (
            usuarios.map((usuario: any) => (
              <MenuItem key={usuario.id || usuario._id} value={usuario.id || usuario._id}>
                {usuario.nombre || usuario.correo || "Usuario sin nombre"}
              </MenuItem>
            ))
          ) : (
            <MenuItem disabled value="">
              {loadingCarga ? "Cargando usuarios" : "No hay usuarios disponibles"}
            </MenuItem>
          )}
        </TextField>

        <TextField 
          name="comentarios" 
          label="Comentarios" 
          multiline 
          rows={3} 
          value={formData.comentarios} 
          onChange={handleChange} 
          fullWidth 
        />
        
        <Button 
          variant="contained" 
          onClick={handleSubmit} 
          disabled={loadingSubmit || loadingCarga}
        >
          {loadingSubmit ? "Generando" : "Guardar y Descargar Resguardo"}
        </Button>
      </Box>
    </CenteredDrawer>
  );
}