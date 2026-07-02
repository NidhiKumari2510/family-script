import { Prisma } from "@prisma/client";

import { prisma } from "@/config/database";

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  createUser(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
    });
  },

  createToken(data: Prisma.VerificationTokenCreateInput) {
    return prisma.verificationToken.create({
      data,
    });
  },

  findToken(token: string) {
    return prisma.verificationToken.findUnique({
      where: { token },
    });
  },
};