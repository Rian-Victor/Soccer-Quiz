import axios from "axios";
import { appSettings } from "../Configs/settings";

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { access_token: string; refresh_token: string; token_type: string; expires_at: string; user_id: number; role: string; }
export interface LogoutRequest { refresh_token: string; }
export interface LogoutResponse { message: string; }
export interface RefreshTokenRequest { refresh_token: string; }
export interface RefreshTokenResponse { access_token: string; refresh_token: string; token_type: string; expires_at: string; }

export interface PasswordResetRequest {
  email: string;
}
export interface PasswordResetResponse {
  message: string;
}

export interface ConfirmResetRequest {
  token: string;
  new_password: string;
  email: string;
}

const authAxios = axios.create({
  baseURL: appSettings.URL.backend.api,
  headers: { "Content-Type": "application/json" },
});

export const authService = {
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    const response = await authAxios.post<LoginResponse>("/auth/login", loginData);
    return response.data;
  },
  async logout(logoutData: LogoutRequest): Promise<LogoutResponse> {
    const response = await authAxios.post<LogoutResponse>("/auth/logout", logoutData);
    return response.data;
  },
  async refreshToken(refreshData: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await authAxios.post<RefreshTokenResponse>("/auth/refresh", refreshData);
    return response.data;
  },

  async requestPasswordReset(
    resetData: PasswordResetRequest
  ): Promise<PasswordResetResponse> {
    console.log("Solicitando recuperação de senha para:", resetData.email);

    try {
      const response = await authAxios.post<PasswordResetResponse>(
        "/users/password/forgot",
        resetData
      );
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  async confirmPasswordReset(data: ConfirmResetRequest): Promise<any> {
    console.log("Enviando token e nova senha...");
    try {
      const response = await authAxios.post("/users/password/reset", data);
      
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Erro ao redefinir a senha";
      console.error("Erro no reset:", errorMessage);
      throw new Error(`Erro: ${error.response?.status || "unknown"} - ${errorMessage}`);
    }
  },
};