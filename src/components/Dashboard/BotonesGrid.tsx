"use client";

import React, { useEffect, useRef } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { ArrowRight } from "lucide-react";

interface AccionRapida {
  id: string; 
  step: string;
  titulo: string;
  color: string;
  lordIconSrc: string;
}

const acciones: AccionRapida[] = [
  {
    id: "resguardo-vehicular",
    step: "Resguardo",
    titulo: "Vehicular",
    color: "#94B8BA",
    lordIconSrc: "https://cdn.lordicon.com/byupthur.json",
  },
  {
    id: "imprimir-etiquetas",
    step: "Imprimir",
    titulo: "Etiquetas QR",
    color: "#94B8BA",
    lordIconSrc: "https://cdn.lordicon.com/ggnoyhfp.json",
  },
  {
    id: "descargar-resguardos",
    step: "Descargar",
    titulo: "Resguardos",
    color: "#94B8BA",
    lordIconSrc: "https://cdn.lordicon.com/tsrgicte.json",
  },
  {
    id: "agregar-articulo",
    step: "Agregar",
    titulo: "Artículos",
    color: "#94B8BA",
    lordIconSrc: "https://cdn.lordicon.com/fikcyfpp.json",
  },
];

const RADIUS = 18;

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
};

interface BotonesGridAmarilloProps {
  onAction: (id: string) => void; 
}

export default function BotonesGridAmarillo({ onAction }: BotonesGridAmarilloProps) {
  const lordIconRefs = useRef<Record<string, any>>({});

  useEffect(() => {
    const scriptId = "lordicon-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.lordicon.com/lordicon.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const playIcon = (titulo: string) => {
    const el = lordIconRefs.current[titulo];
    el?.playerInstance?.play();
  };

  const resetIcon = (titulo: string) => {
    const el = lordIconRefs.current[titulo];
    el?.playerInstance?.stop();
  };

  return (
    <Box sx={{ display: "flex", width: "100%", height: "100%" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(2, 1fr)" },
          gap: 2.5,
          width: "100%",
          height: "100%",
        }}
      >
        {acciones.map(({ id, step, titulo, color, lordIconSrc }) => {
          const rgb = hexToRgb(color);

          return (
            <ButtonBase
              key={id}
              onClick={() => onAction(id)} // 👈 dispara el id, nada más
              onMouseEnter={() => playIcon(titulo)}
              onMouseLeave={() => resetIcon(titulo)}
              sx={{
                position: "relative",
                width: "100%",
                height: "100%",
                minHeight: 130,
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
                  background: `radial-gradient(120% 120% at 100% 100%, rgba(${rgb}, 0.10) 0%, rgba(255,255,255,0) 65%), #fefefe`,
                  "& .watermark-icon": { opacity: 0.8 },
                  "& .mas-informacion": { opacity: 0.9, transform: "translateY(0)" },
                },
              }}
            >
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "4px",
                  bgcolor: color,
                  zIndex: 1,
                }}
              />

              <Box
                className="watermark-icon"
                sx={{
                  position: "absolute",
                  right: 3,
                  bottom: -8,
                  opacity: 0.3,
                  pointerEvents: "none",
                  zIndex: 0,
                  transition: "opacity 0.4s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {React.createElement("lord-icon", {
                  ref: (el: any) => {
                    lordIconRefs.current[titulo] = el;
                  },
                  src: lordIconSrc,
                  delay: "-10",
                  stroke: "bold",
                  colors: "primary:#121331,secondary:#467a77",
                  style: { width: "90px", height: "90px", pointerEvents: "auto" },
                })}
              </Box>

              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", p: 2, position: "relative", zIndex: 1 }}>
                <Box sx={{ position: "relative" }}>
                  <Typography sx={{ color: "#060606", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.05em", mb: 0.5 }}>
                    {step}
                  </Typography>
                  <Typography sx={{ color: "#467A77", fontWeight: 900, fontSize: "1.3rem", letterSpacing: "-0.015em", lineHeight: 1.1 }}>
                    {titulo}
                  </Typography>
                </Box>

                <Box className="mas-informacion" sx={{ display: "flex", alignItems: "center", gap: 0.5, position: "absolute", bottom: 16, left: 16, opacity: 0, transform: "translateY(10px)", transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)" }}>
                  <Typography sx={{ color: color, fontWeight: 700, fontSize: "0.7rem" }}>
                    Acceder
                  </Typography>
                  <ArrowRight size={14} strokeWidth={2.5} color={color} />
                </Box>
              </Box>
            </ButtonBase>
          );
        })}
      </Box>
    </Box>
  );
}