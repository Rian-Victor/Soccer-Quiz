import { getAxiosInstance } from "../app/hooks/useAxios";

// ==================== INTERFACES ====================

export interface QuestionCreate {
  statement: string;
  topic: string;
  difficulty: string;
  options: string[];
  correct_option_index: number;
}

export interface QuestionResponse {
  id: string;
  statement: string;
  topic: string;
  difficulty: string;
  options?: string[];
  correct_option_index?: number;
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

export interface QuizCreate {
  title: string;
  description?: string;
  question_ids: string[];
}

export interface QuizResponse {
  id: string;
  title: string;
  description?: string;
  question_ids: string[];
  created_at: string;
  created_by: number;
}

// Interfaces para Gameplay
export interface StartQuizRequest {
  quiz_type?: "general" | "team";
  team_id?: string;
  quiz_id?: string;
}

export interface StartQuizResponse {
  message: string;
  session_id: string;
  quiz: QuizSession;
}

export interface QuizSession {
  id: string;
  user_id: number;
  quiz_type: string;
  team_id?: string;
  quiz_id?: string;
  status: "in_progress" | "completed" | "abandoned";
  questions: string[];
  current_question_index: number;
  answers: QuestionAnswer[];
  total_points: number;
  correct_answers: number;
  wrong_answers: number;
  started_at: string;
  finished_at?: string;
  total_time_seconds?: number;
}

export interface QuestionAnswer {
  question_id: string;
  selected_answer_id: string;
  time_taken_seconds: number;
  points_earned: number;
}

export interface SubmitAnswerRequest {
  session_id: string;
  question_id: string;
  answer_id: string;
  time_taken_seconds: number;
}

export interface SubmitAnswerResponse {
  is_correct: boolean;
  points_earned: number;
  current_question_index: number;
  total_points: number;
  correct_answers: number;
  wrong_answers: number;
  is_finished: boolean;
}

export interface QuestionWithAnswers {
  id: string;
  statement: string;
  topic: string;
  difficulty: string;
  answers: AnswerResponse[];
}

// ==================== SERVICES ====================

// SRP: answerService lida apenas com os endpoints de respostas.
export const answerService = {
  async createAnswer(answerData: AnswerCreate): Promise<AnswerResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post<AnswerResponse>(
        "/answers",
        answerData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao criar resposta";
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

// SRP: quizService concentra as chamadas relacionadas a quizzes pré-definidos.
export const quizService = {
  async createQuiz(quizData: QuizCreate): Promise<QuizResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post<QuizResponse>(
        "/quizzes-admin",
        quizData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao criar quiz";
      throw new Error(
        `Erro ao criar quiz: ${
          error.response?.status || "unknown"
        } - ${errorMessage}`
      );
    }
  },

  async getQuizzes(
    skip: number = 0,
    limit: number = 100
  ): Promise<QuizResponse[]> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<QuizResponse[]>(
        "/quizzes-admin",
        {
          params: { skip, limit },
        }
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao buscar quizzes";
      throw new Error(`Erro ao buscar quizzes: ${errorMessage}`);
    }
  },

  async getQuizById(quizId: string): Promise<QuizResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<QuizResponse>(
        `/quizzes-admin/${quizId}`
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao buscar quiz";
      throw new Error(`Erro ao buscar quiz: ${errorMessage}`);
    }
  },

  async updateQuiz(
    quizId: string,
    quizData: Partial<QuizCreate>
  ): Promise<QuizResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.patch<QuizResponse>(
        `/quizzes-admin/${quizId}`,
        quizData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao atualizar quiz";
      throw new Error(`Erro ao atualizar quiz: ${errorMessage}`);
    }
  },

  async deleteQuiz(quizId: string): Promise<void> {
    try {
      const axiosInstance = getAxiosInstance();
      await axiosInstance.delete(`/quizzes-admin/${quizId}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao deletar quiz";
      throw new Error(`Erro ao deletar quiz: ${errorMessage}`);
    }
  },
};

// SRP: gameplayService concentra as chamadas relacionadas ao gameplay de quizzes.
export const gameplayService = {
  async startQuiz(
    quizId?: string,
    teamId?: string
  ): Promise<StartQuizResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const requestData: StartQuizRequest = {
        quiz_type: "general",
        quiz_id: quizId,
        team_id: teamId,
      };
      const response = await axiosInstance.post<StartQuizResponse>(
        "/api/quiz/start",
        requestData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao iniciar quiz";
      throw new Error(`Erro ao iniciar quiz: ${errorMessage}`);
    }
  },

  async getCurrentQuiz(): Promise<QuizSession> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.get<QuizSession>(
        "/api/quiz/current"
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        const notFoundError = new Error("404") as any;
        notFoundError.is404 = true;
        throw notFoundError;
      }
      const errorMessage =
        error.response?.data?.detail || error.message || "Erro ao buscar quiz";
      throw new Error(`Erro ao buscar quiz: ${errorMessage}`);
    }
  },

  async submitAnswer(
    sessionId: string,
    questionId: string,
    answerId: string,
    timeTakenSeconds: number
  ): Promise<SubmitAnswerResponse> {
    try {
      const axiosInstance = getAxiosInstance();
      const requestData: SubmitAnswerRequest = {
        session_id: sessionId,
        question_id: questionId,
        answer_id: answerId,
        time_taken_seconds: timeTakenSeconds,
      };
      const response = await axiosInstance.post<SubmitAnswerResponse>(
        "/api/quiz/answer",
        requestData
      );
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao submeter resposta";
      throw new Error(`Erro ao submeter resposta: ${errorMessage}`);
    }
  },

  async abandonQuiz(sessionId: string): Promise<{
    message: string;
    total_points: number;
    questions_answered: number;
  }> {
    try {
      const axiosInstance = getAxiosInstance();
      const response = await axiosInstance.post<{
        message: string;
        total_points: number;
        questions_answered: number;
      }>(`/api/quiz/abandon/${sessionId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao abandonar quiz";
      throw new Error(`Erro ao abandonar quiz: ${errorMessage}`);
    }
  },

  async getQuestionWithAnswers(
    questionId: string
  ): Promise<QuestionWithAnswers> {
    try {
      const [question, answers] = await Promise.all([
        questionService.getQuestionById(questionId),
        answerService.getAnswersByQuestion(questionId),
      ]);

      return {
        id: question.id,
        statement: question.statement,
        topic: question.topic,
        difficulty: question.difficulty,
        answers: answers,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail ||
        error.message ||
        "Erro ao buscar pergunta";
      throw new Error(`Erro ao buscar pergunta: ${errorMessage}`);
    }
  },
};

// Compatibilidade: quizGameService (deprecated - usar gameplayService)
// Mantido para compatibilidade com código antigo
export const quizGameService = {
  async getHeaders() {
    // Headers são gerenciados automaticamente pelo axios interceptor
    return {};
  },

  async startQuiz(quizType: "general" | "team" = "general", teamId?: string) {
    return await gameplayService.startQuiz(undefined, teamId);
  },

  async getCurrentQuiz() {
    try {
      return await gameplayService.getCurrentQuiz();
    } catch (error: any) {
      if (error.is404) {
        return null;
      }
      throw error;
    }
  },

  async submitAnswer(
    sessionId: string,
    questionId: string,
    answerId: string,
    timeTaken: number
  ) {
    return await gameplayService.submitAnswer(
      sessionId,
      questionId,
      answerId,
      timeTaken
    );
  },
};
