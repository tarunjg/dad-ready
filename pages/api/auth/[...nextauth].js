import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only allow specific email(s) to sign in
      const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || [];
      if (allowedEmails.length > 0 && !allowedEmails.includes(user.email)) {
        return false;
      }
      return true;
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};

export default NextAuth(authOptions);
