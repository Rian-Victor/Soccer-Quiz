const BACKEND_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "http://192.168.0.106:3000";

export const appSettings = {
  name: "FutQuiz",
  title: "FutQuiz",
  version: "1.0.0",
  description: "Aplicativo de quizzes sobre futebol",
  URL: {
    backend: {
      root: BACKEND_BASE_URL,
      docs: `${BACKEND_BASE_URL}/docs`,
      api: `${BACKEND_BASE_URL}/api`,
    },
  },
};
