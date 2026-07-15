"use client";

import React, { useEffect, useRef } from "react";
import { Box, ButtonBase, Typography } from "@mui/material";
import { ArrowDownToLine, PrinterCheck, FileDown, CarFront, ArrowRight, type LucideIcon } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        trigger?: string;
        colors?: string;
      };
    }
  }
}

interface AccionRapida {
  icon: LucideIcon;
  step: string;
  titulo: string;
  color: string;
  lordIconSrc?: string;
  onClick?: () => void;
}

const acciones: AccionRapida[] = [
  {
    icon: CarFront,
    step: "Resguardo",
    titulo: "Vehicular",
    color: "#e3a74d",
    lordIconSrc: "https://cdn.lordicon.com/xwpcjash.json",
  },
  {
    icon: PrinterCheck,
    step: "Imprimir",
    titulo: "Etiquetas QR",
    color: "#e3a74d",
    lordIconSrc: "https://cdn.lordicon.com/yraqammt.json",
  },
  {
    icon: ArrowDownToLine,
    step: "Descargar",
    titulo: "Resguardos",
    color: "#e3a74d",
    lordIconSrc: "https://cdn.lordicon.com/bimokqfw.json",
  },
];

const RADIUS = 18;

const hexToRgb = (hex: string) => {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return `${(bigint >> 16) & 255}, ${(bigint >> 8) & 255}, ${bigint & 255}`;
};

export default function BotonesGridAmarillo() {
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
    el?.playerInstance?.stop(); // o .goToFirstFrame() si tu versión lo soporta
  };

  return (
    <Box sx={{ py: 2, display: "flex", justifyContent: "flex-start" }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(2, 1fr)" },
          gap: 1,
          maxWidth: 360,
          width: "100%",
        }}
      >
        {acciones.map(({ icon: Icon, step, titulo, color, lordIconSrc, onClick }) => {
          const rgb = hexToRgb(color);

          return (
            <ButtonBase
              key={titulo}
              onClick={onClick}
              onMouseEnter={() => lordIconSrc && playIcon(titulo)}
              onMouseLeave={() => lordIconSrc && resetIcon(titulo)}
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "1/1",
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
                  boxShadow: `0 14px 24px rgba(${rgb}, 0.22)`,
                  background: `radial-gradient(120% 120% at 100% 100%, rgba(${rgb}, 0.10) 0%, rgba(255,255,255,0) 65%), #fefefe`,
                  "& .watermark-icon": { color: color, opacity: 0.4 },
                  "& .mas-informacion": { opacity: 0.9, transform: "translateY(0)" },
                },
              }}
            >
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {lordIconSrc ? (
                  React.createElement("lord-icon", {
                    ref: (el: any) => {
                      lordIconRefs.current[titulo] = el;
                    },
                    src: lordIconSrc,
                    trigger: "loop-on-hover",
                    colors: `primary:${color}`,
                    style: { width: "100px", height: "100px", pointerEvents: "auto" },
                  })
                ) : (
                  <Icon size={80} strokeWidth={2} />
                )}
              </Box>

              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "space-between", p: 2, position: "relative", zIndex: 1 }}>
                <Box sx={{ position: "relative" }}>
                  <Typography sx={{ color: "#86868b", fontWeight: 600, fontSize: "0.7rem", letterSpacing: "0.05em", mb: 0.5 }}>
                    {step}
                  </Typography>
                  <Typography sx={{ color: "#1d1d1f", fontWeight: 600, fontSize: "1rem", letterSpacing: "-0.015em", lineHeight: 1.1 }}>
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