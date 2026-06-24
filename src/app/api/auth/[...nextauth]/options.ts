import { inventariosApi } from "@/src/services/axios";
import type {
  Awaitable,
  NextAuthOptions,
  RequestInternal,
  User,
} from "next-auth";
import Credentials, {
  CredentialsProvider,
} from "next-auth/providers/credentials";
import { jwtDecode } from "jwt-decode";

export const options: NextAuthOptions = {
  providers: [
    Credentials({
      id: "next-inventarios-ui",
      name: "Inventarios",
      credentials: {
        correo: { type: "email" },
        clave: { type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await inventariosApi.post("/auth/login", {
            correo: credentials?.correo,
            clave: credentials?.clave,
          });
          const currentUser = await inventariosApi.get("/me", {
            headers: {
              Authorization: `Bearer ${res.data.token}`,
            },
          });

          return { ...currentUser.data, accessToken: res.data.token };
        } catch (err) {
          throw err;
        }
      },
    }),
  ],
    events: {
    signIn() {
      () => {};
    },
    signOut() {
      () => {};
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const accessToken = user.accessToken;
        const decoded = jwtDecode(accessToken) as any;
        const expires = new Date(0);
        expires.setUTCSeconds(decoded.exp);

        if (typeof user !== "undefined") {
          token.user = user;
        }

        token.tokenExpirationDate = expires;
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.accessToken = token.accessToken;
        session.user.rol = token.rol;
      }
      return session;
    },
},
pages: {
  signIn: "/login",
},
  secret: process.env.NEXTAUTH_SECRET
};
