/*
  Convert the prior auth table shape into the current auth infrastructure schema.
  This migration is defensive because branch history produced two possible prior
  states: uppercase app tables or lowercase Better Auth tables.
*/

-- If the previous migration produced Better Auth lowercase tables, rename them.
ALTER TABLE IF EXISTS "user" RENAME TO "User";
ALTER TABLE IF EXISTS "account" RENAME TO "Account";
ALTER TABLE IF EXISTS "session" RENAME TO "Session";

ALTER INDEX IF EXISTS "user_email_key" RENAME TO "User_email_key";
ALTER INDEX IF EXISTS "account_userId_idx" RENAME TO "Account_userId_idx";
ALTER INDEX IF EXISTS "account_providerId_accountId_key" RENAME TO "Account_provider_providerAccountId_key";
ALTER INDEX IF EXISTS "session_token_key" RENAME TO "Session_token_key";
ALTER INDEX IF EXISTS "session_userId_idx" RENAME TO "Session_userId_idx";
ALTER INDEX IF EXISTS "session_expiresAt_idx" RENAME TO "Session_expiresAt_idx";

-- Convert User fields to the A4 schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'image'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'avatarUrl'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "image" TO "avatarUrl";
  END IF;
END $$;

ALTER TABLE "User"
DROP COLUMN IF EXISTS "emailVerifiedAt",
DROP COLUMN IF EXISTS "image",
DROP COLUMN IF EXISTS "passwordHash",
DROP COLUMN IF EXISTS "status",
DROP COLUMN IF EXISTS "username",
ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
ADD COLUMN IF NOT EXISTS "bio" TEXT,
ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "locale" TEXT,
ADD COLUMN IF NOT EXISTS "timezone" TEXT;

DROP INDEX IF EXISTS "user_status_idx";
DROP INDEX IF EXISTS "User_status_idx";
DROP INDEX IF EXISTS "user_username_key";
DROP INDEX IF EXISTS "User_username_key";
CREATE INDEX IF NOT EXISTS "User_deletedAt_idx" ON "User"("deletedAt");

-- Convert Account fields to the A4 schema.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Account' AND column_name = 'providerId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Account' AND column_name = 'provider'
  ) THEN
    ALTER TABLE "Account" RENAME COLUMN "providerId" TO "provider";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Account' AND column_name = 'accountId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Account' AND column_name = 'providerAccountId'
  ) THEN
    ALTER TABLE "Account" RENAME COLUMN "accountId" TO "providerAccountId";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Account' AND column_name = 'accessTokenExpiresAt'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Account' AND column_name = 'expiresAt'
  ) THEN
    ALTER TABLE "Account" RENAME COLUMN "accessTokenExpiresAt" TO "expiresAt";
  END IF;
END $$;

ALTER TABLE "Account"
DROP COLUMN IF EXISTS "refreshTokenExpiresAt",
DROP COLUMN IF EXISTS "scope",
DROP COLUMN IF EXISTS "idToken",
DROP COLUMN IF EXISTS "password";

DROP INDEX IF EXISTS "account_providerId_idx";
DROP INDEX IF EXISTS "Account_providerId_idx";
DROP INDEX IF EXISTS "Account_provider_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- Convert the old verification table into the A4 VerificationToken model.
ALTER TABLE IF EXISTS "verification" DROP CONSTRAINT IF EXISTS "verification_userId_fkey";
ALTER TABLE IF EXISTS "Verification" DROP CONSTRAINT IF EXISTS "Verification_userId_fkey";

ALTER TABLE IF EXISTS "verification" RENAME TO "VerificationToken";
ALTER TABLE IF EXISTS "Verification" RENAME TO "VerificationToken";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'VerificationToken' AND column_name = 'identifier'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'VerificationToken' AND column_name = 'email'
  ) THEN
    ALTER TABLE "VerificationToken" RENAME COLUMN "identifier" TO "email";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'VerificationToken' AND column_name = 'value'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'VerificationToken' AND column_name = 'token'
  ) THEN
    ALTER TABLE "VerificationToken" RENAME COLUMN "value" TO "token";
  END IF;
END $$;

ALTER TABLE "VerificationToken"
ADD COLUMN IF NOT EXISTS "email" TEXT,
ADD COLUMN IF NOT EXISTS "token" TEXT;

ALTER TABLE "VerificationToken"
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "token" SET NOT NULL,
ALTER COLUMN "createdAt" SET NOT NULL,
ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "VerificationToken"
DROP COLUMN IF EXISTS "updatedAt",
DROP COLUMN IF EXISTS "userId",
DROP COLUMN IF EXISTS "type";

ALTER INDEX IF EXISTS "verification_pkey" RENAME TO "VerificationToken_pkey";
ALTER INDEX IF EXISTS "Verification_pkey" RENAME TO "VerificationToken_pkey";
DROP INDEX IF EXISTS "verification_identifier_idx";
DROP INDEX IF EXISTS "Verification_userId_idx";
DROP INDEX IF EXISTS "verification_expiresAt_idx";
DROP INDEX IF EXISTS "Verification_expiresAt_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE INDEX IF NOT EXISTS "VerificationToken_email_idx" ON "VerificationToken"("email");
CREATE INDEX IF NOT EXISTS "VerificationToken_expiresAt_idx" ON "VerificationToken"("expiresAt");

-- PasswordReset may or may not exist depending on the prior branch path. The A4 schema uses PasswordResetToken.
ALTER TABLE IF EXISTS "PasswordReset" DROP CONSTRAINT IF EXISTS "PasswordReset_userId_fkey";
DROP TABLE IF EXISTS "PasswordReset";

CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

ALTER TABLE "PasswordResetToken" DROP CONSTRAINT IF EXISTS "PasswordResetToken_userId_fkey";
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP TYPE IF EXISTS "VerificationType";
DROP TYPE IF EXISTS "UserStatus";
