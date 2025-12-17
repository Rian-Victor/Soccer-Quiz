import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance } from "axios";
import { appSettings } from "../../Configs/settings";

const createAxiosInstance = (): AxiosInstance => {
  const axiosInstance = axios.create({
    baseURL: appSettings.URL.backend.api,
    headers: {
      "Content-Type": "application/json",
    },
  });

  axiosInstance.interceptors.request.use(
    async (config) => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

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

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        console.warn("Token inválido ou expirado");
      }
      throw error;
    }
  );

  return axiosInstance;
};

export const getAxiosInstance = (): AxiosInstance => {
  return createAxiosInstance();
};

export const useAxios = (): AxiosInstance => {
  return createAxiosInstance();
};

export default useAxios;
