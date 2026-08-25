"use client";

import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import { ReactNode } from "react";

export const drawerFieldStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    transition: "box-shadow 160ms ease, background-color 160ms ease",
    "& fieldset": { borderColor: "#dfe5e7" },
    "&:hover fieldset": { borderColor: "#94b8ba" },
    "&.Mui-focused": { boxShadow: "0 0 0 3px rgba(70, 122, 119, 0.1)" },
    "&.Mui-focused fieldset": { borderColor: "#467a77" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#467a77" },
  "& .MuiInputBase-root.Mui-disabled": {
    bgcolor: "#f3f6f6",
    "& fieldset": { borderColor: "#dfe6e6" },
  },
  "& .MuiInputBase-input.Mui-disabled, & .MuiSelect-select.Mui-disabled": {
    WebkitTextFillColor: "#526164",
    fontWeight: 650,
  },
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    minHeight: "22px !important",
    fontSize: "0.86rem",
    fontWeight: 600,
    color: "#344346",
  },
};

export const drawerDropdownMenuProps = {
  slotProps: {
    paper: {
      sx: {
        mt: 0.75,
        maxHeight: 300,
        p: 0.75,
        border: "1px solid #e1e8e8",
        borderRadius: "14px",
        boxShadow: "0 16px 40px rgba(31, 49, 51, 0.16)",
        "& .MuiMenuItem-root": {
          minHeight: 48,
          px: 1.5,
          py: 1,
          mb: 0.35,
          borderRadius: "9px",
          color: "#354447",
          fontSize: "0.84rem",
          transition: "background-color 140ms ease, color 140ms ease",
          "&:last-of-type": { mb: 0 },
          "&:hover": { bgcolor: "#f0f6f5" },
          "&.Mui-selected": {
            bgcolor: "#e4f0ef",
            color: "#315f5c",
            "&:hover": { bgcolor: "#dcebea" },
          },
        },
      },
    },
  },
};

export const drawerPrimaryButtonStyles = {
  minHeight: 44,
  px: 3,
  borderRadius: "11px",
  bgcolor: "#467a77",
  boxShadow: "0 8px 18px rgba(70, 122, 119, 0.22)",
  textTransform: "none",
  fontWeight: 700,
  "&:hover": {
    bgcolor: "#385f5d",
    boxShadow: "0 10px 22px rgba(70, 122, 119, 0.28)",
  },
};

export const drawerSecondaryButtonStyles = {
  color: "#667277",
  px: 2.5,
  borderRadius: "11px",
  textTransform: "none",
  fontWeight: 650,
};

export function DrawerSectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, gridColumn: "1 / -1" }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
          color: "#467a77",
          bgcolor: "#eaf2f2",
          borderRadius: "10px",
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ color: "#1f2937", fontSize: "0.92rem", fontWeight: 750, lineHeight: 1.25 }}>
          {title}
        </Typography>
        <Typography sx={{ color: "#7a858f", fontSize: "0.76rem", mt: 0.25 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

interface CenteredDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  size?: "compact" | "standard" | "wide";
  width?: number | string;
  maxWidth?: string;
}

const drawerWidths = {
  compact: 560,
  standard: 760,
  wide: 1120,
};

export default function CenteredDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  actions,
  size = "standard",
  width,
  maxWidth = "calc(100vw - 32px)",
}: CenteredDrawerProps) {
  const drawerWidth = width ?? drawerWidths[size];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": {
          width: drawerWidth,
          maxWidth,
          maxHeight: "calc(100vh - 32px)",
          overflow: "hidden",
          borderRadius: { xs: "18px", sm: "24px" },
          bgcolor: "#ffffff",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          backgroundImage: "none",
          m: 2,
        },
        "& .MuiBackdrop-root": { backgroundColor: "rgba(15, 23, 42, 0.62)" },
      }}
    >
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          px: { xs: 2, sm: 3 },
          py: { xs: 1.75, sm: 2.25 },
          borderBottom: "1px solid #e8eeee",
          background: "linear-gradient(135deg, #f7fafa 0%, #eef5f5 100%)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          {icon && (
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 44,
                height: 44,
                flexShrink: 0,
                bgcolor: "#467a77",
                color: "#ffffff",
                borderRadius: "13px",
                boxShadow: "0 8px 18px rgba(70, 122, 119, 0.2)",
              }}
            >
              {icon}
            </Box>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 750, fontSize: "1.08rem", color: "#1f2d30", lineHeight: 1.25 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ color: "#687778", fontSize: "0.76rem", lineHeight: 1.45, mt: 0.3 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Cerrar"
          sx={{
            flexShrink: 0,
            color: "#6b777a",
            bgcolor: "rgba(255, 255, 255, 0.8)",
            border: "1px solid #dfe7e7",
            borderRadius: "10px",
            transition: "all 0.2s ease",
            "&:hover": { bgcolor: "#ffffff", color: "#1f2d30", transform: "rotate(3deg)" },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        component="section"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflowY: "auto",
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 2.5 },
        }}
      >
        {children}
      </Box>

      {actions && (
        <Box
          component="footer"
          sx={{
            display: "flex",
            flexDirection: { xs: "column-reverse", sm: "row" },
            justifyContent: "flex-end",
            gap: 1.25,
            px: { xs: 2, sm: 3 },
            py: 2,
            borderTop: "1px solid #e8eeee",
            bgcolor: "#ffffff",
          }}
        >
          {actions}
        </Box>
      )}
    </Dialog>
  );
}
