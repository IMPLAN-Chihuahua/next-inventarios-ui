import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LoginForm from "./components/LoginForm";
import implan from "../../../public/implan.png";
import Image from 'next/image';

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: "background.default",
      }}
    >
      {/* Panel izquierdo */}
      <Box
        sx={{
          flex: { md: "0 0 55%" },
          bgcolor: "secondary.800",
          color: "#fff",
          px: { xs: 4, md: 10 },
          py: { xs: 6, md: 0 },
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          position: "relative",
        }}
      >
          <Box
            sx={{
              position: "absolute",
              top: 32,
              left: { xs: 32, md: 80 },
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Image
              src={implan}
              alt="Logo IMPLAN"
              height={100} // Ajusta la altura deseada en píxeles
              style={{ width: 'auto', height: 'auto'}} // Mantiene la proporción
              priority 
            />
          </Box>

        <Typography variant="h3" sx={{ fontWeight: 700, color: "#fff", mb: 1 }}>
          Inicia sesión en
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 400, color: "#fff", mb: 3 }}>
          Inventarios
        </Typography>
        <Typography variant="body1" sx={{ maxWidth: 420, color: "rgba(255,255,255,0.85)" }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
          Phasellus sit amet metus felis. Vestibulum ac rhoncus erat. lacus. 
        </Typography>
      </Box>

      {/* Panel derecho*/}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, md: 6 },
        }}
      >
        <LoginForm />
      </Box>
    </Box>
  );
}