import { api } from "./api";

export interface IRegister {
    name: string;
    email: string;
    password: string;
}

export interface ILogin {
    email: string;
    password: string;
}

export async function registerUser(data: IRegister) {
    try {
        const response = await api.post("/auth/register", data);
        return response.data;
    } catch (error: any) {
        console.log("Error registerUser:", error?.response?.data || error);

        throw error?.response?.data || { message: "Erro ao cadastrar usuário" };
    }
}

export async function loginUser(data: ILogin) {
    try {
        const response = await api.post("/auth/login", data);
        return response.data;
    } catch (error: any) {
        console.log("Error loginUser:", error?.response?.data || error);

        throw error?.response?.data || { message: "Erro ao fazer login" };
    }
}
