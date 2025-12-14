import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.211:3003";

export interface QuestionCreateRequest {
    statement: string;
    topic: string;
    difficulty: string;
    options: string[];
    correct_option_index: number;
    team_id?: string | null;
}

export interface QuestionResponse {
    id: string;
    statement: string;
    topic: string;
    difficulty: string;
    options?: string[];
    correct_option_index?: number;
}

export interface TeamCreate {
    name: string;
    country: string;
    members: number[];
}

export interface TeamResponse {
    id: string;
    name: string;
    country: string;
    members: number[];
}

export const questionService = {
    async createFullQuestion(questionData: QuestionCreateRequest): Promise<any> {
        const response = await fetch(`${API_BASE_URL}/questions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(questionData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao criar: ${errorText}`);
        }
        return await response.json();
    },

    async getQuestions(skip: number = 0, limit: number = 100): Promise<QuestionResponse[]> {
        const response = await fetch(`${API_BASE_URL}/questions?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error("Erro ao buscar perguntas");
        return await response.json();
    },

    async updateQuestion(questionId: string, questionData: any): Promise<any> {
        return {};
    },
};

export const answerService = {
    async getAnswersByQuestion(questionId: string): Promise<any[]> {
        const response = await fetch(`${API_BASE_URL}/answers?question_id=${questionId}`);
        if (!response.ok) return [];
        return await response.json();
    },
    async createAnswer(data: any): Promise<any> { return {}; }
};

export const teamService = {
    async createTeam(teamData: TeamCreate): Promise<TeamResponse> {
        const response = await fetch(`${API_BASE_URL}/teams`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(teamData),
        });
        if (!response.ok) throw new Error("Erro ao criar time");
        return await response.json();
    },
    async getTeams(): Promise<TeamResponse[]> {
        const response = await fetch(`${API_BASE_URL}/teams`);
        if (!response.ok) return [];
        return await response.json();
    },
};

export const quizGameService = {
    async getHeaders() {
        const userId = await AsyncStorage.getItem("user_id");
        return {
            "Content-Type": "application/json",
            "X-User-Id": userId || "12"
        };
    },

    async startQuiz(quizType: "general" | "team" = "general", teamId?: string) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}/quizzes/start`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ quiz_type: quizType, team_id: teamId || null })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(txt);
        }
        return await response.json();
    },

    async getCurrentQuiz() {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}/quizzes/current`, {
            method: "GET",
            headers: headers
        });

        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Erro ao buscar jogo atual");

        return await response.json();
    },

    async submitAnswer(sessionId: string, questionId: string, answerId: string, timeTaken: number) {
        const headers = await this.getHeaders();
        console.log("📤 Enviando Resposta:", { sessionId, questionId, answerId });

        const response = await fetch(`${API_BASE_URL}/quizzes/answer`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                session_id: sessionId,
                question_id: questionId,
                answer_id: answerId,
                time_taken_seconds: timeTaken
            })
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            console.error("❌ Erro Backend:", response.status, errorMsg);
            throw new Error(errorMsg || "Erro desconhecido ao enviar resposta");
        }
        return await response.json();
    }
};