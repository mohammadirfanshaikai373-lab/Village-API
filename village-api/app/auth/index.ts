// filepath: app/auth/index.ts
import NextAuth from "next-auth";
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      role?: string;
    };
  }
}

export type { Session } from "next-auth";

// ✅ Cast config to 'any' to bypass TypeScript error
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    {
      id: 'credentials',
      name: 'Credentials',
      type: 'credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials: { email?: string; password?: string } | undefined) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const email = credentials.email;
        const password = credentials.password;
        
        const result = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email]);
        
        if (result.rows.length === 0) {
          return null;
        }
        
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password_hash);
        
        if (!valid) {
          return null;
        }
        
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      }
    }
  ],
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV !== 'production',
  cookies: {
  sessionToken: {
    name: 'next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',        // changed from 'none'
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
  csrfToken: {
    name: 'next-auth.csrf-token',
    options: {
      sameSite: 'lax',        // changed from 'none'
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
  callbackUrl: {
    name: 'next-auth.callback-url',
    options: {
      sameSite: 'lax',        // changed from 'none'
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    },
  },
},
  callbacks: {
    async jwt({ token, user }: { token: any; user?: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  }
} as any);   // ✅ <--- ADD 'as any' HERE to fix TypeScript error