'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography 
} from '@mui/material';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          backgroundColor: '#ffffff', 
          borderBottom: '1px solid #e0e0e0' 
        }}
      >
        <Toolbar variant="dense">

          <Typography
            variant="h6"
            component="div"
            sx={{
              color: '#2d3748',
              fontWeight: 500,
            }}
          >
            Sistema de Inventarios
          </Typography>
        </Toolbar>
      </AppBar>
    </Box>
  );
}