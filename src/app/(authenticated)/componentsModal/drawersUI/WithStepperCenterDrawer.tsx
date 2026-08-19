// src/app/(authenticated)/componentsModal/drawers/StepperDrawer.tsx
"use client";

import { useState, ReactNode } from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import CenteredDrawer, {
  drawerPrimaryButtonStyles,
  drawerSecondaryButtonStyles,
} from "./CenteredDrawer";

export interface DrawerStep {
  label: string;
  content: () => ReactNode;
  validate?: () => boolean;
}

interface StepperDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  steps: DrawerStep[];
  onFinish?: () => void;
  width?: number | string;
}

export default function StepperDrawer({
  open,
  onClose,
  title,
  steps,
  onFinish,
  width,
}: StepperDrawerProps) {
  const [activeStep, setActiveStep] = useState(0);
  const isLastStep = activeStep === steps.length - 1;

  const handleNext = () => {
    const current = steps[activeStep];
    if (current.validate && !current.validate()) return;

    if (isLastStep) {
      onFinish?.();
      handleClose();
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
      <Button disabled={activeStep === 0} onClick={handleBack} sx={drawerSecondaryButtonStyles}>
        Atrás
      </Button>
      <Button variant="contained" onClick={handleNext} sx={drawerPrimaryButtonStyles}>
        {isLastStep ? "Finalizar" : "Siguiente"}
      </Button>
    </>
  );

  return (
    <CenteredDrawer open={open} onClose={handleClose} title={title} width={width} actions={actions}>
      <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box sx={{ minHeight: 200, mb: 2 }}>{steps[activeStep].content()}</Box>
    </CenteredDrawer>
  );
}
