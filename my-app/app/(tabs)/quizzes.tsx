import {StyleSheet, View, Image, Text, TextInput, TouchableOpacity} from "react-native";
import Svg, { Path } from "react-native-svg";

export default function Perfil(){
    return(
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContent}>
                   
                    <Text style={styles.title}>FUTQUIZ</Text>

                    <Text>Bem vindo a Home</Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({

    // CSS Padrão da página + Logo
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