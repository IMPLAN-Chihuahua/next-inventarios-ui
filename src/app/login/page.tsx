import Box from "@mui/material/Box";
import LoginForm from "./components/LoginForm";
import Image from 'next/image';
import implanLogo from '../../../public/implan.png';
import fondo_login from '../../../public/esta.png';

export default function LoginPage() {
  return (
    // box principal 
    <Box
      sx={{
        position: "relative", 
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",     
        justifyContent: "center", 
        overflow: "hidden"
      }}
    >
      {/* box 1: Imagen de fondo */}
      <Image
        src={fondo_login}
        alt="Fondo"
        fill 
        style={{ 
          objectFit: 'cover', 
          zIndex: 0,
        }} 
        priority 
      />

      {/* box 2: Login */}
      <Box
        sx={{
          bgcolor: "#f4f6f8", 
          borderRadius: 6,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)", 
          display: "flex",
          flexDirection: "column",
          p: { xs: 4, md: 6 },
          width: { xs: "90%", sm: "400px", md: "480px" }, 
          position: "relative", 
          zIndex: 1, // tarjeta por encima de la imagen
        }}
      >
        {/* Contenedor del Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Image
            src={implanLogo}
            alt="Logo IMPLAN"
            height={100} 
            style={{ width: 'auto', height: 'auto' }} 
            priority 
          />
        </Box>

        {/* Formulario de inputs y botón */}
        <Box sx={{ width: "100%" }}>
          <LoginForm />
        </Box>

      </Box>
    </Box>  
  );
}