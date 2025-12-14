import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  gameplayService,
  QuizSession,
  QuestionWithAnswers,
  SubmitAnswerResponse,
} from "../../services/quizApi";

export default function Gameplay() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const quizId = params.quizId as string;

  const [currentQuiz, setCurrentQuiz] = useState<QuizSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionWithAnswers | null>(null);
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [timer, setTimer] = useState(0); // Tempo total em segundos
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [result, setResult] = useState<{
    totalPoints: number;
    correctAnswers: number;
    wrongAnswers: number;
    totalTime: number;
  } | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeQuiz();
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (currentQuiz && !quizFinished) {
      loadCurrentQuestion();
    }
  }, [currentQuiz?.current_question_index, quizFinished]);

  useEffect(() => {
    if (currentQuestion) {
      setQuestionStartTime(Date.now());
      setSelectedAnswerId(null);
    }
  }, [currentQuestion]);

  // Timer que atualiza a cada segundo
  useEffect(() => {
    if (!quizFinished && currentQuiz) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [quizFinished, currentQuiz]);

  const initializeQuiz = async () => {
    try {
      setLoading(true);
      const response = await gameplayService.startQuiz(quizId);
      setCurrentQuiz(response.quiz);
      setQuestionStartTime(Date.now());
    } catch (error: any) {
      console.error("Erro ao iniciar quiz:", error);
      Alert.alert("Erro", error.message || "Não foi possível iniciar o quiz", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentQuestion = async () => {
    if (!currentQuiz) return;

    const questionId = currentQuiz.questions[currentQuiz.current_question_index];
    if (!questionId) {
      // Quiz finalizado
      finishQuiz();
      return;
    }

    try {
      const question = await gameplayService.getQuestionWithAnswers(questionId);
      setCurrentQuestion(question);
    } catch (error: any) {
      console.error("Erro ao carregar pergunta:", error);
      Alert.alert("Erro", "Não foi possível carregar a pergunta");
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswerId(answerId);
  };

  const handleSubmitAnswer = async () => {
    if (!selectedAnswerId || !currentQuiz || !currentQuestion) {
      Alert.alert("Atenção", "Selecione uma resposta antes de continuar");
      return;
    }

    try {
      setSubmitting(true);
      const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
      
      const response: SubmitAnswerResponse = await gameplayService.submitAnswer(
        currentQuiz.id,
        currentQuestion.id,
        selectedAnswerId,
        timeTaken
      );

      // Atualizar estado do quiz
      if (currentQuiz) {
        const updatedQuiz: QuizSession = {
          ...currentQuiz,
          current_question_index: response.current_question_index,
          total_points: response.total_points,
          correct_answers: response.correct_answers,
          wrong_answers: response.wrong_answers,
        };
        setCurrentQuiz(updatedQuiz);

        if (response.is_finished) {
          finishQuiz();
        } else {
          // Avançar para próxima pergunta
          setSelectedAnswerId(null);
        }
      }
    } catch (error: any) {
      console.error("Erro ao submeter resposta:", error);
      Alert.alert("Erro", error.message || "Não foi possível submeter a resposta");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandonQuiz = async () => {
    Alert.alert(
      "Abandonar Quiz",
      "Tem certeza que deseja abandonar este quiz? Seu progresso será perdido.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Abandonar",
          style: "destructive",
          onPress: async () => {
            if (!currentQuiz) return;
            try {
              await gameplayService.abandonQuiz(currentQuiz.id);
              Alert.alert("Quiz Abandonado", "Você abandonou o quiz", [
                { text: "OK", onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error("Erro ao abandonar quiz:", error);
              Alert.alert("Erro", "Não foi possível abandonar o quiz");
            }
          },
        },
      ]
    );
  };

  const finishQuiz = () => {
    if (!currentQuiz) return;
    setQuizFinished(true);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setResult({
      totalPoints: currentQuiz.total_points,
      correctAnswers: currentQuiz.correct_answers,
      wrongAnswers: currentQuiz.wrong_answers,
      totalTime: timer,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#24bf94" />
          <Text style={styles.loadingText}>Iniciando quiz...</Text>
        </View>
      </View>
    );
  }

  if (quizFinished && result) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.logoContent}>
            <Image
              source={require("../../assets/images/LogoBG.png")}
              style={styles.loginLogo}
            />
            <Text style={styles.title}>FUTQUIZ</Text>
          </View>

          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Quiz Finalizado!</Text>
            
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Pontuação Total</Text>
              <Text style={styles.resultValue}>{result.totalPoints} pontos</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Respostas Corretas</Text>
              <Text style={styles.resultValue}>{result.correctAnswers}</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Respostas Erradas</Text>
              <Text style={styles.resultValue}>{result.wrongAnswers}</Text>
            </View>

            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Tempo Total</Text>
              <Text style={styles.resultValue}>{formatTime(result.totalTime)}</Text>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/(tabs)/quizzes")}
            >
              <Text style={styles.backButtonText}>Voltar para Quizzes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (!currentQuiz || !currentQuestion) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#24bf94" />
          <Text style={styles.loadingText}>Carregando pergunta...</Text>
        </View>
      </View>
    );
  }

  const currentQuestionNumber = currentQuiz.current_question_index + 1;
  const totalQuestions = currentQuiz.questions.length;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleAbandonQuiz}>
            <Text style={styles.abandonButton}>Encerrar</Text>
          </TouchableOpacity>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Questão {currentQuestionNumber} de {totalQuestions}
          </Text>
        </View>

        <ScrollView style={styles.scrollContent}>
          <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{currentQuestion.statement}</Text>
          </View>

          <View style={styles.answersContainer}>
            {currentQuestion.answers.map((answer) => (
              <TouchableOpacity
                key={answer.id}
                style={[
                  styles.answerButton,
                  selectedAnswerId === answer.id && styles.answerButtonSelected,
                ]}
                onPress={() => handleAnswerSelect(answer.id)}
                disabled={submitting}
              >
                <Text
                  style={[
                    styles.answerText,
                    selectedAnswerId === answer.id && styles.answerTextSelected,
                  ]}
                >
                  {answer.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!selectedAnswerId || submitting) && styles.submitButtonDisabled]}
            onPress={handleSubmitAnswer}
            disabled={!selectedAnswerId || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {currentQuestionNumber === totalQuestions ? "Finalizar" : "Próxima"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
  },
  content: {
    flex: 1,
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#777",
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  abandonButton: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#ff4444",
    fontWeight: "500",
  },
  timerContainer: {
    backgroundColor: "#24bf94",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "600",
    color: "#FFF",
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#24bf94",
    borderRadius: 4,
  },
  progressText: {
    fontFamily: "Rubik",
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  questionContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  questionText: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    lineHeight: 26,
  },
  answersContainer: {
    marginBottom: 20,
  },
  answerButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#E5E5E5",
  },
  answerButtonSelected: {
    borderColor: "#24bf94",
    backgroundColor: "#F0FDF9",
  },
  answerText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#333",
  },
  answerTextSelected: {
    color: "#24bf94",
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#24bf94",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    color: "#FFF",
  },
  logoContent: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  loginLogo: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  title: {
    fontFamily: "Rubik",
    fontSize: 25,
    fontWeight: "500",
  },
  resultContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  resultTitle: {
    fontFamily: "Rubik",
    fontSize: 28,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
  },
  resultCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  resultLabel: {
    fontFamily: "Rubik",
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },
  resultValue: {
    fontFamily: "Rubik",
    fontSize: 24,
    fontWeight: "600",
    color: "#24bf94",
  },
  backButton: {
    backgroundColor: "#24bf94",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    color: "#FFF",
  },
});

