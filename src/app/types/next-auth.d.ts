import NextAuth, { User } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            nombre: string;
            rol: 'User' | 'Admin';
            accessToken: string;
            isExpired: boolean;
            accessTokenExpires: Date | number
        }
    }
    
    interface User {
        id: string;
        nombre: string;
        rol: 'User' | 'Admin';
        accessToken: string;
    }
}


declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    nombre: string;
    rol: 'User' | 'Admin'; 
    isExpired: boolean;
    accessTokenExpires: number | Date;
  }
}