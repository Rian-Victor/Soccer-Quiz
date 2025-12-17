import { appSettings } from "../Configs/settings";
import { getAxiosInstance } from "../app/hooks/useAxios";

export interface RankingItem {
    rank: number;
    user_id: number;
    user_name: string;
    total_points: number;
    total_quizzes?: number;
    average_points?: number;
}

export interface FastestPlayerItem {
    rank: number;
    user_id: number;
    user_name: string;
    fastest_time_seconds: number;
    fastest_time_formatted: string;
}

export interface RankingResponse {
    ranking: RankingItem[];
}

export interface FastestResponse {
    fastest_players: FastestPlayerItem[];
}

interface UserResponse {
    id: number;
    name: string;
    email: string;
    role: string;
}

// URL base do ranking service (porta 3005)
const RANKING_SERVICE_URL = process.env.EXPO_PUBLIC_RANKING_URL || 
    (appSettings.URL.backend.root.replace(':3000', ':3005'));

const RANKING_API_BASE_URL = `${RANKING_SERVICE_URL}/api/leaderboard`;

// Cache de nomes de usuários para evitar múltiplas requisições
const userNameCache = new Map<number, string>();

// Função auxiliar para buscar nome do usuário
async function getUserName(userId: number): Promise<string> {
    // Verifica cache primeiro
    if (userNameCache.has(userId)) {
        return userNameCache.get(userId)!;
    }

    try {
        const axiosInstance = getAxiosInstance();
        const response = await axiosInstance.get<UserResponse>(`/users/${userId}`);
        const userName = response.data.name;
        userNameCache.set(userId, userName);
        return userName;
    } catch (error: any) {
        console.warn(`Não foi possível buscar nome do usuário ${userId}:`, error.message);
        // Retorna o nome padrão se não conseguir buscar
        return `Jogador #${userId}`;
    }
}

// Função auxiliar para atualizar nomes de usuários no ranking
async function enrichRankingWithUserNames<T extends { user_id: number; user_name: string }>(
    items: T[]
): Promise<T[]> {
    // Identifica quais usuários precisam ter o nome buscado
    const needsNameUpdate = items.filter(item => 
        !item.user_name || 
        item.user_name.startsWith("Jogador #") || 
        item.user_name.match(/^User \d+$/)
    );

    if (needsNameUpdate.length === 0) {
        return items;
    }

    // Busca nomes em paralelo
    const namePromises = needsNameUpdate.map(async (item) => {
        try {
            const realName = await getUserName(item.user_id);
            return { userId: item.user_id, name: realName };
        } catch (error) {
            return { userId: item.user_id, name: item.user_name };
        }
    });

    const names = await Promise.all(namePromises);
    const nameMap = new Map(names.map(n => [n.userId, n.name]));

    // Atualiza os nomes
    return items.map(item => {
        const realName = nameMap.get(item.user_id);
        if (realName && realName !== item.user_name) {
            return { ...item, user_name: realName };
        }
        return item;
    });
}

export const rankingService = {
    async getRanking(): Promise<RankingItem[]> {
        try {
            const response = await fetch(`${RANKING_API_BASE_URL}/general?limit=50`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao buscar ranking: ${response.status} - ${errorText}`);
            }

            const data: RankingResponse = await response.json();
            const ranking = data.ranking ?? [];
            
            // Enriquece o ranking com nomes reais dos usuários
            return await enrichRankingWithUserNames(ranking);
        } catch (error: any) {
            const errorMessage =
                error.message ||
                "Erro ao buscar ranking";
            console.error("Erro na requisição do ranking geral:", error);
            throw new Error(`Erro ao buscar ranking: ${errorMessage}`);
        }
    },

    async getFastestPlayers(): Promise<FastestPlayerItem[]> {
        try {
            const response = await fetch(`${RANKING_API_BASE_URL}/fastest?limit=50`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro ao buscar mais rápidos: ${response.status} - ${errorText}`);
            }

            const data: FastestResponse = await response.json();
            const fastest = data.fastest_players ?? [];
            
            // Enriquece o ranking com nomes reais dos usuários
            return await enrichRankingWithUserNames(fastest);
        } catch (error: any) {
            const errorMessage =
                error.message ||
                "Erro ao buscar mais rápidos";
            console.error("Erro na requisição do ranking de velocidade:", error);
            throw new Error(`Erro ao buscar mais rápidos: ${errorMessage}`);
        }
    }
};