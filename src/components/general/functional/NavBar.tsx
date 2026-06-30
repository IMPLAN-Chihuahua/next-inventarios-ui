'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import QrCode2OutlinedIcon from '@mui/icons-material/QrCode2Outlined';
import Image from 'next/image';

const Nav_links = [
  { label: 'Articulos', path: '/articulos' },
  { label: 'Categorias', path: '/categorias'},
  { label: 'Usuarios', path: '/users'},
];

const Quick_links = [
  { label: 'QR', path: '/qr', icon: QrCode2OutlinedIcon },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    // contenedor principal flotante
    <Box 
      sx={{ 
        position: 'fixed', 
        top: 24,           
        left: 0,
        right: 0,
        display: 'flex', 
        justifyContent: 'center',
        zIndex: 1100,      
        pointerEvents: 'none' 
      }}
    >
      
      {/* Navbar con el efecto del glass */}
      <Box
        sx={{
          pointerEvents: 'auto', 
          display: 'inline-flex',
          alignItems: 'center',
          
          // efecto cristal
          backgroundColor: 'rgba(255, 255, 255, 0.65)', 
          backdropFilter: 'blur(12px)', 
          WebkitBackdropFilter: 'blur(12px)', 
          
          borderRadius: '50px',
          border: '1px solid rgba(229, 231, 235, 0.5)', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          px: 1,
          py: 0.75,
          gap: { xs: 2, md: 4 },
          height: 'fit-content'
        }}
      >
        
        {/* Logo y Enlaces */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pl: 1 }}>
          
          {/* Logo */}
          <Box
            onClick={() => router.push('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mr: 1
            }}
          >
            <Box sx={{ position: 'relative', width: 32, height: 32 }}>
              <Image
                src="/image.png" 
                alt="Logo"
                fill
                style={{ objectFit: 'contain' }}
              />
            </Box>
          </Box>

          {/* Enlaces con efecto hover */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            {Nav_links.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Box
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  sx={{
                    position: 'relative', // Requerido para posicionar la línea animada
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    color: isActive ? '#000000' : '#374151',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#000000' },
                    
                    // --- EFECTO DE SUBRAYADO ANIMADO ---
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '100%',
                      transform: isActive ? 'scaleX(1)' : 'scaleX(0)', // Se queda fija si la ruta está activa
                      height: '2px', // Grosor de la línea
                      bottom: '-4px', // Separación vertical respecto al texto
                      left: 0,
                      backgroundColor: '#2563eb', // Azul del botón, puedes cambiarlo a '#000000' si prefieres negro
                      transformOrigin: 'bottom right',
                      transition: 'transform 0.25s ease-out',
                    },
                    '&:hover::after': {
                      transform: 'scaleX(1)',
                      transformOrigin: 'bottom left',
                    }
                    // -----------------------------------
                  }}
                >
                  <Typography sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {link.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Dropdown y usuario */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          
          <Button
            onClick={handleOpenMenu}
            disableElevation
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#ffffff',
              backgroundColor: '#2563eb',
              borderRadius: '50px',
              px: 2.5,
              py: 0.75,
              minWidth: '110px',
              '&:hover': {
                backgroundColor: '#1d4ed8',
              },
            }}
          >
            Accesos Rápidos
          </Button>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  borderRadius: '12px',
                  minWidth: 160,
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  border: '1px solid #f3f4f6'
                },
              },
            }}
          >
            {Quick_links.map((item) => {
              const Icon = item.icon;
              return (
                <MenuItem
                  key={item.path}
                  onClick={() => handleCloseMenu()}
                  sx={{ py: 1, px: 2 }}
                >
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <Icon sx={{ fontSize: 18, color: '#4b5563' }} />
                  </ListItemIcon>
                  <ListItemText sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    {item.label}
                  </ListItemText>
                </MenuItem>
              );
            })}
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}