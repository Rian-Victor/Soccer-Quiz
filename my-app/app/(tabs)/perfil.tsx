import { Link } from "expo-router";
import {StyleSheet, View, Image, Text, TextInput, TouchableOpacity} from "react-native";

export default function Perfil(){
    return(
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContent}>
                    <Image source={require('../../assets/images/LogoBG.png')} style={styles.loginLogo}></Image>
                    <Text style={styles.title}>FUTQUIZ</Text>
                </View>

                <View style={styles.profileContent}>
                    <View style={styles.userProfile}>
                        <View style={styles.userPhoto}></View>
                        <Text style={styles.userProfileText}>Neymar Jr.</Text>
                    </View>

                    <View style={styles.userStats}>
                        <View>
                            <Text style={styles.userStatsText}>Saldo{"\n"}R$: XXX,XX</Text>
                        </View>
                        <View>
                            <Text style={styles.userStatsText}>Pontos{"\n"}XXXX</Text>
                        </View>
                    </View>
                    <View style={styles.userConfig}>
                        <Text style={[styles.userConfigText, {fontSize: 22, fontWeight:400, marginBottom: 10}]}>Configurações</Text>
                        <Text style={styles.userConfigText}>Informações pessoais</Text>
                        <Text style={styles.userConfigText}>Adicionar saldo</Text>
                        <Text style={styles.userConfigText}>Alterar foto</Text>
                        <Link href="../login" style={[styles.userConfigText, {color: 'red', fontWeight: 300}]}>Sair</Link>
                </View>
                </View>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({

    // CSS Padrão da página + Logo
    container:{
    flex:1,
    minWidth: 300,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    },

    profileContent:{
        flex: 1
    },

    logoContent:{
    flex: 0.35,
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center'
    },

    loginLogo:{
    width: 35,
    height: 35,
    marginBottom: 15,
    marginRight: 10,
    },

    title:{
    fontFamily: 'Rubik',
    fontSize:25,
    fontWeight: 500,
    textAlign: 'center',
    paddingBottom: 15
    },



    userProfileText:{
        fontFamily: "Rubik",
        fontSize: 20
    },

    userPhoto:{
        width:150,
        height: 150,
        backgroundColor: "#D9D9D9",
        borderRadius: 100,
        alignSelf: 'center'
    },

    userProfileText:{
        fontFamily: 'Rubik',
        fontSize: 20,
        textAlign: 'center',
        marginTop: 10
    },

    userStats:{
        flexDirection: "row",
        justifyContent: "space-around",
        columnGap: 50,
        alignItems: "center",
        flex: 0.4
    },

    userStatsText:{
        fontFamily: "Rubik",
        fontSize: 22,
        color: "#A6A6A6",
        textAlign: 'center'
    },

    userConfig:{
        minWidth: 400,
        paddingLeft: 40,
        paddingRight: 40,
        paddingTop: 25,
        paddingBottom: 25,
        backgroundColor: 'white',
        flex: 0.6,
        justifyContent: 'space-around'
    },

    userConfigText:{
        fontFamily: "Rubik",
        fontSize: 20,
        fontWeight: 300,
        marginTop: 10,
    }

    

})