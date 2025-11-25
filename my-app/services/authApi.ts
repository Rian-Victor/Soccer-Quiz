const API_BASE_URL = "http://192.168.0.106:3002";

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

export const authService = {
  async login(loginData: LoginRequest): Promise<LoginResponse> {
    console.log("Fazendo login...");

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    console.log("Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro:", errorText);
      throw new Error(`Erro ao fazer login: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async logout(logoutData: LogoutRequest): Promise<LogoutResponse> {
    console.log("Fazendo logout...");

    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logoutData),
    });

    console.log("Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro:", errorText);
      throw new Error(`Erro ao fazer logout: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async refreshToken(
    refreshData: RefreshTokenRequest
  ): Promise<RefreshTokenResponse> {
    console.log("Renovando token...");

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshData),
    });

    console.log("Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro:", errorText);
      throw new Error(
        `Erro ao renovar token: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  },
};

