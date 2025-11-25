const API_BASE_URL = "http://172.20.10.6:3003";

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

// SRP: answerService lida apenas com os endpoints de respostas.
// OCP: novos comportamentos podem ser estendidos neste objeto sem alterar os consumidores existentes.
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

    console.log("Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro:", errorText);
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

// SRP: questionService agrupa apenas a lógica de perguntas.
// OCP: a interface permanece estável para os componentes, mesmo quando novos métodos são adicionados.
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

// SRP: teamService concentra as chamadas relacionadas a times.
// OCP: permite incluir ações adicionais sem impactar quem consome o objeto hoje.
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
