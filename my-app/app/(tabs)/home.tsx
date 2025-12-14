import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { teamService, TeamResponse } from "../../services/quizApi";

export default function Home() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const data = await teamService.getTeams();
      setTeams(data);
    } catch (error) {
      console.log("Erro ao buscar times:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJogarGeral = () => {
    router.push({
      pathname: "/game",
      params: { mode: "general" }
    } as any);
  };

  const handleJogarTime = (teamId: string, teamName: string) => {
    Alert.alert(
      "Quiz de time",
      `Deseja iniciar o Quiz do ${teamName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "JOGAR",
          onPress: () => router.push({
            pathname: "/game",
            params: { mode: "team", teamId: teamId }
          } as any)
        }
      ]
    );
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

        <ScrollView style={styles.scrollcontent} showsVerticalScrollIndicator={false}>
          <View style={styles.quizContent}>

            <TouchableOpacity onPress={handleJogarGeral} activeOpacity={0.9} style={styles.mainCard}>
              <View style={[styles.imgMainQuiz, { backgroundColor: '#24bf94' }]}>
                <Image source={require("../../assets/images/LogoBG.png")} style={{ width: 60, height: 60, opacity: 0.8 }} />
              </View>
              <View style={styles.mainCardText}>
                <Text style={styles.titleMainQuiz}>Quiz Geral: Teste seus conhecimentos gerais sobre futebol!</Text>
                <Text style={{ color: '#666' }}>04/12/2024</Text>
              </View>
            </TouchableOpacity>

            {loading ? (
              <ActivityIndicator color="#24bf94" style={{ marginTop: 20 }} />
            ) : teams.length === 0 ? (
              <Text style={{ color: '#999', fontStyle: 'italic' }}></Text>
            ) : (
              teams.map((team) => (
                <TouchableOpacity
                  key={team.id}
                  style={styles.secondaryQuizzes}
                  onPress={() => handleJogarTime(team.id, team.name)}
                >
                  <View style={styles.imgSecondaryQuiz}>
                    <Text style={styles.teamInitial}>{team.name.substring(0, 1)}</Text>
                  </View>
                  <View style={styles.contentSecondaryQuiz}>
                    <Text style={styles.titleSecondaryQuiz}>
                      Quiz do {team.name}
                    </Text>
                    <Text style={{ color: '#a8a4a4ff', fontSize: 14 }}>
                      16/12/2025
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
    alignItems: 'center'
  },
  scrollcontent: {
    flex: 1,
    width: '100%',
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
    width: '90%',
    alignSelf: 'center',
    paddingBottom: 50
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 15,
    color: '#333'
  },
  mainCard: {
  },
  imgMainQuiz: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius:15,
  },
  mainCardText: {
    padding: 5,
    paddingTop: 15,
    paddingBottom: 15,
    textAlign:"left",
  },
  titleMainQuiz: {
    textAlign:"left",
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5
  },
  secondaryQuizzes: {
    flexDirection: "row",
    marginBottom: 15,
    marginTop: 15,
    alignItems: 'center',
  },
  imgSecondaryQuiz: {
    height: 100,
    width: 150,
    backgroundColor: "#24bf94",
    opacity: 0.8,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center'
  },
  teamInitial: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold'
  },
  contentSecondaryQuiz: {
    flex: 1,
    paddingLeft: 15,
    justifyContent: 'center'
  },
  titleSecondaryQuiz: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 2
  },
});