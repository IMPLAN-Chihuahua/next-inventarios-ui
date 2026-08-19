// src/app/(authenticated)/componentsModal/drawers/StepperDrawer.tsx
"use client";

import { useState, ReactNode } from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import CenteredDrawer, {
  drawerPrimaryButtonStyles,
  drawerSecondaryButtonStyles,
} from "./CenteredDrawer";

export interface DrawerStep {
  label: string;
  content: () => ReactNode;
  validate?: () => boolean | Promise<boolean>;
}

interface StepperDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  steps: DrawerStep[];
  onFinish?: () => boolean | void | Promise<boolean | void>;
  finishLabel?: string;
  disabled?: boolean;
  size?: "compact" | "standard" | "wide";
  width?: number | string;
}

export default function StepperDrawer({
  open,
  onClose,
  title,
  subtitle,
  icon,
  steps,
  onFinish,
  finishLabel = "Finalizar",
  disabled = false,
  size = "standard",
  width,
}: StepperDrawerProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = async () => {
    const current = steps[activeStep];
    if (current.validate && !(await current.validate())) return;

    if (isLastStep) {
      setFinishing(true);
      try {
        const shouldClose = await onFinish?.();
        if (shouldClose !== false) handleClose();
      } finally {
        setFinishing(false);
      }
    } else {
      setActiveStep((s) => s + 1);
    }
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  const handleClose = () => {
    setActiveStep(0);
    onClose();
  };

  const actions = (
    <>
      <Button disabled={activeStep === 0 || finishing} onClick={handleBack} sx={drawerSecondaryButtonStyles}>
        Atrás
      </Button>
      <Button
        variant="contained"
        onClick={handleNext}
        disabled={disabled || finishing}
        startIcon={finishing ? <CircularProgress size={16} color="inherit" /> : undefined}
        sx={drawerPrimaryButtonStyles}
      >
        {finishing ? "Guardando..." : isLastStep ? finishLabel : "Siguiente"}
      </Button>
    </>
  );

  return (
    <CenteredDrawer
      open={open}
      onClose={finishing ? () => undefined : handleClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      size={size}
      width={width}
      actions={actions}
    >
      <Stepper
        activeStep={activeStep}
        alternativeLabel
        sx={{
          mb: 3,
          "& .MuiStepLabel-label": { fontSize: { xs: "0.68rem", sm: "0.78rem" }, fontWeight: 650 },
          "& .MuiStepIcon-root.Mui-active, & .MuiStepIcon-root.Mui-completed": { color: "#467a77" },
        }}
      >
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 280 }}>{steps[activeStep].content()}</Box>
    </CenteredDrawer>
  );
}
