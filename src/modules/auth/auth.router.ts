import { authController } from "./auth.controller";

export const registerHandler = authController.register;
export const loginHandler = authController.login;
