import { Box, ButtonBase, Typography } from "@mui/material";
import { ArrowDownToLine, PrinterCheck, FileDown, CarFront, ArrowRight, type LucideIcon } from "lucide-react";

interface AccionRapida {
  icon: LucideIcon;
  step: string;
  titulo: string;
  onClick?: () => void;
}

const acciones: AccionRapida[] = [
  {
    icon: CarFront,
    step: "Resguardo",
    titulo: "Vehicular",
  },
  {
    icon: PrinterCheck,
    step: "Imprimir",
    titulo: "Etiquetas QR",
  },
  {
    icon: FileDown,
    step: "Paso 03",
    titulo: "Lorem Ipsum 3",
  },
  {
    icon: ArrowDownToLine,
    step: "Descargar",
    titulo: "Resguardos",
  },
];

const RADIUS = 18; 

export default function BotonesGridAmarillo() {
  return (
    <Box
      sx={{
        py: 2, // solo padding vertical, sin desplazar el grid horizontalmente
        display: "flex",
        justifyContent: "flex-start", // alineado a la izquierda, no centrado
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(2, 1fr)" },
          gap: 1, // Espacio entre tarjetas
          maxWidth: 360, 
          width: "100%",
        }}
      >
        {acciones.map(({ icon: Icon, step, titulo, onClick }) => (
          <ButtonBase
            key={titulo}
            onClick={onClick}
            sx={{
              position: "relative",
              width: "100%",
              aspectRatio: '1/1', 
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
              textAlign: "left",
              borderRadius: `${RADIUS}px`,
              bgcolor: "#fefefe",
              border: "1px solid rgba(0, 0, 0, 0.1)", 
              boxShadow: "0 4px 24px rgba(0,0,0,0.02)", 
              overflow: "hidden", 
              transition: "all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)", 
              "&:hover": {
                transform: "translateY(-6px)", 
                boxShadow: "0 14px 32px rgba(0,0,0,0.15)",
                borderColor: "rgba(0, 0, 0, 0.2)",
                
                "& .watermark-icon": {
                  color: "#e3a74d",
                  opacity: 0.4, 
                },
                
                "& .mas-informacion": {
                  opacity: 0.9,
                  transform: "translateY(0)", 
                }
              },
            }}
          >
            {/* efecto marca de agua de los iconos*/}
            <Box
              className="watermark-icon"
              sx={{
                position: "absolute",
                right: -8, 
                bottom: -8, 
                opacity: 0.1, 
                pointerEvents: "none", 
                zIndex: 0,
                color: "#1d1d1f",
                transition: "color 0.4s ease, opacity 0.4s ease", 
              }}
            >
              <Icon size={80} strokeWidth={2} /> 
            </Box>

            {/* contenido principal */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "space-between", 
                p: 2, // Padding interno 
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Textos de titulo y subtitulo */}
              <Box
                sx={{ 
                  position: "relative",
                }}
              >
                <Typography
                  sx={{
                    color: "#86868b", 
                    fontWeight: 600,
                    fontSize: "0.7rem", 
                    letterSpacing: "0.05em",
                    mb: 0.5,
                  }}
                >
                  {step}
                </Typography>
                
                <Typography
                  sx={{
                    color: "#1d1d1f", 
                    fontWeight: 600,
                    fontSize: "1rem", 
                    letterSpacing: "-0.015em",
                    lineHeight: 1.1,
                  }}
                >
                  {titulo}
                </Typography>
              </Box>

              {/* Mas informacion*/}
              <Box
                className="mas-informacion"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  position: "absolute",
                  bottom: 16, 
                  left: 16, 
                  opacity: 0, 
                  transform: "translateY(10px)",
                  transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
                }}
              >
                <Typography
                  sx={{
                    color: "#e3a74d",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                >
                  Acceder
                </Typography>
                <ArrowRight size={14} strokeWidth={2.5} color="#e3a74d" />
              </Box>
            </Box>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}