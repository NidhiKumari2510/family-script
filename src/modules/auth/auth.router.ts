import { authController } from "./auth.controller";

export const registerHandler = authController.register;
export const loginHandler = authController.login;
export const meHandler = authController.getCurrentUser;
export const verifyEmailHandler = authController.verifyEmail;
export const resendVerificationHandler = authController.resendVerification;
export const forgotPasswordHandler = authController.forgotPassword;
export const resetPasswordHandler = authController.resetPassword;
export const googleSignInHandler = authController.googleSignIn;