const API_BASE_URL = "http://192.168.0.106:3003";

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

export const answerService = {
  async createAnswer(answerData: AnswerCreate): Promise<AnswerResponse> {
    console.log("Criando resposta...");

    const response = await fetch(`${API_BASE_URL}/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(answerData),
    });

    console.log("📥 Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Erro:", errorText);
      throw new Error(
        `Erro ao criar resposta: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  },

  async getAnswersByQuestion(questionId: string): Promise<AnswerResponse[]> {
    const response = await fetch(
      `${API_BASE_URL}/answers?question_id=${questionId}`
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar respostas: ${response.statusText}`);
    }

    return await response.json();
  },
};

export const questionService = {
  async createQuestion(
    questionData: QuestionCreate
  ): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro detalhado da API:", errorText);
      throw new Error(
        `Erro ao criar pergunta: ${response.status} - ${errorText}`
      );
    }

    return await response.json();
  },

  async getQuestions(
    skip: number = 0,
    limit: number = 100
  ): Promise<QuestionResponse[]> {
    const response = await fetch(
      `${API_BASE_URL}/questions?skip=${skip}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar perguntas: ${response.statusText}`);
    }

    return await response.json();
  },

  async getQuestionById(questionId: string): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar pergunta: ${response.statusText}`);
    }

    return await response.json();
  },

  async updateQuestion(
    questionId: string,
    questionData: Partial<QuestionCreate>
  ): Promise<QuestionResponse> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questionData),
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar pergunta: ${response.statusText}`);
    }

    return await response.json();
  },

  async deleteQuestion(questionId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/questions/${questionId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar pergunta: ${response.statusText}`);
    }
  },
};

export const teamService = {
  async createTeam(teamData: TeamCreate): Promise<TeamResponse> {
    const response = await fetch(`${API_BASE_URL}/teams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(teamData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao criar time: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  async getTeams(
    skip: number = 0,
    limit: number = 100
  ): Promise<TeamResponse[]> {
    const response = await fetch(
      `${API_BASE_URL}/teams?skip=${skip}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`Erro ao buscar times: ${response.statusText}`);
    }

    return await response.json();
  },

  async getTeamById(teamId: string): Promise<TeamResponse> {
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}`);

    if (!response.ok) {
      throw new Error(`Erro ao buscar time: ${response.statusText}`);
    }

    return await response.json();
  },
};
