"use client";

import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode } from "react";

interface CenteredDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: number | string;
  maxWidth?: string;
}

export default function CenteredDrawer({
  open,
  onClose,
  title,
  children,
  width = 700,
  maxWidth = "600vw",
}: CenteredDrawerProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          width: width,
          maxWidth: maxWidth,
          maxHeight: "85vh",
          borderRadius: "24px",
          bgcolor: "#ffffff",
          p: "24px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          backgroundImage: "none",
          m: 2,
        },
        "& .MuiBackdrop-root": {
          backgroundColor: "rgba(0,0,0,0.6)", 
        }
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            fontSize: "1.25rem", 
            color: "#111827", 
            lineHeight: 1.2 
          }}
        >
          {title}
        </Typography>
        <IconButton 
          onClick={onClose} 
          size="small" 
          aria-label="Cerrar"
          sx={{ 
            color: "#6b7280",
            bgcolor: "#f3f4f6",
            borderRadius: "10px", 
            transition: "all 0.2s ease",
            "&:hover": {
              bgcolor: "#e5e7eb",
              color: "#111827"
            }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Dialog>
  );
}