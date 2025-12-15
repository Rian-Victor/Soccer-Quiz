import { StyleSheet, View, Image, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { authService } from "../services/authApi";

export default function RedefinirSenha() {
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");

    const router = useRouter();

    const handleReset = async () => {
        if (!token.trim() || !newPassword.trim()) {
            setError("Preencha o token e a nova senha.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            await authService.confirmPasswordReset({
                token: token.trim(),
                new_password: newPassword,
                email: email.trim()
            });

            Alert.alert(
                "Sucesso!",
                "Sua senha foi alterada.",
                [{ text: "Ir para Login", onPress: () => router.dismissAll() }]
            );

        } catch (err: any) {
            const errorMessage = err.message || "Token inválido ou expirado.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>

                <View style={styles.logoContent}>
                    <Image source={require('../assets/images/LogoBG.png')} style={styles.loginLogo} />
                    <Text style={styles.title}>Nova Senha</Text>
                </View>

                <View style={styles.inputContent}>
                    <Text style={styles.description}>
                        Cole o código que apareceu no terminal do backend.
                    </Text>

                    <Text style={styles.inputTitle}>Confirme seu Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite seu email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />

                    <Text style={styles.inputTitle}>Código (Token)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: 123456"
                        placeholderTextColor="#A9A9A9"
                        value={token}
                        onChangeText={setToken}
                        autoCapitalize="none"
                        editable={!loading}
                    />

                    <Text style={styles.inputTitle}>Nova Senha</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite a nova senha"
                        placeholderTextColor="#A9A9A9"
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry
                        editable={!loading}
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.botao, loading && styles.botaoDisabled]}
                        onPress={handleReset}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.textoBotao}>Alterar Senha</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create<any>({
    container: { flex: 1, justifyContent: "center", alignItems: "center", flexDirection: 'row', backgroundColor: '#f1f1f1' },
    content: { flex: 1, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
    loginLogo: { width: 80, height: 80, marginBottom: 10 },
    logoContent: { flex: 0.8, justifyContent: 'center', alignItems: 'center', paddingTop: 15 },
    inputContent: { flex: 1.5, justifyContent: 'flex-start', alignItems: 'flex-start' },
    description: { width: 320, fontFamily: 'Poppins', fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'left' },
    inputTitle: { fontFamily: 'Rubik', fontSize: 18, fontWeight: '450' },
    input: { backgroundColor: '#fff', width: 320, height: 60, borderRadius: 10, marginTop: 7, marginBottom: 20, color: '#000', paddingLeft: 10, fontFamily: 'Poppins' },
    title: { fontFamily: 'Rubik', fontSize: 25, fontWeight: '500', marginBottom: 10 },
    botao: { width: 320, height: 55, backgroundColor: "#24BF94", borderRadius: 10, marginBottom: 15, justifyContent: 'center', alignItems: 'center' },
    textoBotao: { color: 'white', textAlign: 'center', fontSize: 17, fontFamily: 'Rubik' },
    botaoDisabled: { opacity: 0.6 },
    errorText: { color: '#FF3B30', fontSize: 14, marginBottom: 10, fontFamily: 'Poppins', textAlign: 'center', width: 320 },
    backButton: { marginTop: 10, width: 320, alignItems: 'center' },
    backButtonText: { color: '#24BF94', fontSize: 16, textDecorationLine: 'underline', fontFamily: 'Poppins' }
});