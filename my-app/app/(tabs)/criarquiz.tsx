import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  QuestionResponse,
  QuizCreate,
  TeamCreate,
  TeamResponse,
  questionService,
  quizService,
  teamService,
} from "../../services/quizApi";

interface TeamWithMembers extends TeamResponse {
  memberNames: string[];
}

export default function CreateQuiz() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  
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
  
  const router = useRouter();

  const categories = [
    { id: 1, name: "Futmesa" },
    { id: 2, name: "Futebol" },
    { id: 3, name: "Futsal" },
    { id: 4, name: "Futvôlei" },
  ];

  useFocusEffect(
    useCallback(() => {
      loadUserRole();
      loadTeams();
      loadQuestions();
    }, [])
  );

  const loadUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem("user_role");
      setUserRole(role);
    } catch (error) {
      console.error("Erro ao carregar role:", error);
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
      setLoading(true);
      console.log("🔄 Buscando questões atualizadas...");
      
      const existingQuestions = await questionService.getQuestions();
      
      if (!existingQuestions) {
          setQuestions([]);
          return;
      }

      const validQuestions = existingQuestions.map((q: any) => ({
          ...q,
          id: String(q.id || q._id || "") 
      })).filter(q => q.id !== "" && q.id !== "undefined");

      console.log(`✅ ${validQuestions.length} questões válidas carregadas.`);
      setQuestions(validQuestions);
      
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
      Alert.alert("Erro", "Falha ao carregar lista de questões.");
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestionIds);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestionIds(newSelected);
  };

  const handleCategoryPress = (categoryId: number) => {
    if (selectedCategory === categoryId) setSelectedCategory(null);
    else setSelectedCategory(categoryId);
  };

  const handleBack = () => {
    router.push("/(tabs)/quizzes");
  };

  const handleCriarPergunta = () => {
    const categoryName = selectedCategory 
        ? categories.find((cat) => cat.id === selectedCategory)?.name 
        : "Futebol";

    router.push({
      pathname: "/(tabs)/criarpergunta",
      params: { category: categoryName },
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

    try {
      setLoading(true);

      const validQuestionIds = Array.from(selectedQuestionIds);

      const quizData: QuizCreate = {
        title: newQuiz.title,
        description: newQuiz.description || undefined,
        question_ids: validQuestionIds,
      };

      await quizService.createQuiz(quizData);

      setNewQuiz({ title: "", description: "" });
      setSelectedQuestionIds(new Set());
      setQuizModalVisible(false);

      Alert.alert("Sucesso", "Quiz criado com sucesso!", [
        { text: "OK", onPress: () => router.push("/(tabs)/quizzes") },
      ]);
    } catch (error: any) {
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

      await teamService.createTeam(teamData);
      await loadTeams(); 

      setNewTeam({ name: "", country: "", members: "" });
      setModalVisible(false);

      Alert.alert("Sucesso", "Time criado com sucesso!");
    } catch (error: any) {
      Alert.alert("Erro", `Não foi possível criar o time: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = selectedCategory 
    ? questions.filter(q => q.topic === categories.find(c => c.id === selectedCategory)?.name)
    : questions;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        
        <View style={styles.logoContent}>
          <Image source={require("../../assets/images/LogoBG.png")} style={styles.loginLogo} />
          <Text style={styles.title}>FUTQUIZ</Text>
        </View>

        <View style={styles.headerBar}>
          <TouchableOpacity onPress={handleBack}>
            <Image source={require("../../assets/images/arrow-left.png")} style={styles.editIcon} />
          </TouchableOpacity>
          <Text style={styles.subtitle}>Criar quiz</Text>
          {userRole === "admin" && (
            <TouchableOpacity onPress={handleCriarPergunta}>
              <Image source={require("../../assets/images/plus-square.png")} style={styles.editIcon} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scrollcontent}>
          
          <View style={styles.categoriesSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.id && styles.categoryCardSelected,
                    ]}
                    onPress={() => handleCategoryPress(category.id)}
                  >
                    <Text style={[
                        styles.categoryTitle,
                        selectedCategory === category.id && styles.categoryTitleSelected,
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
              Selecione as questões ({selectedQuestionIds.size}):
            </Text>
            
            {loading && questions.length === 0 ? (
                <ActivityIndicator size="large" color="#24bf94" style={{marginTop: 20}} />
            ) : filteredQuestions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  {selectedCategory 
                    ? "Nenhuma questão encontrada nesta categoria." 
                    : "Nenhuma questão criada ainda.\nClique no + para criar!"}
                </Text>
              </View>
            ) : (
              filteredQuestions.map((question) => (
                  <TouchableOpacity
                    key={question.id}
                    style={[
                      styles.questionContainer,
                      selectedQuestionIds.has(question.id) && styles.questionContainerSelected,
                    ]}
                    onPress={() => toggleQuestionSelection(question.id)}
                  >
                    <View style={styles.questionCheckbox}>
                      {selectedQuestionIds.has(question.id) && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.questionContent}>
                      <Text style={styles.questionText}>{question.statement}</Text>
                      <Text style={styles.questionTopic}>{question.topic}</Text>
                    </View>
                  </TouchableOpacity>
                ))
            )}
          </View>

          {userRole === "admin" && (
            <View style={{ marginBottom: 40 }}>
              <TouchableOpacity style={styles.avancarButton} onPress={handleAvançar}>
                <Text style={styles.avancarText}>Criar Time</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.avancarButton,
                  selectedQuestionIds.size === 0 && { opacity: 0.5, backgroundColor: '#999' },
                ]}
                onPress={handleCreateQuiz}
                disabled={selectedQuestionIds.size === 0}
              >
                <Text style={styles.avancarText}>
                  Criar Quiz ({selectedQuestionIds.size})
                </Text>
              </TouchableOpacity>
            </View>
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
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>País</Text>
              <TextInput
                style={styles.textInput}
                value={newTeam.country}
                onChangeText={(text) => setNewTeam({ ...newTeam, country: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>IDs dos Membros (opcional)</Text>
              <TextInput
                style={styles.textInput}
                value={newTeam.members}
                onChangeText={(text) => setNewTeam({ ...newTeam, members: text })}
                keyboardType="numeric"
              />
              <Text style={styles.helperText}>IDs separados por vírgula</Text>
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
                <Text style={styles.confirmButtonText}>{loading ? "..." : "Criar"}</Text>
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
            <Text style={styles.modalTitle}>Finalizar Quiz</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Título do Quiz *</Text>
              <TextInput
                style={styles.textInput}
                value={newQuiz.title}
                onChangeText={(text) => setNewQuiz({ ...newQuiz, title: text })}
                placeholder="Ex: Quiz da Rodada"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Descrição (opcional)</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80, textAlignVertical: "top" }]}
                value={newQuiz.description}
                onChangeText={(text) => setNewQuiz({ ...newQuiz, description: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <Text style={styles.helperText}>
              {selectedQuestionIds.size} questões vinculadas.
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
                <Text style={styles.confirmButtonText}>{loading ? "..." : "Salvar Quiz"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f1f1", alignItems: "center" },
  content: { flex: 1, width: "100%", alignItems: "center" },
  logoContent: { flexDirection: "row", justifyContent: "center", marginTop: 60 },
  loginLogo: { width: 35, height: 35, marginRight: 10 },
  title: { fontFamily: "Rubik", fontSize: 25, fontWeight: "500" },
  headerBar: { width: "90%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 25 },
  subtitle: { fontFamily: "Rubik", fontSize: 24, fontWeight: "500" },
  editIcon: { width: 25, height: 25 },
  scrollcontent: { width: "100%", marginTop: 10 },
  categoriesSection: { width: "90%", alignSelf: "center", marginBottom: 20 },
  horizontalScroll: { width: "100%" },
  categoriesContainer: { flexDirection: "row", paddingRight: 20 },
  categoryCard: { width: 120, height: 45, alignItems: "center", justifyContent: "center", backgroundColor: "#a6a6a6", borderRadius: 12, marginRight: 10 },
  categoryCardSelected: { backgroundColor: "#24bf94" },
  categoryTitle: { fontFamily: "Rubik", fontSize: 14, fontWeight: "500", color: "#000" },
  categoryTitleSelected: { color: "#FFF" },
  questionsSection: { width: "90%", alignSelf: "center", marginBottom: 30 },
  sectionTitle: { fontFamily: "Rubik", fontSize: 18, fontWeight: "500", marginBottom: 15, color: "#333" },
  questionContainer: { flexDirection: "row", backgroundColor: "#FFF", borderRadius: 12, padding: 15, marginBottom: 10, alignItems: "center", borderWidth: 2, borderColor: "#E5E5E5" },
  questionContainerSelected: { borderColor: "#24bf94", backgroundColor: "#F0FDF9" },
  questionCheckbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#24bf94", backgroundColor: "#FFF", marginRight: 12, alignItems: "center", justifyContent: "center" },
  checkmark: { color: "#24bf94", fontSize: 16, fontWeight: "bold" },
  questionContent: { flex: 1 },
  questionText: { fontFamily: "Rubik", fontSize: 16, fontWeight: "500", marginBottom: 5, color: "#333" },
  questionTopic: { fontFamily: "Rubik", fontSize: 14, color: "#777" },
  emptyState: { backgroundColor: "#FFF", borderRadius: 12, padding: 40, alignItems: "center", marginBottom: 20, elevation: 3 },
  emptyStateText: { fontFamily: "Rubik", fontSize: 16, color: "#777", textAlign: "center", lineHeight: 24 },
  avancarButton: { width: "90%", alignSelf: "center", backgroundColor: "#24bf94", borderRadius: 12, padding: 15, alignItems: "center", marginBottom: 15 },
  avancarText: { fontFamily: "Rubik", fontSize: 18, fontWeight: "500", color: "#FFF" },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.5)" },
  modalContent: { width: "85%", backgroundColor: "white", borderRadius: 12, padding: 25, elevation: 5 },
  modalTitle: { fontFamily: "Rubik", fontSize: 20, fontWeight: "500", marginBottom: 20, textAlign: "center" },
  inputContainer: { marginBottom: 15 },
  inputLabel: { fontFamily: "Rubik", fontSize: 14, fontWeight: "500", marginBottom: 8, color: "#333" },
  textInput: { backgroundColor: "#F8F8F8", borderWidth: 1, borderColor: "#E5E5E5", borderRadius: 8, padding: 12, fontFamily: "Rubik", fontSize: 16 },
  helperText: { fontFamily: "Rubik", fontSize: 12, color: "#777", marginTop: 4, marginBottom: 10, textAlign: 'center' },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  cancelButton: { backgroundColor: "#ccc", borderRadius: 8, padding: 12, alignItems: "center", flex: 1, marginRight: 10 },
  cancelButtonText: { fontFamily: "Rubik", fontSize: 16, color: "#333", fontWeight: "500" },
  confirmButton: { backgroundColor: "#24bf94", borderRadius: 8, padding: 12, alignItems: "center", flex: 1, marginLeft: 10 },
  confirmButtonText: { fontFamily: "Rubik", fontSize: 16, color: "#FFF", fontWeight: "500" },
});