import {StyleSheet, View, Image, Text, TextInput, TouchableOpacity} from "react-native";
import { Link } from "expo-router";

export default function Login(){
  return(
    <View style={styles.container}>
      <View style={styles.content}>
              <View style={styles.logoContent}>
                  <Image source={require('../assets/images/LogoBG.png')} style={styles.loginLogo}></Image>
                  <Text style={styles.title}>FUTQUIZ</Text>
              </View>
              <View style={styles.inputContent}>
                  <Text style={styles.inputTitle}>E-mail</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="Digite seu e-mail"
                      placeholderTextColor="#A9A9A9" 
                  />

                  <Text style={styles.inputTitle}>Senha</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="Digite sua senha"
                      placeholderTextColor="#A9A9A9" 
                      secureTextEntry
                  />

                  <TouchableOpacity style={styles.botao} >
                      <Text style={styles.textoBotao}>Entrar</Text>
                  </TouchableOpacity>

                  <Text style={[styles.inputTitle, {fontSize: 15, opacity: 0.8, textDecorationLine: "underline"}]}>Esqueceu a senha?</Text>
              </View>
              
              <View style={styles.viewcadastre}>
                <Text style={styles.texto}>Não possui uma conta? </Text>
                <Link href={"/cadastro"}>
                  <Text style={styles.cadastre}>Cadastre-se</Text>
                </Link>
              </View>
              
              

          </View>
    </View>
      
  );
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

  loginLogo:{
    width: 100,
    height: 100,
    marginBottom: 15
  },

  logoContent:{
    flex: 1,
    justifyContent: 'center',
    paddingTop: 15,
  },

  inputContent:{
     flex: 1,
     justifyContent: 'flex-start',
     alignItems: 'flex-start'
  },

  texto:{
    fontSize: 17,
  },

  viewcadastre:{
    flex: 0.5,
    flexDirection: 'row', 
    alignItems: 'center'
  },

  cadastre:{
    color: '#24BF94',
    textDecorationLine: "underline",
    fontSize:18,
  },
  

  inputTitle:{
    fontFamily: 'Rubik',
    fontSize: 18,
    fontWeight: 450
  },

  input:{
    backgroundColor: '#fff',
    width: 320,
    height: 60,
    borderRadius: 10,
    marginTop: 7,
    marginBottom: 20,
    color: '#000',
    paddingLeft: 10,
    fontFamily: 'Poppins'
  },

  title:{
    fontFamily: 'Rubik',
    fontSize:25,
    fontWeight: 500
  },

  botao:{
    width: 320,
    height: 55,
    backgroundColor: "#24BF94",
    justifyContent: 'center',
    borderRadius: 10,
    marginBottom:15
  },

  textoBotao:{
    color: 'white',
    textAlign: 'center',
    fontSize: 17
  }
})

