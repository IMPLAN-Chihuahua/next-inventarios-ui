"use client";

import { useState } from "react";
import {Typography,TextField,Button,Box,CircularProgress,IconButton,InputAdornment,Alert} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { z } from "zod";

const loginSchema = z.object({
  correo: z.string().email("Correo inválido").min(1, "Ingresa el Correo Electrónico"),
  clave: z.string().min(1, "Ingresa la Contraseña"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      correo: "",
      clave: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMsg(null);
    setLoading(true);

    try{
      const res = await signIn("next-inventarios-ui", {
        correo: data.correo,
        clave: data.clave,
        redirect: false,
      });

      if (res?.ok) {
        router.push("/");
      } else {
        setErrorMsg("Correo o Contraseña son incorrectos");
      }
    } catch (err){
      setErrorMsg("Intenta de Nuevo.");
    } finally{
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 440 }}>
      <Typography sx={{ color: "#606062", fontWeight: 800, mb: 3, textAlign: "center" }}>
        Sistema de Gestión de Inventarios
      </Typography>

      <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 6, textAlign: "center", color: 'black'}}>
        Iniciar sesión
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: "100%",
          maxWidth: 400,
        }}
      >
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <Controller
          name="correo"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Correo electrónico"
              type="email"
              fullWidth
              error={!!errors.correo}
              helperText={errors.correo?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Controller
          name="clave"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              fullWidth
              error={!!errors.clave}
              helperText={errors.clave?.message}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
          )}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ mt: 5, backgroundColor: 'secondary.main'}}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Iniciar sesión"}
        </Button>
      </Box>
    </Box>
  );
}