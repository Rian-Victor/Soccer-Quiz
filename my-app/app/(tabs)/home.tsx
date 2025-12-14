import {
  StyleSheet,
  View,
  Image,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router"; 

export default function Home() {
  const router = useRouter(); 

  const handleJogar = () => {
    console.log("Indo para o jogo...");
    router.push("/game" as any); 
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

        <ScrollView style={styles.scrollcontent}>
          <View style={styles.quizContent}>
            
            <TouchableOpacity onPress={handleJogar} activeOpacity={0.8}>
              <View style={styles.imgMainQuiz}></View>
              <Text style={styles.titleMainQuiz}>
                Quiz mania: quem é o jogador favorito de CR7
              </Text>
              <Text style={{ color: '#666' }}>13/12/2025</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.secondaryQuizzes, { marginTop: 20 }]} 
              onPress={handleJogar}
            >
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text style={{ color: '#666' }}>12/12/2025</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryQuizzes} onPress={handleJogar}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Campeões da Copa de 2002
                </Text>
                <Text style={{ color: '#666' }}>10/12/2025</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.secondaryQuizzes}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: História do Brasileirão
                </Text>
                <Text style={{ color: '#666' }}>09/12/2025</Text>
              </View>
            </View>

          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
  },

  content: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  logoContent: {
    flex: 0.1, 
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
    fontWeight: "bold", 
  },

  quizContent: {
    width: 350,
    alignSelf: 'center',
    paddingBottom: 50
  },

  secondaryQuizzes: {
    flexDirection: "row",
    columnGap: 5,
    marginBottom: 10,
    marginTop: 10,
  },

  imgMainQuiz: {
    height: 200,
    backgroundColor: "#D9D9D9",
    borderRadius: 15,
  },

  imgSecondaryQuiz: {
    height: 100,
    width: 170,
    backgroundColor: "#D9D9D9",
    borderRadius: 10,
  },

  contentSecondaryQuiz: {
    width: 170,
    paddingLeft: 5,
    justifyContent: 'center'
  },

  titleMainQuiz: {
    fontFamily: "Rubik",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 7,
    fontWeight: "500" 
  },

  titleSecondaryQuiz: {
    fontFamily: "Rubik",
    marginBottom: 7,
    fontWeight: "300" 
  },
});