import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { QuizResponse, quizService } from "../../services/quizApi";

export default function MyQuizzes() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole !== null && userRole !== "admin") {
      router.replace("/(tabs)/home");
    } else if (userRole === "admin") {
      loadQuizzes();
    }
  }, [userRole]);

  const loadUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("user_role");
      setUserRole(role);
    } catch (error) {
      console.error("Erro ao carregar role do usuário:", error);
    }
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const quizzesData = await quizService.getQuizzes();
      setQuizzes(quizzesData);
    } catch (error: any) {
      console.error("Erro ao carregar quizzes:", error);
      Alert.alert("Erro", "Não foi possível carregar os quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    router.push("/(tabs)/criarquiz");
  };

  const handlePlayQuiz = (quizId: string) => {
    router.push({
      pathname: "/game",
      params: { quizId },
    });
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

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

        <View style={styles.headerBar}>
          <Text style={styles.subtitle}>Seus quizzes</Text>
          {userRole === "admin" && (
            <TouchableOpacity onPress={handleCreateQuiz}>
              <Image
                source={require("../../assets/images/edit.png")}
                style={styles.editIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scrollcontent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#24bf94" />
              <Text style={styles.loadingText}>Carregando quizzes...</Text>
            </View>
          ) : quizzes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                Nenhum quiz disponível ainda.{"\n"}
                {userRole === "admin" && "Crie um quiz para começar!"}
              </Text>
            </View>
          ) : (
            <View style={styles.quizList}>
              {quizzes.map((quiz) => (
                <TouchableOpacity
                  key={quiz.id}
                  style={styles.quizCard}
                  onPress={() => handlePlayQuiz(quiz.id)}
                >
                  <View style={styles.quizImg}></View>
                  <View style={styles.quizInfo}>
                    <Text style={styles.quizTitle}>{quiz.title}</Text>
                    {quiz.description && (
                      <Text style={styles.quizDescription} numberOfLines={2}>
                        {quiz.description}
                      </Text>
                    )}
                    <Text style={styles.quizDate}>
                      {formatDate(quiz.created_at)}
                    </Text>
                    <Text style={styles.quizQuestions}>
                      {quiz.question_ids.length} questão(ões)
                    </Text>
                  </View>
                  <View style={styles.playButton}>
                    <Text style={styles.playButtonText}>Jogar</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
  },

  content: {
    flex: 1,
    width: "100%",
    alignItems: "center",
  },

  logoContent: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 60,
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

  headerBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 25,
  },

  subtitle: {
    fontFamily: "Rubik",
    fontSize: 24,
    fontWeight: "500",
  },

  editIcon: {
    width: 25,
    height: 25,
  },

  scrollcontent: {
    width: "100%",
    marginTop: 10,
  },

  quizList: {
    width: "90%",
    alignSelf: "center",
  },

  quizCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  quizImg: {
    width: 55,
    height: 55,
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    marginRight: 10,
  },

  quizInfo: {
    flex: 1,
    flexShrink: 1,
  },

  quizTitle: {
    fontFamily: "Rubik",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: "#333",
  },

  quizDescription: {
    fontFamily: "Rubik",
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },

  quizDate: {
    fontFamily: "Rubik",
    fontSize: 12,
    color: "#777",
    marginBottom: 2,
  },

  quizQuestions: {
    fontFamily: "Rubik",
    fontSize: 11,
    color: "#24bf94",
    fontWeight: "500",
  },

  playButton: {
    backgroundColor: "#24bf94",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },

  playButtonText: {
    fontFamily: "Rubik",
    fontSize: 14,
    fontWeight: "500",
    color: "#FFF",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },

  loadingText: {
    fontFamily: "Rubik",
    fontSize: 14,
    color: "#777",
    marginTop: 10,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },

  emptyText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    lineHeight: 24,
  },
});