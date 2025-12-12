import {
  StyleSheet,
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function Home() {
  // SRP: este componente exibe apenas a tela inicial de quizzes.
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContent}>
          <Image
            source={require("../../assets/images/LogoBG.png")}
            style={styles.loginLogo}
          ></Image>
          <Text style={styles.title}>FUTQUIZ</Text>
        </View>

        <ScrollView style={styles.scrollcontent}>
          <View style={styles.quizContent}>
            <View style={styles.mainQuiz}>
              <View style={styles.imgMainQuiz}></View>
              <Text style={styles.titleMainQuiz}>
                Quiz mania: quem é o jogador favorito de CR7
              </Text>
              <Text>XX/XX/XXXX</Text>
            </View>
            <View style={[styles.secondaryQuizzes, { marginTop: 20 }]}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text>XX/XX/XXXX</Text>
              </View>
            </View>
            <View style={styles.secondaryQuizzes}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text>XX/XX/XXXX</Text>
              </View>
            </View>
            <View style={styles.secondaryQuizzes}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text>XX/XX/XXXX</Text>
              </View>
            </View>
            <View style={styles.secondaryQuizzes}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text>XX/XX/XXXX</Text>
              </View>
            </View>
            <View style={styles.secondaryQuizzes}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text>XX/XX/XXXX</Text>
              </View>
            </View>
            <View style={styles.secondaryQuizzes}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text>XX/XX/XXXX</Text>
              </View>
            </View>
            <View style={styles.secondaryQuizzes}>
              <View style={styles.imgSecondaryQuiz}></View>
              <View style={styles.contentSecondaryQuiz}>
                <Text style={styles.titleSecondaryQuiz}>
                  Quiz: Time do Barcelona em 2009
                </Text>
                <Text>XX/XX/XXXX</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // CSS Padrão da página + Logo
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
    justifyContent: "center",
    marginTop: 60,
    flexDirection: "row",
  },

  scrollcontent: {
    flex: 1,
  },

  loginLogo: {
    width: 35,
    height: 35,
    marginBottom: 0,
    marginRight: 10,
  },

  title: {
    fontFamily: "Rubik",
    fontSize: 25,
    fontWeight: 500,
  },

  // Quiz

  quizContent: {
    width: 350,
  },

  secondaryQuizzes: {
    flexDirection: "row",
    columnGap: 5,
    marginBottom: 10,
    marginTop: 10,
    flex: 1,
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
  },

  titleMainQuiz: {
    fontFamily: "Rubik",
    fontSize: 18,
    marginTop: 10,
    marginBottom: 7,
  },

  titleSecondaryQuiz: {
    fontFamily: "Rubik",
    fontWeight: 300,
    marginBottom: 7,
  },
});
