import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  Switch,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  questionService,
  teamService,
  QuestionCreateRequest,
  QuestionResponse,
  TeamResponse,
} from "../../services/quizApi";

interface QuestionWithAnswer extends QuestionResponse {
  correctAnswer: string;
  options?: string[];
  correct_option_index?: number;
}

export default function CreateQuestions() {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const [isTeamQuiz, setIsTeamQuiz] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState({
    question: "",
    correctAnswer: "",
    wrong1: "",
    wrong2: "",
    wrong3: "",
  });

  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedCategory = (params.category as string) || "Futebol";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const teamsData = await teamService.getTeams();
      setTeams(teamsData);

      const data = await questionService.getQuestions();

      if (!data || data.length === 0) {
        setQuestions([]);
        return;
      }

      const formattedQuestions = data.map((q: any) => {
        let correctText = "(Erro: Dados antigos)";

        if (
          q.options &&
          Array.isArray(q.options) &&
          typeof q.correct_option_index === "number"
        ) {
          correctText = q.options[q.correct_option_index];
        }

        return {
          ...q,
          correctAnswer: correctText,
        };
      });

      setQuestions(formattedQuestions);
    } catch (error) {
      console.log("Erro ao carregar dados:", error);
      Alert.alert("Erro", "Falha ao carregar lista.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewQuestion = async () => {
    if (
      !newQuestion.question.trim() ||
      !newQuestion.correctAnswer.trim() ||
      !newQuestion.wrong1.trim() ||
      !newQuestion.wrong2.trim() ||
      !newQuestion.wrong3.trim()
    ) {
      Alert.alert("Atenção", "Preencha todos os campos!");
      return;
    }

    if (isTeamQuiz && !selectedTeamId) {
      Alert.alert("Atenção", "Selecione um time para vincular a pergunta!");
      return;
    }

    try {
      setLoading(true);

      const payload: QuestionCreateRequest = {
        statement: newQuestion.question,
        topic: isTeamQuiz ? "Time" : selectedCategory,
        difficulty: "medium",
        options: [
          newQuestion.correctAnswer,
          newQuestion.wrong1,
          newQuestion.wrong2,
          newQuestion.wrong3,
        ],
        correct_option_index: 0,
        team_id: isTeamQuiz ? selectedTeamId : null,
      };

      await questionService.createQuestion(payload);

      Alert.alert("Sucesso", "Pergunta criada!");

      setNewQuestion({
        question: "",
        correctAnswer: "",
        wrong1: "",
        wrong2: "",
        wrong3: "",
      });
      setModalVisible(false);
      await loadData();
    } catch (error: any) {
      Alert.alert("Erro", "Falha ao criar: " + error.message);
    } finally {
      setLoading(false);
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
          <TouchableOpacity onPress={() => router.back()}>
            <Image
              source={require("../../assets/images/arrow-left.png")}
              style={styles.editIcon}
            />
          </TouchableOpacity>
          <Text style={styles.subtitle}>Criar Perguntas</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            disabled={loading}
          >
            <Image
              source={require("../../assets/images/plus-square.png")}
              style={[styles.editIcon, loading && { opacity: 0.5 }]}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollcontent}>
          <View style={styles.questionsContainer}>
            {questions.length === 0 && !loading && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Nenhuma pergunta cadastrada.
                </Text>
              </View>
            )}

            {questions.map((item, index) => (
              <View key={item.id} style={styles.questionCard}>
                <View style={styles.questionHeader}>
                  <Text style={styles.questionCategory}>{item.topic}</Text>
                  <Text style={styles.questionNumber}>#{index + 1}</Text>
                </View>
                <Text style={styles.inputLabel}>{item.statement}</Text>
                <Text style={[styles.answerText, { marginTop: 10 }]}>
                  {item.correctAnswer}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Nova Pergunta</Text>

              <View style={styles.switchContainer}>
                <Text style={styles.inputLabel}>Vincular a um Time?</Text>
                <Switch
                  value={isTeamQuiz}
                  onValueChange={setIsTeamQuiz}
                  trackColor={{ false: "#767577", true: "#24bf94" }}
                />
              </View>

              {isTeamQuiz && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Selecione o Time:</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexDirection: "row", height: 50 }}
                  >
                    {teams.map((team) => (
                      <TouchableOpacity
                        key={team.id}
                        style={[
                          styles.teamOption,
                          selectedTeamId === team.id &&
                            styles.teamOptionSelected,
                        ]}
                        onPress={() => setSelectedTeamId(team.id)}
                      >
                        <Text
                          style={[
                            styles.teamOptionText,
                            selectedTeamId === team.id &&
                              styles.teamOptionTextSelected,
                          ]}
                        >
                          {team.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Enunciado</Text>
                <TextInput
                  style={styles.textInput}
                  value={newQuestion.question}
                  onChangeText={(t) =>
                    setNewQuestion({ ...newQuestion, question: t })
                  }
                  placeholder="Ex: Quem é o maior ídolo?"
                  multiline
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: "#24bf94" }]}>
                  Resposta CERTA (Verde)
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { borderColor: "#24bf94", borderWidth: 2 },
                  ]}
                  value={newQuestion.correctAnswer}
                  onChangeText={(t) =>
                    setNewQuestion({ ...newQuestion, correctAnswer: t })
                  }
                  placeholder="Resposta Correta"
                />
              </View>

              <Text style={[styles.inputLabel, { marginTop: 5 }]}>
                Respostas Erradas
              </Text>
              <TextInput
                style={[styles.textInput, { marginBottom: 8 }]}
                value={newQuestion.wrong1}
                onChangeText={(t) =>
                  setNewQuestion({ ...newQuestion, wrong1: t })
                }
                placeholder="Errada 1"
              />
              <TextInput
                style={[styles.textInput, { marginBottom: 8 }]}
                value={newQuestion.wrong2}
                onChangeText={(t) =>
                  setNewQuestion({ ...newQuestion, wrong2: t })
                }
                placeholder="Errada 2"
              />
              <TextInput
                style={[styles.textInput, { marginBottom: 20 }]}
                value={newQuestion.wrong3}
                onChangeText={(t) =>
                  setNewQuestion({ ...newQuestion, wrong3: t })
                }
                placeholder="Errada 3"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={handleSaveNewQuestion}
                  disabled={loading}
                >
                  <Text style={styles.confirmButtonText}>
                    {loading ? "Salvando..." : "CRIAR"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  container: { flex: 1, backgroundColor: "#f1f1f1", alignItems: "center" },
  content: { flex: 1, width: "100%", alignItems: "center" },
  logoContent: {
    flexDirection: "row",
    marginTop: 60,
    justifyContent: "center",
  },
  loginLogo: { width: 35, height: 35, marginRight: 10 },
  title: { fontFamily: "Rubik", fontSize: 25, fontWeight: "500" },
  headerBar: {
    width: "90%",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    alignItems: "center",
  },
  subtitle: { fontFamily: "Rubik", fontSize: 24, fontWeight: "500" },
  editIcon: { width: 25, height: 25 },
  scrollcontent: { width: "100%", marginTop: 10 },
  questionsContainer: { width: "90%", alignSelf: "center", marginBottom: 30 },
  emptyState: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    elevation: 3,
  },
  emptyStateText: { color: "#777", textAlign: "center" },
  questionCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingBottom: 5,
  },
  questionCategory: { color: "#24bf94", fontWeight: "bold" },
  questionNumber: { color: "#777" },
  answerText: {
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F8F8F8",
    padding: 10,
    borderRadius: 8,
  },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontWeight: "500", marginBottom: 8, color: "#333" },
  textInput: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    height: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#ccc",
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#24bf94",
    padding: 15,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: "center",
  },
  cancelButtonText: { fontWeight: "bold" },
  confirmButtonText: { color: "white", fontWeight: "bold" },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
  },
  teamOption: {
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 20,
    marginRight: 10,
    height: 40,
    justifyContent: "center",
  },
  teamOptionSelected: { backgroundColor: "#24bf94" },
  teamOptionText: { color: "#333" },
  teamOptionTextSelected: { color: "white", fontWeight: "bold" },
});