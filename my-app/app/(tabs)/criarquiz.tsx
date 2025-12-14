import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  teamService,
  TeamCreate,
  TeamResponse,
  questionService,
  QuestionResponse,
  quizService,
  QuizCreate,
} from "../../services/quizApi";

interface TeamWithMembers extends TeamResponse {
  memberNames: string[];
}

export default function CreateQuiz() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(
    new Set()
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    country: "",
    members: "",
  });
  const [newQuiz, setNewQuiz] = useState({
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const params = useLocalSearchParams();

  const categories = [
    { id: 1, name: "Futmesa" },
    { id: 2, name: "Futebol" },
    { id: 3, name: "Futsal" },
    { id: 4, name: "Futvôlei" },
  ];

  useEffect(() => {
    loadUserRole();
    loadTeams();
    loadQuestions();
  }, []);

  const loadUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("user_role");
      setUserRole(role);
    } catch (error) {
      console.error("Erro ao carregar role do usuário:", error);
    }
  };

  const loadTeams = async () => {
    try {
      const existingTeams = await teamService.getTeams();
      const teamsWithMemberNames = existingTeams.map((team) => ({
        ...team,
        memberNames: team.members.map((member) => `Usuário ${member}`),
      }));
      setTeams(teamsWithMemberNames);
    } catch (error) {
      console.error("Erro ao carregar times:", error);
    }
  };

  const loadQuestions = async () => {
    try {
      console.log("Buscando questões...");
      const existingQuestions = await questionService.getQuestions();
      console.log("Questões recebidas da API:", existingQuestions);
      console.log("Total de questões recebidas:", existingQuestions.length);

      // Log detalhado de cada questão
      existingQuestions.forEach((q, idx) => {
        console.log(`Questão ${idx}:`, {
          id: q.id,
          statement: q.statement?.substring(0, 50),
          hasId: !!q.id,
          idType: typeof q.id,
        });
      });

      // Garantir que todas as questões têm ID válido
      const validQuestions = existingQuestions.filter((q) => {
        const hasValidId =
          q.id && q.id !== "undefined" && q.id !== undefined && q.id !== "";
        if (!hasValidId) {
          console.warn("Questão sem ID válido:", q);
        }
        return hasValidId;
      });

      console.log("Questões válidas após filtro:", validQuestions.length);
      setQuestions(validQuestions);
      // Resetar seleção ao carregar novas questões
      setSelectedQuestionIds(new Set());
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    if (!questionId || questionId === "undefined") {
      console.warn("Tentando selecionar questão sem ID válido:", questionId);
      return;
    }
    const newSelected = new Set(selectedQuestionIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
      console.log("Questão desmarcada:", questionId);
    } else {
      newSelected.add(questionId);
      console.log("Questão marcada:", questionId);
    }
    console.log("Total selecionado:", newSelected.size);
    setSelectedQuestionIds(newSelected);
  };

  const handleCategoryPress = (categoryId: number) => {
    setSelectedCategory(categoryId);
  };

  const router = useRouter();

  const handleBack = () => {
    router.push("/(tabs)/quizzes");
  };

  const handleCriarPergunta = () => {
    if (!selectedCategory) {
      alert("Selecione uma categoria primeiro!");
      return;
    }

    const selectedCategoryName =
      categories.find((cat) => cat.id === selectedCategory)?.name || "Futebol";

    router.push({
      pathname: "/(tabs)/criarpergunta",
      params: {
        category: selectedCategoryName,
        categoryId: selectedCategory.toString(),
      },
    });
  };

  const handleAvançar = () => {
    setModalVisible(true);
  };

  const handleCreateQuiz = () => {
    if (selectedQuestionIds.size === 0) {
      Alert.alert("Atenção", "Selecione pelo menos uma questão para o quiz!");
      return;
    }
    setQuizModalVisible(true);
  };

  const handleSaveQuiz = async () => {
    if (newQuiz.title.trim() === "") {
      Alert.alert("Atenção", "Preencha o título do quiz!");
      return;
    }

    if (selectedQuestionIds.size === 0) {
      Alert.alert("Atenção", "Selecione pelo menos uma questão!");
      return;
    }

    try {
      setLoading(true);

      // Filtrar IDs válidos
      const validQuestionIds = Array.from(selectedQuestionIds).filter(
        (id) => id && id !== "undefined" && id !== undefined
      );

      if (validQuestionIds.length === 0) {
        Alert.alert("Atenção", "Selecione pelo menos uma questão válida!");
        return;
      }

      const quizData: QuizCreate = {
        title: newQuiz.title,
        description: newQuiz.description || undefined,
        question_ids: validQuestionIds,
      };

      console.log("Criando quiz:", quizData);
      await quizService.createQuiz(quizData);

      setNewQuiz({ title: "", description: "" });
      setSelectedQuestionIds(new Set());
      setQuizModalVisible(false);

      Alert.alert("Sucesso", "Quiz criado com sucesso!", [
        { text: "OK", onPress: () => router.push("/(tabs)/quizzes") },
      ]);
    } catch (error: any) {
      console.error("Erro ao criar quiz:", error);
      Alert.alert("Erro", `Não foi possível criar o quiz: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (newTeam.name.trim() === "" || newTeam.country.trim() === "") {
      Alert.alert("Atenção", "Preencha o nome e país do time!");
      return;
    }

    try {
      setLoading(true);

      const membersArray = newTeam.members
        .split(",")
        .map((member) => member.trim())
        .filter((member) => member !== "")
        .map((member) => parseInt(member) || 0);

      const teamData: TeamCreate = {
        name: newTeam.name,
        country: newTeam.country,
        members: membersArray,
      };

      console.log("Criando time:", teamData);
      await teamService.createTeam(teamData);

      await loadTeams();

      setNewTeam({ name: "", country: "", members: "" });
      setModalVisible(false);

      Alert.alert("Sucesso", "Time criado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao criar time:", error);
      Alert.alert("Erro", `Não foi possível criar o time: ${error.message}`);
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
          <TouchableOpacity onPress={handleBack}>
            <Image
              source={require("../../assets/images/arrow-left.png")}
              style={styles.editIcon}
            />
          </TouchableOpacity>
          <Text style={styles.subtitle}>Criar quiz</Text>
          {userRole === "admin" && (
            <TouchableOpacity onPress={handleCriarPergunta}>
              <Image
                source={require("../../assets/images/plus-square.png")}
                style={styles.editIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scrollcontent}>
          <View style={styles.categoriesSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
            >
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.id &&
                        styles.categoryCardSelected,
                    ]}
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <Text
                      style={[
                        styles.categoryTitle,
                        selectedCategory === category.id &&
                          styles.categoryTitleSelected,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.questionsSection}>
            <Text style={styles.sectionTitle}>
              Selecione as questões para o quiz:
            </Text>
            {questions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Nenhuma questão criada ainda.{"\n"}
                  Crie questões primeiro antes de criar um quiz!
                </Text>
              </View>
            ) : (
              questions
                .filter((question) => question.id) // Filtrar questões sem ID válido
                .map((question) => (
                  <TouchableOpacity
                    key={question.id}
                    style={[
                      styles.questionContainer,
                      selectedQuestionIds.has(question.id) &&
                        styles.questionContainerSelected,
                    ]}
                    onPress={() => toggleQuestionSelection(question.id)}
                  >
                    <View style={styles.questionCheckbox}>
                      {selectedQuestionIds.has(question.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.questionContent}>
                      <Text style={styles.questionText}>
                        {question.statement}
                      </Text>
                      <Text style={styles.questionTopic}>{question.topic}</Text>
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </View>

          {userRole === "admin" && (
            <>
              <TouchableOpacity
                style={styles.avancarButton}
                onPress={handleAvançar}
              >
                <Text style={styles.avancarText}>Criar Time</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.avancarButton,
                  selectedQuestionIds.size === 0 && { opacity: 0.5 },
                ]}
                onPress={handleCreateQuiz}
                disabled={selectedQuestionIds.size === 0}
              >
                <Text style={styles.avancarText}>
                  Criar Quiz ({selectedQuestionIds.size} questões selecionadas)
                </Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => !loading && setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Novo Time</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nome do Time</Text>
              <TextInput
                style={styles.textInput}
                value={newTeam.name}
                onChangeText={(text) => setNewTeam({ ...newTeam, name: text })}
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>País</Text>
              <TextInput
                style={styles.textInput}
                value={newTeam.country}
                onChangeText={(text) =>
                  setNewTeam({ ...newTeam, country: text })
                }
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>IDs dos Membros (opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={newTeam.members}
                onChangeText={(text) =>
                  setNewTeam({ ...newTeam, members: text })
                }
                editable={!loading}
              />
              <Text style={styles.helperText}>
                IDs numéricos dos usuários, separados por vírgula
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, loading && { opacity: 0.5 }]}
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && { opacity: 0.5 }]}
                onPress={handleCreateTeam}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? "Criando..." : "Criar Time"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={quizModalVisible}
        onRequestClose={() => !loading && setQuizModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Criar Novo Quiz</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título do Quiz *</Text>
              <TextInput
                style={styles.textInput}
                value={newQuiz.title}
                onChangeText={(text) => setNewQuiz({ ...newQuiz, title: text })}
                placeholder="Ex: Quiz Brasileirão 2011"
                editable={!loading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descrição (opcional)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { minHeight: 80, textAlignVertical: "top" },
                ]}
                value={newQuiz.description}
                onChangeText={(text) =>
                  setNewQuiz({ ...newQuiz, description: text })
                }
                placeholder="Descreva o quiz..."
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            <Text style={styles.helperText}>
              {selectedQuestionIds.size} questão(ões) selecionada(s)
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, loading && { opacity: 0.5 }]}
                onPress={() => setQuizModalVisible(false)}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, loading && { opacity: 0.5 }]}
                onPress={handleSaveQuiz}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? "Criando..." : "Criar Quiz"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontWeight: 500,
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
    fontWeight: 500,
  },
  editIcon: {
    width: 25,
    height: 25,
  },
  scrollcontent: {
    width: "100%",
    marginTop: 10,
  },
  categoriesSection: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 30,
  },
  horizontalScroll: {
    width: "100%",
  },
  categoriesContainer: {
    flexDirection: "row",
    paddingRight: 20,
  },
  categoryCard: {
    width: 127,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#a6a6a6",
    borderRadius: 12,
    padding: 15,
    marginRight: 15,
  },
  categoryCardSelected: {
    backgroundColor: "#24bf94",
  },
  categoryTitle: {
    fontFamily: "Rubik",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#000",
  },
  categoryTitleSelected: {
    color: "#FFF",
  },
  teamsSection: {
    width: "90%",
    alignSelf: "center",
    flexDirection: "column",
    gap: 18,
    justifyContent: "space-between",
    marginBottom: 30,
  },
  questionsSection: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 15,
    color: "#333",
  },
  questionContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E5E5",
  },
  questionContainerSelected: {
    borderColor: "#24bf94",
    backgroundColor: "#F0FDF9",
  },
  questionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#24bf94",
    backgroundColor: "#FFF",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: "#24bf94",
    fontSize: 16,
    fontWeight: "bold",
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontFamily: "Rubik",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
    color: "#333",
  },
  questionTopic: {
    fontFamily: "Rubik",
    fontSize: 14,
    color: "#777",
  },
  teamContainer: {
    width: "100%",
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
  teamTitle: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "black",
    paddingBottom: 5,
  },
  teamMembers: {
    fontFamily: "Rubik",
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },
  teamId: {
    fontFamily: "Rubik",
    fontSize: 12,
    color: "#999",
  },
  emptyState: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
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
  emptyStateText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#777",
    textAlign: "center",
    lineHeight: 24,
  },
  avancarButton: {
    width: "40%",
    alignSelf: "center",
    backgroundColor: "#24bf94",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 30,
  },
  avancarText: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    color: "#FFF",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: "Rubik",
    fontSize: 20,
    fontWeight: "500",
    marginBottom: 20,
    textAlign: "center",
  },
  inputContainer: {
    marginBottom: 15,
  },
  inputLabel: {
    fontFamily: "Rubik",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
    color: "#333",
  },
  textInput: {
    backgroundColor: "#F8F8F8",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    padding: 12,
    fontFamily: "Rubik",
    fontSize: 16,
  },
  helperText: {
    fontFamily: "Rubik",
    fontSize: 12,
    color: "#777",
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cancelButton: {
    backgroundColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#24bf94",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  confirmButtonText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#FFF",
    fontWeight: "500",
  },
});
