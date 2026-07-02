'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Box, Typography, IconButton, Avatar, Divider } from '@mui/material';
import { QrCode } from 'lucide-react';
import { User } from 'lucide-react';
import LogoutIcon from '@mui/icons-material/Logout';
import Image from 'next/image';

const Nav_links = [
  { label: 'Articulos', path: '/articulos' },
  { label: 'Categorias', path: '/categorias' },
  { label: 'Usuarios', path: '/users' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  // const para saludo en el usuario
  const { data: session } = useSession();
  const userName = `${(session?.user as any)?.nombre ?? 'Usuario'}!`;

  // boton usuario
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleOpenUserMenu = () => setUserMenuOpen(true);
  const handleCloseUserMenu = () => setUserMenuOpen(false);

  const handleLogout = () => {
    handleCloseUserMenu();
    signOut({ callbackUrl: '/' }); // redirige cuando se cierra sesion
  };

  return (
    // contenedor principal 
    <Box
      sx={{
        position: 'fixed',
        top: 24,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1100,
        pointerEvents: 'none',
      }}
    >
      {/* Navbar con el efecto del glass */}
      <Box
        sx={{
          pointerEvents: 'auto',
          display: 'inline-flex',
          alignItems: 'center',

          // efecto glass
          backgroundColor: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',

          borderRadius: '50px',
          border: '1px solid rgba(229, 231, 235, 0.5)',
          boxShadow:
            '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          px: 1,
          py: 0.75,
          gap: { xs: 2, md: 4 },
          height: 'fit-content',
        }}
      >
        {/* logo y Enlaces */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, pl: 1 }}>
          {/* Logo */}
          <Box
            onClick={() => router.push('/')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              mr: 1,
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

          {/* Enlaces con efecto */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 3 }}>
            {Nav_links.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Box
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    color: isActive ? '#000000' : '#374151',
                    transition: 'color 0.2s',
                    '&:hover': { color: '#000000' },

                    // subrayado
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: '100%',
                      transform: isActive ? 'scaleX(1)' : 'scaleX(0)', 
                      height: '2px',
                      bottom: '-4px',
                      left: 0,
                      backgroundColor: '#e3a74d',
                      transformOrigin: 'bottom right',
                      transition: 'transform 0.25s ease-out',
                    },
                    '&:hover::after': {
                      transform: 'scaleX(1)',
                      transformOrigin: 'bottom left',
                    },
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

        <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

        {/* boton del QR + Usuario */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 0.5 }}>
          {/* Botón QR */}
          <IconButton
            onClick={() => router.push('/qr')}
            aria-label="Escanear QR"
            sx={{
              width: 35,
              height: 35,
              backgroundColor: '#e3a74df9',
              color: '#ffffff',
              transition: 'background-color 0.2s, transform 0.15s',
              '&:hover': {
                backgroundColor: '#e9bd56',
                transform: 'scale(1.05)',
              },
            }}
          >
            <QrCode size={16} />
          </IconButton>

          {/* boton del Usuario + drop */}
          <Box
            sx={{ position: 'relative' }}
            onMouseEnter={handleOpenUserMenu}
            onMouseLeave={handleCloseUserMenu}
          >
            <IconButton
              sx={{
                width: 40,
                height: 40,
                p: 0,
                
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: '#1d1c1c',
                  color: '#ffffff',
                }}
              >
                <User size={16} />
              </Avatar>
            </IconButton>

            {/* Card que se despliega */}
            <Box
              sx={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1,

                minWidth: 415, //tamaño del card
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #f0f0f1',
                boxShadow:
                  '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
                p: 2,

                opacity: userMenuOpen ? 1 : 0,
                visibility: userMenuOpen ? 'visible' : 'hidden',
                transform: userMenuOpen ? 'translateY(0)' : 'translateY(-6px)',
                transition: 'opacity 0.18s ease, transform 0.18s ease, visibility 0.18s',
              }}
            >

              {/* Saludo y nombre */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#111827' }}>
                  ¡Hola,
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.8 rem',
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userName}
                </Typography>
              </Box>

              {/* Boton cerrar sesión */}
              <Box
                component="button"
                onClick={handleLogout}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  flexShrink: 0,
                  border: '1px solid #e5e7eb',
                  borderRadius: '999px',
                  backgroundColor: '#ffffff',
                  color: '#111827',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  px: 0.8,
                  py: 0.8,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, border-color 0.15s',
                  '&:hover': {
                    backgroundColor: '#e3a74d',
                    borderColor: '#ffffff',
                    color: '#ffffff',
                  },
                }}
              >
                Cerrar Sesión
                <LogoutIcon sx={{ fontSize: 16 }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}