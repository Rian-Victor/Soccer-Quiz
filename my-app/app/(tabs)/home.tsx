import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  quizService,
  QuizResponse,
  gameplayService,
} from "../../services/quizApi";
import { Feather } from "@expo/vector-icons";
import { TextInput } from "react-native";

let hasSeenNotificationThisSession = false;

export default function Home() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNotification, setShowNotification] = useState(false);
  const [newQuizData, setNewQuizData] = useState<QuizResponse | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchQuizzes();
    }, [])
  );

  const fetchQuizzes = async () => {
    try {
      if (quizzes.length === 0) setLoading(true);

      const data = await quizService.getQuizzes();

      const sortedData = data.sort((a: any, b: any) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setQuizzes(sortedData);

      if (sortedData && sortedData.length > 0) {
        const latestQuiz = sortedData[0];

        if (!hasSeenNotificationThisSession) {
          setNewQuizData(latestQuiz);
          setShowNotification(true);

          hasSeenNotificationThisSession = true;
        }
      }
    } catch (error) {
      console.log("Erro ao buscar quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  const handlePlayNewQuiz = () => {
    if (newQuizData) {
      setShowNotification(false);
      router.push({
        pathname: "/game",
        params: { quizId: newQuizData.id },
      } as any);
    }
  };

  const handleJogarGeral = () => {
    router.push({
      pathname: "/game",
      params: { mode: "general" },
    } as any);
  };

  const handleJogarQuiz = (quizId: string, quizTitle: string) => {
    Alert.alert("Iniciar Quiz", `Deseja jogar o "${quizTitle}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "JOGAR",
        onPress: () => {
          router.push({
            pathname: "/game",
            params: { quizId: quizId },
          } as any);
        },
      },
    ]);
  };

  const handleInviteFriend = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert("Atenção", "Por favor, insira um email válido.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert("Atenção", "Por favor, insira um email válido.");
      return;
    }

    try {
      setInviting(true);
      await gameplayService.inviteFriend(inviteEmail.trim());
      Alert.alert("Sucesso", `Convite enviado para ${inviteEmail.trim()}!`);
      setInviteEmail("");
      setShowInviteModal(false);
    } catch (error: any) {
      Alert.alert(
        "Erro",
        error.message || "Não foi possível enviar o convite."
      );
    } finally {
      setInviting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showNotification}
        onRequestClose={handleCloseNotification}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Feather name="bell" size={30} color="#FFF" />
            </View>

            <Text style={styles.modalTitle}>Novo Desafio!</Text>
            <Text style={styles.modalSubtitle}>
              O quiz{" "}
              <Text style={{ fontWeight: "bold" }}>"{newQuizData?.title}"</Text>{" "}
              acabou de sair. Aceita o desafio?
            </Text>

            <TouchableOpacity
              style={styles.modalButtonPlay}
              onPress={handlePlayNewQuiz}
            >
              <Text style={styles.modalButtonPlayText}>JOGAR AGORA</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonClose}
              onPress={handleCloseNotification}
            >
              <Text style={styles.modalButtonCloseText}>Ver depois</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showInviteModal}
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Feather name="user-plus" size={30} color="#FFF" />
            </View>

            <Text style={styles.modalTitle}>Convidar Amigo</Text>
            <Text style={styles.modalSubtitle}>
              Envie um convite para um amigo participar do FutQuiz!
            </Text>

            <TextInput
              style={styles.emailInput}
              placeholder="Email do amigo"
              placeholderTextColor="#999"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={[styles.modalButtonPlay, inviting && { opacity: 0.6 }]}
              onPress={handleInviteFriend}
              disabled={inviting}
            >
              {inviting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.modalButtonPlayText}>ENVIAR CONVITE</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButtonClose}
              onPress={() => {
                setShowInviteModal(false);
                setInviteEmail("");
              }}
            >
              <Text style={styles.modalButtonCloseText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        <View style={styles.logoContent}>
          <Image
            source={require("../../assets/images/LogoBG.png")}
            style={styles.loginLogo}
          />
          <Text style={styles.title}>FUTQUIZ</Text>
          <TouchableOpacity
            onPress={() => setShowInviteModal(true)}
            style={styles.inviteButton}
          >
            <Feather name="user-plus" size={20} color="#24bf94" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollcontent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.quizContent}>
            <TouchableOpacity
              onPress={handleJogarGeral}
              activeOpacity={0.9}
              style={styles.mainCard}
            >
              <View
                style={[styles.imgMainQuiz, { backgroundColor: "#24bf94" }]}
              >
                <Image
                  source={require("../../assets/images/LogoBG.png")}
                  style={{ width: 60, height: 60, opacity: 0.8 }}
                />
              </View>
              <View style={styles.mainCardText}>
                <Text style={styles.titleMainQuiz}>
                  Quiz Geral: Teste seus conhecimentos gerais sobre futebol!
                </Text>
                <Text style={{ color: "#666" }}>Desafio Diário</Text>
              </View>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator color="#24bf94" style={{ marginTop: 20 }} />
            ) : quizzes.length === 0 ? (
              <Text
                style={{ color: "#999", fontStyle: "italic", marginTop: 10 }}
              >
                Nenhum quiz criado ainda.
              </Text>
            ) : (
              quizzes.map((quiz, index) => (
                <TouchableOpacity
                  key={`quiz-${quiz.id || index}-${index}`}
                  style={styles.secondaryQuizzes}
                  onPress={() => handleJogarQuiz(quiz.id, quiz.title)}
                >
                  <View style={styles.imgSecondaryQuiz}>
                    <Text style={styles.teamInitial}>
                      {quiz.title
                        ? quiz.title.substring(0, 1).toUpperCase()
                        : "?"}
                    </Text>
                  </View>
                  <View style={styles.contentSecondaryQuiz}>
                    <Text style={styles.titleSecondaryQuiz}>{quiz.title}</Text>
                    <Text
                      style={{ color: "#a8a4a4ff", fontSize: 14 }}
                      numberOfLines={1}
                    >
                      {quiz.description || "Sem descrição"}
                    </Text>
                    {quiz.team_id && (
                      <Text
                        style={{ color: "#24bf94", fontSize: 12, marginTop: 4 }}
                      >
                        Quiz do Time
                      </Text>
                    )}
                    <Text style={{ color: "#999", fontSize: 12, marginTop: 2 }}>
                      {quiz.question_ids?.length || 0} questão(ões)
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
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
    alignItems: "center",
  },
  logoContent: {
    height: 60,
    justifyContent: "center",
    marginTop: 60,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    paddingHorizontal: 20,
  },
  inviteButton: {
    marginLeft: "auto",
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  scrollcontent: {
    flex: 1,
    width: "100%",
  },
  loginLogo: {
    width: 35,
    height: 35,
    marginRight: 10,
  },
  title: {
    fontFamily: "Rubik",
    fontSize: 25,
  },
  quizContent: {
    width: "90%",
    alignSelf: "center",
    paddingBottom: 50,
  },
  mainCard: {},
  imgMainQuiz: {
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
  },
  mainCardText: {
    padding: 5,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign: "left",
  },
  titleMainQuiz: {
    textAlign: "left",
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  secondaryQuizzes: {
    flexDirection: "row",
    marginBottom: 15,
    marginTop: 15,
    alignItems: "center",
  },
  imgSecondaryQuiz: {
    height: 100,
    width: 150,
    backgroundColor: "#24bf94",
    opacity: 0.8,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  teamInitial: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  contentSecondaryQuiz: {
    flex: 1,
    paddingLeft: 15,
    justifyContent: "center",
  },
  titleSecondaryQuiz: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 2,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalIconContainer: {
    backgroundColor: "#24BF94",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -55,
    marginBottom: 15,
    borderWidth: 4,
    borderColor: "#fff",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtonPlay: {
    backgroundColor: "#24BF94",
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  modalButtonPlayText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  modalButtonClose: {
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  modalButtonCloseText: {
    color: "#999",
    fontSize: 14,
  },
  emailInput: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
  },
});
