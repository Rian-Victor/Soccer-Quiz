import axios from "axios";
import { appSettings } from "../Configs/settings";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
  user_id: number;
  role: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface LogoutResponse {
  message: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_at: string;
}

// SRP: authService encapsula apenas chamadas relacionadas à autenticação.
// OCP: novos endpoints de auth podem ser adicionados aqui sem alterar o contrato utilizado pelos consumidores.
// Instância do axios sem token para rotas de autenticação (login/logout/refresh)
const authAxios = axios.create({
  baseURL: appSettings.URL.backend.api,
  headers: {
    "Content-Type": "application/json",
  },
});

// SRP: authService encapsula apenas chamadas relacionadas à autenticação.
// OCP: novos endpoints de auth podem ser adicionados aqui sem alterar o contrato utilizado pelos consumidores.
export const authService = {
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    console.log("Fazendo login...");

    try {
      const response = await authAxios.post<LoginResponse>(
        "/auth/login",
        loginData
      );
      console.log("Status:", response.status);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao fazer login";
      console.error("Erro:", errorMessage);
      throw new Error(
        `Erro ao fazer login: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }
  },

  async logout(logoutData: LogoutRequest): Promise<LogoutResponse> {
    console.log("Fazendo logout...");

    try {
      const response = await authAxios.post<LogoutResponse>(
        "/auth/logout",
        logoutData
      );
      console.log("Status:", response.status);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao fazer logout";
      console.error("Erro:", errorMessage);
      throw new Error(
        `Erro ao fazer logout: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }

    return await response.json();
  },

  async refreshToken(
    refreshData: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    console.log("Renovando token...");

    try {
      const response = await authAxios.post<RefreshTokenResponse>(
        "/auth/refresh",
        refreshData
      );
      console.log("Status:", response.status);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao renovar token";
      console.error("Erro:", errorMessage);
      throw new Error(
        `Erro ao renovar token: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }
  },
};