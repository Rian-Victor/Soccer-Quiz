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
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  questionService,
  QuestionCreate,
  QuestionResponse,
  answerService,
  AnswerCreate,
} from "../../services/quizApi";

interface QuestionWithAnswer extends QuestionResponse {
  correctAnswer: string;
}

export default function CreateQuestions() {
  const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    correctAnswer: "",
    wrong1: "",
    wrong2: "",
    wrong3: ""
  });
  
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectedCategory = (params.category as string) || "Futebol";

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const existingQuestions = await questionService.getQuestions();

      const questionsWithAnswers = await Promise.all(
        existingQuestions.map(async (question) => {
          try {
            const answers = await answerService.getAnswersByQuestion(question.id);
            const correctAnswer = answers.find((answer) => answer.correct)?.text || "";
            return {
              ...question,
              correctAnswer,
            } as QuestionWithAnswer;
          } catch (error) {
            console.error(`Erro ao carregar respostas:`, error);
            return { ...question, correctAnswer: "" } as QuestionWithAnswer;
          }
        })
      );

      setQuestions(questionsWithAnswers);
    } catch (error) {
      console.error("Erro ao carregar perguntas:", error);
      Alert.alert("Erro", "Não foi possível carregar as perguntas");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddQuestion = () => {
    setModalVisible(true);
  };

  const handleSaveNewQuestion = async () => {
    if (
      !newQuestion.question.trim() ||
      !newQuestion.correctAnswer.trim() ||
      !newQuestion.wrong1.trim() ||
      !newQuestion.wrong2.trim() ||
      !newQuestion.wrong3.trim()
    ) {
      Alert.alert("Atenção", "Preencha a pergunta e TODAS as 4 opções de resposta!");
      return;
    }

    try {
      setLoading(true);

      const questionData: QuestionCreate = {
        statement: newQuestion.question,
        topic: selectedCategory,
        difficulty: "medium",
      };

      console.log("Criando pergunta...");
      const createdQuestion = await questionService.createQuestion(questionData);
      
      const answersToCreate = [
        { text: newQuestion.correctAnswer, correct: true },   
        { text: newQuestion.wrong1, correct: false },         
        { text: newQuestion.wrong2, correct: false },         
        { text: newQuestion.wrong3, correct: false },         
      ];

      console.log("Enviando respostas...");
      await Promise.all(
        answersToCreate.map(ans => 
            answerService.createAnswer({
                questionId: createdQuestion.id,
                text: ans.text,
                correct: ans.correct
            })
        )
      );

      console.log("Tudo criado com sucesso!");

      await loadQuestions();
      
      setNewQuestion({ 
          question: "", 
          correctAnswer: "", 
          wrong1: "", 
          wrong2: "", 
          wrong3: "" 
      });
      setModalVisible(false);

      Alert.alert("Sucesso", "Pergunta e 4 respostas criadas!");
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
      console.error("Erro ao atualizar:", error);
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
          <TouchableOpacity onPress={handleAddQuestion} disabled={loading}>
            <Image
              source={require("../../assets/images/plus-square.png")}
              style={[styles.editIcon, loading && { opacity: 0.5 }]}
            />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollcontent}>
          <View style={styles.questionsContainer}>
            {loading && questions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Carregando...</Text>
              </View>
            ) : questions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Clique no + para criar sua primeira pergunta!
                </Text>
              </View>
            ) : (
              questions.map((item, index) => (
                <View key={item.id} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionCategory}>{item.topic}</Text>
                    <Text style={styles.questionNumber}>Pergunta {index + 1}</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Pergunta</Text>
                    <TextInput
                      style={styles.textInput}
                      value={item.statement}
                      onChangeText={(text) => updateQuestion(item.id, "statement", text)}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Resposta Correta</Text>
                    <Text style={styles.answerText}>{item.correctAnswer || "(Sem resposta certa)"}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => !loading && setModalVisible(false)}
      >
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>Nova Pergunta</Text>

                <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Pergunta</Text>
                <TextInput
                    style={styles.textInput}
                    value={newQuestion.question}
                    onChangeText={(text) => setNewQuestion({ ...newQuestion, question: text })}
                    placeholder="Ex: Quem ganhou a copa de 2002?"
                    multiline
                />
                </View>

                <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, {color: '#24bf94'}]}>Resposta CERTA (Verde)</Text>
                <TextInput
                    style={[styles.textInput, {borderColor: '#24bf94', borderWidth: 2}]}
                    value={newQuestion.correctAnswer}
                    onChangeText={(text) => setNewQuestion({ ...newQuestion, correctAnswer: text })}
                    placeholder="Ex: Brasil"
                />
                </View>

                <Text style={[styles.inputLabel, {marginTop: 10, marginBottom: 5}]}>Respostas ERRADAS</Text>
                
                <TextInput
                    style={[styles.textInput, {marginBottom: 10}]}
                    value={newQuestion.wrong1}
                    onChangeText={(text) => setNewQuestion({ ...newQuestion, wrong1: text })}
                    placeholder="Opção Errada 1 (Ex: Argentina)"
                />
                <TextInput
                    style={[styles.textInput, {marginBottom: 10}]}
                    value={newQuestion.wrong2}
                    onChangeText={(text) => setNewQuestion({ ...newQuestion, wrong2: text })}
                    placeholder="Opção Errada 2 (Ex: Alemanha)"
                />
                <TextInput
                    style={[styles.textInput, {marginBottom: 20}]}
                    value={newQuestion.wrong3}
                    onChangeText={(text) => setNewQuestion({ ...newQuestion, wrong3: text })}
                    placeholder="Opção Errada 3 (Ex: França)"
                />

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
                    onPress={handleSaveNewQuestion}
                    disabled={loading}
                >
                    <Text style={styles.confirmButtonText}>
                    {loading ? "Salvando..." : "Salvar"}
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
    elevation: 3,
  },
  emptyStateText: {
    fontFamily: "Rubik",
    fontSize: 16,
    color: "#777",
    textAlign: "center",
  },
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
    padding: 12,
    backgroundColor: "#F8F8F8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
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
  
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
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
    marginTop: 20,
    marginBottom: 20
  },
  cancelButton: {
    backgroundColor: "#ccc",
    borderRadius: 8,
    padding: 15,
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
    padding: 15,
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