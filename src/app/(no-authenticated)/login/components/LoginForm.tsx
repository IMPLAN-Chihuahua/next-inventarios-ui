"use client";

import { useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton'; 
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility'; 
import VisibilityOff from '@mui/icons-material/VisibilityOff'; 

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  // estado para la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Ingresa tu usuario y contraseña");
      return;
    }

    setLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Intento de login:", { username, password });

    setLoading(false);
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 440,
      }}
    >
      <Typography sx={{ color: '#606062', fontWeight: 800, mb: 3, textAlign: 'center' }}>
        Sistema de Gestión de Inventarios
      </Typography>

      <Typography
        variant="h3"
        component="h1"
        sx={{ fontWeight: 700, mb: 2, textAlign: 'center' }}
      >
        Iniciar sesión
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        {/* Campo de Correo */}
        <Typography variant="body2" sx={{ mb: 1 }}>
          Correo electrónico
        </Typography>
        <TextField
          fullWidth
          variant="outlined" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          slotProps={{ 
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon color="action" />
                </InputAdornment>
              ),
            }
          }}
          sx={{ mb: 3 }}
          autoComplete="username"
        />

        {/* contraseña */}
        <Typography variant="body2" sx={{ mb: 1 }}>
          Contraseña
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          type={showPassword ? 'text' : 'password'} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          }}
        />

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ mb: 8 }}></Box>

        <Button
          type="submit"
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 800, textTransform: "none"}}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </Box>
    </Box>
  );
}