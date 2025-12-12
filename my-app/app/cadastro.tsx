import React, { useState } from "react";
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";

export default function Cadastro() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");

    const senhaValida = senha.length >= 6; // seu requisito

    return (
        <View style={{ padding: 20 }}>
            <TextInput
                placeholder="Nome completo"
                value={nome}
                onChangeText={setNome}
                style={{ borderWidth: 1, marginBottom: 15, padding: 10 }}
            />

            <TextInput
                placeholder="E-mail"
                value={email}
                onChangeText={setEmail}
                style={{ borderWidth: 1, marginBottom: 15, padding: 10 }}
            />

            <TextInput
                placeholder="Senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                style={{ borderWidth: 1, marginBottom: 15, padding: 10 }}
            />

            <TouchableOpacity
                disabled={!senhaValida}
                style={{
                    backgroundColor: senhaValida ? "#24BF94" : "#999",
                    padding: 15,
                    alignItems: "center",
                    borderRadius: 8,
                }}
            >
                <Text style={{ color: "white", fontWeight: "bold" }}>Cadastrar</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: 'row',
        backgroundColor: '#f1f1f1',
    },

    content: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },

    logoContent: {
        flex: 0.6,
        justifyContent: 'center',
        paddingTop: 15,
    },

    loginLogo: {
        width: 100,
        height: 100,
        marginBottom: 15
    },

    title: {
        fontFamily: 'Rubik',
        fontSize: 25,
        fontWeight: 500
    },

    scrollcontent: {
        flex: 1,
    },

    inputContent: {
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        marginTop: 15
    },

    inputTitle: {
        fontFamily: 'Rubik',
        fontSize: 18,
    },

    input: {
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

    botao: {
        width: 320,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        marginTop: 15
    },

    textoBotao: {
        color: 'white',
        textAlign: 'center',
        fontSize: 17
    },

    viewcadastre: {
        flex: 0.5,
        flexDirection: 'row',
        alignItems: 'center'
    },

    cadastre: {
        color: '#24BF94',
        textDecorationLine: "underline",
        fontSize: 18,
    },
})