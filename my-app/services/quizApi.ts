import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://192.168.1.211:3003";

export interface QuestionCreate {
    statement: string;
    topic: string;
    difficulty: string;
}

export interface QuestionResponse {
    id: string;
    statement: string;
    topic: string;
    difficulty: string;
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

export interface AnswerCreate {
    questionId: string;
    text: string;
    correct: boolean;
}

export interface AnswerResponse {
    id: string;
    questionId: string;
    text: string;
    correct: boolean;
}

export const answerService = {
    async createAnswer(answerData: AnswerCreate): Promise<AnswerResponse> {
        const response = await fetch(`${API_BASE_URL}/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(answerData),
        });
        if (!response.ok) throw new Error("Erro ao criar resposta");
        return await response.json();
    },
    async getAnswersByQuestion(questionId: string): Promise<AnswerResponse[]> {
        const response = await fetch(`${API_BASE_URL}/answers?question_id=${questionId}`);
        if (!response.ok) throw new Error("Erro ao buscar respostas");
        return await response.json();
    },
};

export const questionService = {
    async createQuestion(questionData: QuestionCreate): Promise<QuestionResponse> {
        const response = await fetch(`${API_BASE_URL}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
        });
        if (!response.ok) throw new Error("Erro ao criar pergunta");
        return await response.json();
    },

    async getQuestions(skip: number = 0, limit: number = 100): Promise<QuestionResponse[]> {
        const response = await fetch(`${API_BASE_URL}/questions?skip=${skip}&limit=${limit}`);
        if (!response.ok) throw new Error("Erro ao buscar perguntas");
        return await response.json();
    },

    async updateQuestion(questionId: string, questionData: Partial<QuestionCreate>): Promise<QuestionResponse> {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(questionData),
        });
        if (!response.ok) throw new Error("Erro ao atualizar pergunta");
        return await response.json();
    },

    async deleteQuestion(questionId: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
            method: "DELETE",
        });
        if (!response.ok) throw new Error("Erro ao deletar pergunta");
    }
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
        if (!response.ok) throw new Error("Erro ao buscar times");
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

    async startQuiz(quizType = "general") {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/quiz/start`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ quiz_type: quizType })
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Erro ao iniciar: ${txt}`);
        }
        return await response.json();
    },

    async getCurrentQuiz() {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/quiz/current`, {
            method: "GET",
            headers: headers
        });

        if (response.status === 404) return null;
        if (!response.ok) throw new Error("Erro ao buscar jogo atual");
        
        return await response.json();
    },

    async submitAnswer(sessionId: string, questionId: string, answerId: string, timeTaken: number) {
        const headers = await this.getHeaders();
        const response = await fetch(`${API_BASE_URL}/api/quiz/answer`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                session_id: sessionId,
                question_id: questionId,
                answer_id: answerId,
                time_taken_seconds: timeTaken
            })
        });

        if (!response.ok) throw new Error("Erro ao enviar resposta");
        return await response.json();
    }
};