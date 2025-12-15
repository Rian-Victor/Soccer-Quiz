import axios, { AxiosInstance } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appSettings } from "../../Configs/settings";

// Criar instância do axios com interceptors
const createAxiosInstance = (): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: appSettings.URL.backend.api,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Interceptor para adicionar token de autenticação
  axiosInstance.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Adicionar headers de role e user_id
        const userRole = await AsyncStorage.getItem("user_role");
        const userId = await AsyncStorage.getItem("user_id");

        if (userRole) {
          config.headers["X-User-Role"] = userRole;
        }
        if (userId) {
          config.headers["X-User-Id"] = userId;
        }
      } catch (error) {
        console.error("Erro ao ler dados do AsyncStorage:", error);
      }
      return config;
    },
    (error) => {
      throw error;
    }
  );

  // Interceptor para tratamento de erros
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Token expirado ou inválido
        // Opcional: tentar refresh token ou redirecionar para login
        console.warn("Token inválido ou expirado");
      }
      throw error;
    }
  );

  return axiosInstance;
};

// Função para obter instância do axios (usada em serviços)
export const getAxiosInstance = (): AxiosInstance => {
  return createAxiosInstance();
};

// Hook React (usado em componentes)
export const useAxios = (): AxiosInstance => {
  return createAxiosInstance();
};

export default useAxios;
