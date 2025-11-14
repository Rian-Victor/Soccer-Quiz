import { StyleSheet, View, Image, Text} from "react-native";

export default function SplashScreen(){
    return (
        <View style={styles.container}>
            <Image source={require("../assets/images/LogoBG.png")} style={styles.image}></Image>
            <Text style={styles.title}>FUTQUIZ</Text>
            <Text style={styles.subtitle}>Os melhores quizzes de futebol estão aqui!</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
    flex:1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'column'
  },

    image:{
    width:130,
    height:130,
},

    title:{
        color: 'white',
        fontSize: 30,
        fontFamily: 'Rubik',
        fontWeight: 500
    },

    subtitle:{
        color:'white',
        fontSize: 18,
        maxWidth:210,
        lineHeight: 18,
        textAlign: 'center',
        fontFamily: 'RubikLight'
    }
})