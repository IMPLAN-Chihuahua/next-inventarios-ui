"use client";

import { useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Ingresa tu usuario y contraseña.");
      return;
    }

    setLoading(true);



    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Intento de login:", { username, password });

    setLoading(false);
  };

  return (
    <Paper
      elevation={3}
      sx={{
        width: "100%",
        maxWidth: 440,
        borderRadius: 4,
        p: { xs: 3, sm: 5 },
      }}
    >
      <Typography variant="body2" color="secondary">
        IMPLAN
      </Typography>

      <Typography
        variant="h3"
        component="h1"
        sx={{ fontWeight: 700, mb: 4 }}
      >
        Iniciar sesión
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Usuario o correo electrónico
        </Typography>
        <TextField
          fullWidth
          placeholder="Usuario o correo electrónico"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 3 }}
          autoComplete="username"
        />

        <Typography variant="body2" sx={{ mb: 1 }}>
          Contraseña
        </Typography>
        <TextField
          fullWidth
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 1.5 }}>
            {error}
          </Typography>
        )}

        <Box sx={{mt: 1.5, mb: 3 }}></Box>

        <Button
          type="submit"
          variant="contained"
          color="secondary"
          fullWidth
          size="large"
          disabled={loading}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Iniciar sesión"
          )}
        </Button>
      </Box>
    </Paper>
  );
}