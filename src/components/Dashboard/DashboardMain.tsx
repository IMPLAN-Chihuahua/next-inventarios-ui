import React from 'react';
import BotonesGrid from "./BotonesGrid";
import { Box, Typography } from '@mui/material'; 
import ClimaAPI from './ClimaAPI';


const Dashboard = () => {
  return (
    <Box sx={{ display: "flex", gap: 30 }}>
      
      {/* Columna Izquierda: Título y Subtítulo */}
      <Box sx={{ flex: 1 }}>        
        <Typography 
          sx={{ 
            color: "#d9843f", 
            fontWeight: 600, 
            pl: 4.5,
            mb: 0, 
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            fontSize: "0.875rem"
          }}
        >
          Panel de Control
        </Typography>

        <Typography 
          variant="h4"
          sx={{ 
            color: "#000000", 
            fontWeight: 700, 
            pl: 4.5,
            mb: 0, 
            letterSpacing: "-0.02em"
          }}
        >
          Sistema de Inventarios
        </Typography> 

        {/* linea divisora */}
        <Box 
          sx={{
            ml: 4.5,
            mb: 5,
            mr: -94,
            height: "1px",
            backgroundColor: "#e5e7eb", 
            boxShadow: "#c0c0c000 0px 10px 10px -10px"
          }}
        />
      </Box>  
      
      {/* Columna Derecha */}
      <Box
        sx={{
          flex: 1,
          mt: 10.5,
          ml: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start", 
        }}
      >
        <Typography 
          sx={{ 
            color: "#4b5563", 
            fontWeight: 500, 
            mb: 1,
            letterSpacing: "-0.01em"
          }}
        >
          Acciones Rápidas
        </Typography>

        <Box sx={{ flexShrink: 0, width: "100%",mt:-3,}}>
          <BotonesGrid />
        </Box>

        <Box sx={{ mt: 0, width: "100%" }}>
          <ClimaAPI />
        </Box>
      </Box>

    </Box>
  );
}

export default Dashboard;


