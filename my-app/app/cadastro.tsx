import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { userService } from "../services/userApi";
import { appSettings } from "../Configs/settings";

export default function Cadastro() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");

  const [loading, setLoading] = useState(false);
  const [erroConfirm, setErroConfirm] = useState(false);
  const [erroSenha, setErroSenha] = useState(false);

  const [regraTamanho, setRegraTamanho] = useState(false);
  const [regraNumero, setRegraNumero] = useState(false);

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirm, setMostrarConfirm] = useState(false);

  const validarSenha = (text: string) => {
    setSenha(text);
    setRegraTamanho(text.length >= 6);
    setRegraNumero(/\d/.test(text));

    if (confirmSenha.length > 0) {
      setErroConfirm(confirmSenha !== text);
    }
  };

  const validarConfirmacao = (text: string) => {
    setConfirmSenha(text);
    setErroConfirm(text !== senha);
  };

  const senhaValida =
    regraTamanho &&
    regraNumero &&
    !erroConfirm &&
    senha.length > 0 &&
    confirmSenha.length > 0;

  const handleCadastrar = async () => {
    if (!nome.trim() || !email.trim()) {
      Alert.alert("Erro", "Preencha nome e e-mail.");
      return;
    }

    if (!senhaValida) {
      Alert.alert("Erro", "Verifique os requisitos da senha.");
      return;
    }

    setLoading(true);

    try {
      console.log("Tentando criar usuário...");
      console.log("URL do backend:", appSettings.URL.backend.api);

      const response = await userService.createUser({
        name: nome.trim(),
        email: email.trim(),
        password: senha,
      });

      console.log("Usuário criado com sucesso! ID:", response.id);

      Alert.alert("Sucesso", "Conta criada com sucesso!", [
        { text: "Fazer Login", onPress: () => router.replace("/login") },
      ]);
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      const errorMessage =
        err.message ||
        "Erro ao criar conta. Verifique os dados e tente novamente.";
      Alert.alert("Erro ao cadastrar", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContent}>
          <Image
            source={require("../assets/images/LogoBG.png")}
            style={styles.loginLogo}
          ></Image>
          <Text style={styles.title}>FUTQUIZ</Text>
        </View>

        <ScrollView style={styles.scrollcontent}>
          <View style={styles.inputContent}>
            <Text style={styles.inputTitle}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome completo"
              placeholderTextColor="#A9A9A9"
              value={nome}
              onChangeText={setNome}
            />

            <Text style={styles.inputTitle}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor="#A9A9A9"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.inputTitle}>Senha</Text>
            <View style={{ position: "relative" }}>
              <TextInput
                style={[
                  styles.input,
                  { marginBottom: 10 },
                  erroSenha && { borderColor: "#FF3B3B", borderWidth: 1 },
                ]}
                placeholder="Digite uma senha"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={!mostrarSenha}
                onChangeText={validarSenha}
                value={senha}
              />
              <TouchableOpacity
                onPress={() => setMostrarSenha(!mostrarSenha)}
                style={{ position: "absolute", right: 10, top: 25 }}
              >
                <Feather
                  name={mostrarSenha ? "eye-off" : "eye"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>

            <Text style={{ fontWeight: "300", fontSize: 12, marginBottom: 2 }}>
              A senha deve conter, no mínimo:
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Feather
                name={regraTamanho ? "check-circle" : "x-circle"}
                size={14}
                color={regraTamanho ? "green" : "red"}
                style={{ marginLeft: 15 }}
              />
              <Text
                style={[
                  styles.inputTitle,
                  {
                    fontSize: 12,
                    marginLeft: 5,
                    fontWeight: "200",
                    color: regraTamanho ? "green" : "red",
                    marginBottom: 2,
                  },
                ]}
              >
                6 caracteres
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 15,
              }}
            >
              <Feather
                name={regraNumero ? "check-circle" : "x-circle"}
                size={14}
                color={regraNumero ? "green" : "red"}
                style={{ marginLeft: 15 }}
              />
              <Text
                style={[
                  styles.inputTitle,
                  {
                    fontSize: 12,
                    marginLeft: 5,
                    fontWeight: "200",
                    color: regraNumero ? "green" : "red",
                  },
                ]}
              >
                1 número
              </Text>
            </View>

            <View style={{ position: "relative" }}>
              <Text style={styles.inputTitle}>Confirmação de Senha</Text>
              <TextInput
                style={[
                  styles.input,
                  { marginBottom: 5 },
                  erroConfirm && { borderColor: "#FF3B3B", borderWidth: 1 },
                ]}
                placeholder="Repita novamente a senha"
                placeholderTextColor="#A9A9A9"
                secureTextEntry={!mostrarConfirm}
                onChangeText={validarConfirmacao}
                value={confirmSenha}
              />
              <TouchableOpacity
                onPress={() => setMostrarConfirm(!mostrarConfirm)}
                style={{ position: "absolute", right: 10, top: 45 }}
              >
                <Feather
                  name={mostrarConfirm ? "eye-off" : "eye"}
                  size={20}
                  color="#555"
                />
              </TouchableOpacity>
            </View>

            {erroConfirm && confirmSenha.length > 0 && (
              <Text style={{ color: "#FF3B3B", marginBottom: 20 }}>
                As senhas não coincidem
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.botao,
                {
                  backgroundColor: senhaValida && !loading ? "#24BF94" : "#999",
                },
              ]}
              onPress={handleCadastrar}
              disabled={!senhaValida || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.textoBotao}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.viewcadastre}>
          0<Text style={{ fontSize: 17 }}>Já possui uma conta? </Text>
          <Link href={"/login"}>
            <Text style={styles.cadastre}>Fazer login</Text>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    backgroundColor: "#f1f1f1",
  },

  content: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },

  logoContent: {
    flex: 0.6,
    justifyContent: "center",
    paddingTop: 15,
  },

  loginLogo: {
    width: 100,
    height: 100,
    marginBottom: 15,
  },

  title: {
    fontFamily: "Rubik",
    fontSize: 25,
    fontWeight: 500,
  },

  //inputContent

  scrollcontent: {
    flex: 1,
  },

  inputContent: {
    justifyContent: "flex-start",
    alignItems: "flex-start",
    marginTop: 15,
  },

  inputTitle: {
    fontFamily: "Rubik",
    fontSize: 18,
    fontWeight: 450,
  },

  input: {
    backgroundColor: "#fff",
    width: 320,
    height: 60,
    borderRadius: 10,
    marginTop: 7,
    marginBottom: 20,
    color: "#000",
    paddingLeft: 10,
    fontFamily: "Poppins",
  },

  botao: {
    width: 320,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 15,
  },

  textoBotao: {
    color: "white",
    textAlign: "center",
    fontSize: 17,
  },

  viewcadastre: {
    flex: 0.5,
    flexDirection: "row",
    alignItems: "center",
  },

  cadastre: {
    color: "#24BF94",
    textDecorationLine: "underline",
    fontSize: 18,
  },
});
