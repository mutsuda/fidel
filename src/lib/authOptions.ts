import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions, SessionStrategy } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// LOG de depuración para ver si Prisma está bien inicializado en runtime
console.log("[DEBUG] Prisma Adapter init:", {
  prismaType: typeof prisma,
  hasUser: typeof prisma.user,
  prismaKeys: Object.keys(prisma),
  env: process.env.NODE_ENV,
  nodeVersion: process.version
});

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
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Para el MVP, permitimos login con cualquier email
        if (credentials?.email) {
          return {
            id: "1",
            email: credentials.email,
            name: credentials.email.split("@")[0],
          };
        }
        return null;
      }
    }),
  ],
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }: { session: any, token: any }) {
      console.log("[DEBUG] session callback", { session, token });
      if (session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    async signIn({ user, account, profile, email, credentials }) {
      console.log("[DEBUG] signIn callback", { user, account, profile, email, credentials });
      if (!user.email) {
        console.error("[DEBUG] signIn: user.email is missing", { user });
      } else {
        try {
          const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
          console.log("[DEBUG] signIn prisma.user.findUnique", { dbUser });
        } catch (err) {
          console.error("[DEBUG] signIn prisma.user.findUnique ERROR", err);
        }
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default authOptions; 