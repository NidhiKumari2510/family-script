import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

import { prisma } from "./database";
import { env } from "./env";

// Developer A owns Better Auth infrastructure: adapter wiring, session support, and auth-level plugins.
const baseURL = `http://localhost:${env.PORT}`;

export const auth = betterAuth({
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  // Better Auth stores users, accounts, sessions, and verification tokens through Prisma.
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  // Bearer support lets API clients authenticate with Authorization: Bearer xxx in addition to cookies.
  plugins: [bearer()],
  // OAuth providers are configured here; route/controller wiring belongs to the auth module owner.
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  user: {
    // The app schema calls the Better Auth image field avatarUrl.
    fields: {
      image: "avatarUrl",
    },
    // These profile fields are owned by the application but persisted with the auth user record.
    additionalFields: {
      bio: {
        type: "string",
        required: false,
      },
      locale: {
        type: "string",
        required: false,
      },
      timezone: {
        type: "string",
        required: false,
      },
      deletedAt: {
        type: "date",
        required: false,
      },
    },
  },
  account: {
  // Prisma schema already uses Better Auth's default field names — no mapping needed.
  },
  verification: {
    modelName: "verification",
    fields: {
      identifier: "email",
      value: "token",
    },
    storeInDatabase: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      console.info(`Password reset requested for ${user.email}: ${url}`);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      // Email delivery belongs outside Developer A's file ownership; log the generated URL until that integration is added.
      console.info(`Email verification requested for ${user.email}: ${url}`);
    },
  },
});
