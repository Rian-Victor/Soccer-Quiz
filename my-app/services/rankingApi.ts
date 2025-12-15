const RANKING_API_BASE_URL = "http://192.168.1.211:3005/api/leaderboard";

export interface RankingItem {
    rank: number; 
    user_id: number;
    user_name: string;
    total_points: number;

}

export interface RankingResponse {
    ranking: RankingItem[];
}

export const rankingService = {
    async getRanking(): Promise<RankingItem[]> {
        try {
            const response = await fetch(`${RANKING_API_BASE_URL}/general?limit=50`);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Erro ao buscar ranking: ${response.status} - ${errorText}`
                );
            }

            const data: RankingResponse = await response.json();
            return data.ranking ?? [];
        } catch (error) {
            console.error("Erro na requisição do ranking:", error);
            throw error;
        }
    },
};