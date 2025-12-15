import {StyleSheet, View, Image, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert} from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/authApi";

export default function Login(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Tentando fazer login...");
      const response = await authService.login({
        email: email.trim(),
        password: password,
      });

      await AsyncStorage.setItem("access_token", response.access_token);
      await AsyncStorage.setItem("refresh_token", response.refresh_token);
      await AsyncStorage.setItem("user_id", response.user_id.toString());
      await AsyncStorage.setItem("user_role", response.role);
      await AsyncStorage.setItem("expires_at", response.expires_at);

      console.log("Login bem-sucedido! User ID:", response.user_id);
      
      router.replace("/(tabs)/home");
    } catch (err: any) {
      console.error("Erro no login:", err);
      const errorMessage = err.message || "Erro ao fazer login. Verifique suas credenciais.";
      setError(errorMessage);
      Alert.alert("Erro no Login", errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      editable={!loading}
                  />

                  <Text style={styles.inputTitle}>Senha</Text>
                  <TextInput
                      style={styles.input}
                      placeholder="Digite sua senha"
                      placeholderTextColor="#A9A9A9" 
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                      editable={!loading}
                  />

                  {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                  ) : null}

                  <TouchableOpacity 
                    style={[styles.botao, {paddingTop: 15}, loading && styles.botaoDisabled]} 
                    onPress={handleLogin}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.textoBotao}>Entrar</Text>
                    )}
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
    borderRadius: 10,
    marginBottom:15
  },

  textoBotao:{
    color: 'white',
    textAlign: 'center',
    fontSize: 17
  },

  botaoDisabled: {
    opacity: 0.6
  },

  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 10,
    fontFamily: 'Poppins',
    textAlign: 'center'
  }
})
