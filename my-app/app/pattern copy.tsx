import { Image, StyleSheet, Text, View } from "react-native";

export default function Pattern(){
    return(
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContent}>
                    <Image source={require('../assets/images/LogoBG.png')} style={styles.loginLogo}></Image>
                    <Text style={styles.title}>FUTQUIZ</Text>

                    <Text>Bem vindo a Home</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({

    container:{
    flex:1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    },

    content:{
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
    },

    logoContent:{
    flex: 1,
    justifyContent: 'center',
    paddingTop: 15,
    },

    loginLogo:{
    width: 100,
    height: 100,
    marginBottom: 15
    },

    title:{
    fontFamily: 'Rubik',
    fontSize:25,
    fontWeight: 500
    },

    

})