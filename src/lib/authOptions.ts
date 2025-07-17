import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions, SessionStrategy } from "next-auth";

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
    strategy: "jwt" as SessionStrategy,
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