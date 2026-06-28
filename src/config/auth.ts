import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer } from "better-auth/plugins";

import { prisma } from "./database";
import { env } from "./env";

const baseURL = `http://localhost:${env.PORT}`;

export const auth = betterAuth({
  baseURL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [bearer()],
  user: {
    fields: {
      image: "avatarUrl",
    },
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
    fields: {
      providerId: "provider",
      accountId: "providerAccountId",
      accessTokenExpiresAt: "expiresAt",
    },
  },
  verification: {
    modelName: "verificationToken",
    fields: {
      identifier: "email",
      value: "token",
    },
    storeInDatabase: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 60 * 60,
    async sendVerificationEmail({ user, url }) {
      console.info(`Email verification requested for ${user.email}: ${url}`);
    },
  },
});
