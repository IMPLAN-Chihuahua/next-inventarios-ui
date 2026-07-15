"use client";

import React from "react";
import { Box, Typography, Button, IconButton, Avatar, Badge } from "@mui/material";
import {Bell, type LucideIcon} from "lucide-react";
import ClimaAPI from "./ClimaAPI";

export const DashboardHeader = () => {
  return (
    <Box
      component="header"
      sx={{
        bgcolor: "#ffffff",
        width: "100%",
        boxSizing: "border-box", 
        px: { xs: 3, sm: 5 }, 
        py: 2.5,
        borderBottom: "1px solid #eef0f2",
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        m: 0, 
      }}
    >
      {/* Títulos */}
      <Box>
        <Typography variant="h5" sx={{ color: "#1d1d1f", fontWeight: 700, letterSpacing: "-0.02em", fontfamily: "system-ui, -apple-system, sans-serif"}}>
          Sistema de Inventarios
        </Typography>
      </Box>

      {/* Herramientas y clima */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <IconButton sx={{ bgcolor: '#F5F8FA', border: '1px solid #eef0f2' }}>
          <Badge variant="dot" color="error">
            <Bell size={18} color="#4b5563" />
          </Badge>
        </IconButton>
        <ClimaAPI />
      </Box>
    </Box>
  );
};