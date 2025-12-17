import axios from "axios";
import { appSettings } from "../Configs/settings";

export interface UserCreate {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "comum";
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  role: string;
}

// SRP: userService encapsula apenas chamadas relacionadas a usuários.
// OCP: novos endpoints de user podem ser adicionados aqui sem alterar o contrato utilizado pelos consumidores.
// Instância do axios sem token para rotas públicas de usuário (cadastro)
const userAxios = axios.create({
  baseURL: appSettings.URL.backend.api,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 segundos (aumentado para debug)
});

// SRP: userService encapsula apenas chamadas relacionadas a usuários.
// OCP: novos endpoints de user podem ser adicionados aqui sem alterar o contrato utilizado pelos consumidores.
export const userService = {
  async createUser(userData: UserCreate): Promise<UserResponse> {
    console.log("Criando usuário...");
    console.log("URL:", `${appSettings.URL.backend.api}/users`);
    console.log("Dados:", {
      name: userData.name,
      email: userData.email,
      password: "***",
    });
    const startTime = Date.now();

    try {
      console.log("Enviando requisição POST /users...");
      const response = await userAxios.post<UserResponse>("/users", userData);
      const duration = Date.now() - startTime;
      console.log(`Status: ${response.status} (${duration}ms)`);
      return response.data;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error(`Erro após ${duration}ms:`, error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);

      let errorMessage;
      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Tempo de conexão esgotado. Verifique sua conexão de rede e se o servidor está acessível.";
      } else if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
        errorMessage =
          "Não foi possível conectar ao servidor. Verifique se o backend está rodando e se o IP está correto.";
      } else {
        errorMessage =
          error.response?.data?.detail ||
          error.message ||
          "Erro ao criar usuário";
      }
      console.error("Erro final:", errorMessage);
      throw new Error(
        `Erro ao criar usuário: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }
  },
};
