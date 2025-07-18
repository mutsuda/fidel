import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions, SessionStrategy } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extiende el tipo de sesión para incluir siempre user.id
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }
}

const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("[DEBUG] signIn callback", { user, account, profile });
      
      // Solo crear usuario si es login con Google
      if (account?.provider === "google" && user.email) {
        try {
          // Usar upsert para crear o actualizar el usuario
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name || user.email.split("@")[0],
            },
            create: {
              id: user.id, // Usar el ID de Google como ID del usuario
              email: user.email,
              name: user.name || user.email.split("@")[0],
            },
          });
          console.log("[DEBUG] User created/updated in DB:", user.email);
        } catch (error) {
          console.error("[DEBUG] Error creating user:", error);
          // No fallar el login si hay error en BD
        }
      }
      
      return true;
    },
    async session({ session, token }: { session: any, token: any }) {
      console.log("[DEBUG] session callback", { session, token });
      if (session.user) {
        session.user.id = token.id || token.sub!;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      console.log("[DEBUG] jwt callback", { token, user, account });
      if (user) {
        token.id = user.id;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default authOptions; 