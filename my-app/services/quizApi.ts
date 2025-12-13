import { getAxiosInstance } from "../app/hooks/useAxios";

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

// SRP: answerService lida apenas com os endpoints de respostas.
// OCP: novos comportamentos podem ser estendidos neste objeto sem alterar os consumidores existentes.
export const answerService = {
  async createAnswer(answerData: AnswerCreate): Promise<AnswerResponse> {
    console.log("Criando resposta...");

    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post<AnswerResponse>(
        "/answers",
        answerData
      );
      console.log("Status:", response.status);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao criar resposta";
      console.error("Erro:", errorMessage);
      throw new Error(
        `Erro ao criar resposta: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }
  },

  async getAnswersByQuestion(questionId: string): Promise<AnswerResponse[]> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<AnswerResponse[]>("/answers", {
        params: { question_id: questionId },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao buscar respostas";
      throw new Error(`Erro ao buscar respostas: ${errorMessage}`);
    }
  },
};

// SRP: questionService agrupa apenas a lógica de perguntas.
// OCP: a interface permanece estável para os componentes, mesmo quando novos métodos são adicionados.
export const questionService = {
  async createQuestion(
    questionData: QuestionCreate
  ): Promise<QuestionResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post<QuestionResponse>(
        "/questions",
        questionData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao criar pergunta";
      console.error("Erro detalhado da API:", errorMessage);
      throw new Error(
        `Erro ao criar pergunta: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }
  },

  async getQuestions(
    skip: number = 0,
    limit: number = 100
  ): Promise<QuestionResponse[]> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<QuestionResponse[]>(
        "/questions",
        {
          params: { skip, limit },
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao buscar perguntas";
      throw new Error(`Erro ao buscar perguntas: ${errorMessage}`);
    }
  },

  async getQuestionById(questionId: string): Promise<QuestionResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<QuestionResponse>(
        `/questions/${questionId}`
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao buscar pergunta";
      throw new Error(`Erro ao buscar pergunta: ${errorMessage}`);
    }
  },

  async updateQuestion(
    questionId: string,
    questionData: Partial<QuestionCreate>
  ): Promise<QuestionResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.patch<QuestionResponse>(
        `/questions/${questionId}`,
        questionData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao atualizar pergunta";
      throw new Error(`Erro ao atualizar pergunta: ${errorMessage}`);
    }
  },

  async deleteQuestion(questionId: string): Promise<void> {
    try {
      const axiosInstance = getAxiosInstance();
      await axiosInstance.delete(`/questions/${questionId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao deletar pergunta";
      throw new Error(`Erro ao deletar pergunta: ${errorMessage}`);
    }
  },
};

// SRP: teamService concentra as chamadas relacionadas a times.
// OCP: permite incluir ações adicionais sem impactar quem consome o objeto hoje.
export const teamService = {
  async createTeam(teamData: TeamCreate): Promise<TeamResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post<TeamResponse>(
        "/teams",
        teamData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao criar time";
      throw new Error(
        `Erro ao criar time: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }
  },

  async getTeams(
    skip: number = 0,
    limit: number = 100
  ): Promise<TeamResponse[]> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<TeamResponse[]>("/teams", {
        params: { skip, limit },
      });
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao buscar times";
      throw new Error(`Erro ao buscar times: ${errorMessage}`);
    }
  },

  async getTeamById(teamId: string): Promise<TeamResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<TeamResponse>(
        `/teams/${teamId}`
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao buscar time";
      throw new Error(`Erro ao buscar time: ${errorMessage}`);
    }
  },
};
