const RANKING_API_BASE_URL = "http://192.168.0.106:3005";

export interface RankingItem {
    user_id: number;
    user_name: string;
    total_points: number;
}

export interface RankingResponse {
    ranking: RankingItem[];
}

// SRP: rankingService lida apenas com ranking
// OCP: fácil trocar URL, headers, auth depois
export const rankingService = {
    async getRanking(): Promise<RankingItem[]> {
        const response = await fetch(`${RANKING_API_BASE_URL}`);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Erro ao buscar ranking: ${response.status} - ${errorText}`
            );
        }

        const data: RankingResponse = await response.json();
        return data.ranking ?? [];
    },
};