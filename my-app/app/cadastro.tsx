import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
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
