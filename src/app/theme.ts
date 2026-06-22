import { createTheme } from "@mui/material/styles"; 
import { blue } from "@mui/material/colors";
import {Roboto} from 'next/font/google';
import { esES } from '@mui/material/locale';

const roboto = Roboto({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  display: 'swap',
});

const theme = createTheme({
  typography: {
    fontFamily: roboto.style.fontFamily,
    allVariants: {
      color: '#202022',
      fontFamily: roboto.style.fontFamily,
    }
  },
  palette: {
    background: {
      default: '#fcfcfd'
    },
    secondary: {
      main: '#e3a74d',
      '50': '#fdfcea',
      '100': '#faf7cb',
      '200': '#f7f1aa',
      '300': '#f5ec8c',
      '400': '#f2e775',
      '500': '#f0e263',
      '600': '#eed25e',
      '700': '#e9bd56',
      '800': '#e3a74d',
      '900': '#d9843f'
    },
    primary: {
      main: '#606062',
      '50': '#fafafc',
      '100': '#f4f4f7',
      '200': '#ededf0',
      '300': '#dfdfe1',
      '400': '#bcbcbe',
      '500': '#9d9d9f',
      '600': '#747476',
      '700': '#606062',
      '800': '#414143',
      '900': '#202022',
    }
  },
  components: {
    MuiButtonBase: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '3px solid #e3a74d',
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: '3px solid #e3a74d',
            outlineOffset: '2px',
            borderRadius: '2px',
          },
        },
      },
      defaultProps: {
        color: blue[900],
        underline: 'hover'
      }
    },
    MuiModal: {
      defaultProps: {
        disableScrollLock: true,
      }
    },
    MuiPopover: {
      defaultProps: {
        disableScrollLock: true,
      }
    },
    MuiToolbar: {
      styleOverrides: {
        dense: {
          minHeight: 80,
        }
      }
    },
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.primary.light
        })
      }
    },
  }
}, esES);

export default theme;