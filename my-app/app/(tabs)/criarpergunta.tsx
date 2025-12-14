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
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  questionService,
  QuestionCreate,
  QuestionResponse,
  answerService,
} from "../../services/quizApi";

interface QuestionWithAnswer extends QuestionResponse {
  correctAnswer: string;
}

export default function CreateQuestions() {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
  });
  const [answerOptions, setAnswerOptions] = useState<string[]>([]);
  const [currentAnswerInput, setCurrentAnswerInput] = useState("");
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedCategory = (params.category as string) || "Futebol";

  useEffect(() => {
    loadUserRole();
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

  const loadQuestions = async () => {
    try {
      setLoading(true);
      console.log("Buscando perguntas...");
      const existingQuestions = await questionService.getQuestions();
      console.log("Perguntas recebidas da API:", existingQuestions);
      console.log("Total de perguntas:", existingQuestions.length);

      // Log detalhado
      existingQuestions.forEach((q, idx) => {
        console.log(`Pergunta ${idx}:`, {
          id: q.id,
          statement: q.statement?.substring(0, 50),
          hasId: !!q.id,
          idType: typeof q.id,
        });
      });

      const questionsWithAnswers = await Promise.all(
        existingQuestions
          .filter((q) => q.id) // Filtrar apenas questões com ID válido
          .map(async (question) => {
            try {
              const answers = await answerService.getAnswersByQuestion(
                question.id
              );
              const correctAnswer =
                answers.find((answer) => answer.correct)?.text || "";
              return {
                ...question,
                correctAnswer,
              } as QuestionWithAnswer;
            } catch (error) {
              console.error(
                `Erro ao carregar respostas da pergunta ${question.id}:`,
                error
              );
              return {
                ...question,
                correctAnswer: "",
              } as QuestionWithAnswer;
            }
          })
      );

      console.log(
        "Perguntas com respostas carregadas:",
        questionsWithAnswers.length
      );
      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error("Erro ao carregar perguntas:", error);
      Alert.alert("Erro", "Não foi possível carregar as perguntas existentes");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddQuestion = () => {
    setModalVisible(true);
    // Resetar estados ao abrir modal
    setNewQuestion({ question: "" });
    setAnswerOptions([]);
    setCurrentAnswerInput("");
    setCorrectAnswerIndex(null);
  };

  const handleAddAnswerOption = () => {
    if (currentAnswerInput.trim() === "") {
      Alert.alert("Atenção", "Digite uma opção de resposta!");
      return;
    }
    setAnswerOptions([...answerOptions, currentAnswerInput.trim()]);
    setCurrentAnswerInput("");
  };

  const handleRemoveAnswerOption = (index: number) => {
    const newOptions = answerOptions.filter((_, i) => i !== index);
    setAnswerOptions(newOptions);
    // Ajustar índice da resposta correta se necessário
    if (correctAnswerIndex === index) {
      setCorrectAnswerIndex(null);
    } else if (correctAnswerIndex !== null && correctAnswerIndex > index) {
      setCorrectAnswerIndex(correctAnswerIndex - 1);
    }
  };

  const handleSaveNewQuestion = async () => {
    if (newQuestion.question.trim() === "") {
      Alert.alert("Atenção", "Preencha a pergunta!");
      return;
    }

    if (answerOptions.length < 2) {
      Alert.alert("Atenção", "Adicione pelo menos 2 opções de resposta!");
      return;
    }

    if (correctAnswerIndex === null) {
      Alert.alert("Atenção", "Marque qual é a resposta correta!");
      return;
    }

    try {
      setLoading(true);

      const questionData: QuestionCreate = {
        statement: newQuestion.question,
        topic: selectedCategory,
        difficulty: "medium",
        options: answerOptions,
        correct_option_index: correctAnswerIndex,
      };

      console.log("Criando pergunta...", questionData);
      await questionService.createQuestion(questionData);
      console.log("Pergunta criada com sucesso!");

      await loadQuestions();
      setNewQuestion({ question: "" });
      setAnswerOptions([]);
      setCurrentAnswerInput("");
      setCorrectAnswerIndex(null);
      setModalVisible(false);

      Alert.alert("Sucesso", "Pergunta criada com sucesso!");
    } catch (error: any) {
      console.error("Erro:", error);
      Alert.alert("Erro", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = () => {
    Alert.alert("Sucesso", "Todas as perguntas foram salvas!");
    router.back();
  };

  const updateQuestion = async (id: string, field: string, value: string) => {
    try {
      if (field === "statement") {
        await questionService.updateQuestion(id, { statement: value });

        setQuestions((prev) =>
          prev.map((q) => (q.id === id ? { ...q, statement: value } : q))
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar pergunta:", error);
      Alert.alert("Erro", "Não foi possível atualizar a pergunta");
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
          <Text style={styles.subtitle}>Criar perguntas</Text>
          {userRole === "admin" && (
            <TouchableOpacity onPress={handleAddQuestion} disabled={loading}>
              <Image
                source={require("../../assets/images/plus-square.png")}
                style={[styles.editIcon, loading && { opacity: 0.5 }]}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scrollcontent}>
          <View style={styles.questionsContainer}>
            {loading && questions.length === 0 ? (
              <View key="loading-state" style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Carregando perguntas...
                </Text>
              </View>
            ) : questions.length === 0 ? (
              <View key="empty-state" style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Nenhuma pergunta criada ainda.{"\n"}
                  Clique no + para adicionar a primeira pergunta!
                </Text>
              </View>
            ) : (
              questions.map((item, index) => (
                <View key={item.id} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionCategory}>{item.topic}</Text>
                    <Text style={styles.questionNumber}>
                      Pergunta {index + 1}
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Pergunta</Text>
                    <TextInput
                      style={styles.textInput}
                      value={item.statement}
                      onChangeText={(text) =>
                        updateQuestion(item.id, "statement", text)
                      }
                      placeholder="Digite a pergunta..."
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={styles.correctAnswerHeader}>
                      <Text style={styles.inputLabel}>Resposta Correta</Text>
                      <View style={styles.correctBadge}>
                        <Text style={styles.correctBadgeText}>✓ CORRETA</Text>
                      </View>
                    </View>
                    <View style={styles.correctAnswerContainer}>
                      <Text style={styles.answerText}>
                        {item.correctAnswer ||
                          "Nenhuma resposta correta definida"}
                      </Text>
                    </View>
                    <Text style={styles.helperText}>
                      Nota: Apenas uma resposta pode ser marcada como correta
                      por questão.
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {questions.length > 0 && userRole === "admin" && (
            <TouchableOpacity
              style={[styles.saveButton, loading && { opacity: 0.5 }]}
              onPress={handleSaveAll}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Salvando..." : "Salvar Todas"}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          if (!loading) {
            Keyboard.dismiss();
            setModalVisible(false);
          }
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            if (!loading) {
              setModalVisible(false);
            }
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.keyboardAvoidingView}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Nova Pergunta - {selectedCategory}
                </Text>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Pergunta</Text>
                  <TextInput
                    style={styles.textInput}
                    value={newQuestion.question}
                    onChangeText={(text) =>
                      setNewQuestion({ ...newQuestion, question: text })
                    }
                    placeholder="Digite a pergunta..."
                    multiline
                    editable={!loading}
                    blurOnSubmit={false}
                    onSubmitEditing={() => Keyboard.dismiss()}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Opções de Resposta</Text>
                  <View style={styles.answerOptionsContainer}>
                    {answerOptions.map((option, index) => (
                      <View
                        key={`option-${index}-${option}`}
                        style={styles.answerOptionRow}
                      >
                        <TouchableOpacity
                          style={styles.radioButton}
                          onPress={() => setCorrectAnswerIndex(index)}
                          disabled={loading}
                        >
                          {correctAnswerIndex === index && (
                            <View style={styles.radioButtonSelected} />
                          )}
                        </TouchableOpacity>
                        <Text style={styles.answerOptionText}>{option}</Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveAnswerOption(index)}
                          disabled={loading}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>

                  <View style={styles.addAnswerContainer}>
                    <TextInput
                      style={[styles.textInput, { flex: 1, marginRight: 10 }]}
                      value={currentAnswerInput}
                      onChangeText={setCurrentAnswerInput}
                      placeholder="Digite uma opção de resposta..."
                      editable={!loading}
                      onSubmitEditing={handleAddAnswerOption}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={[
                        styles.addAnswerButton,
                        loading && { opacity: 0.5 },
                      ]}
                      onPress={handleAddAnswerOption}
                      disabled={loading}
                    >
                      <Text style={styles.addAnswerButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>
                    Adicione pelo menos 2 opções e marque a correta (bolinha)
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.cancelButton, loading && { opacity: 0.5 }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setModalVisible(false);
                    }}
                    disabled={loading}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, loading && { opacity: 0.5 }]}
                    onPress={handleSaveNewQuestion}
                    disabled={loading}
                  >
                    <Text style={styles.confirmButtonText}>
                      {loading ? "Criando..." : "Criar"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
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

  questionsContainer: {
    width: "90%",
    alignSelf: "center",
    marginBottom: 30,
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

  questionCard: {
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

  questionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  questionCategory: {
    fontFamily: "Rubik",
    fontSize: 16,
    fontWeight: "500",
    color: "#24bf94",
  },

  questionNumber: {
    fontFamily: "Rubik",
    fontSize: 14,
    color: "#777",
  },

  answerText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#333",
  },
  correctAnswerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  correctBadge: {
    backgroundColor: "#24bf94",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  correctBadgeText: {
    fontFamily: "Rubik",
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
  },
  correctAnswerContainer: {
    backgroundColor: "#F0FDF9",
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#24bf94",
    padding: 12,
    marginBottom: 8,
  },
  helperText: {
    fontFamily: "Rubik",
    fontSize: 12,
    color: "#777",
    fontStyle: "italic",
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

  saveButton: {
    width: "40%",
    alignSelf: "center",
    backgroundColor: "#24bf94",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 30,
  },

  saveButtonText: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    color: "#FFF",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardAvoidingView: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
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
  answerOptionsContainer: {
    marginBottom: 10,
  },
  answerOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#24bf94",
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#24bf94",
  },
  answerOptionText: {
    flex: 1,
    fontFamily: "Rubik",
    fontSize: 14,
    color: "#333",
  },
  removeButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  removeButtonText: {
    fontFamily: "Rubik",
    fontSize: 20,
    color: "#ff4444",
    fontWeight: "bold",
  },
  addAnswerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  addAnswerButton: {
    width: 40,
    height: 40,
    backgroundColor: "#24bf94",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  addAnswerButtonText: {
    fontFamily: "Rubik",
    fontSize: 24,
    color: "#FFF",
    fontWeight: "bold",
  },
});
