import { StyleSheet, View, Image, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { authService } from "../services/authApi";

export default function RecuperarSenha() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleRecovery = async () => {
        if (!email.trim()) {
            setError("Por favor, digite seu e-mail.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            console.log("Solicitando recuperação para:", email);
            await authService.requestPasswordReset({ email: email.trim() });

            Alert.alert("Sucesso", "Verifique o terminal do backend para pegar o token.");
            router.push("/redefinir-senha");

        } catch (err: any) {
            console.error("Erro na recuperação:", err);
            Alert.alert(
                "Atenção",
                "Houve um erro no envio do e-mail, mas o token pode ter sido gerado. Verifique o terminal do backend.",
                [
                    { text: "OK", onPress: () => { } }
                ]
            );
            setError("Erro ao conectar. Se o token apareceu no terminal, clique em 'Já tenho o código'.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContent}>
                    <Image source={require('../assets/images/LogoBG.png')} style={styles.loginLogo}></Image>
                    <Text style={styles.title}>Recuperar Senha</Text>
                </View>

                <View style={styles.inputContent}>
                    <Text style={styles.description}>
                        Digite o e-mail para gerar o token no terminal do servidor.
                    </Text>

                    <Text style={styles.inputTitle}>E-mail</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Digite seu e-mail cadastrado"
                        placeholderTextColor="#A9A9A9"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading}
                    />

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity
                        style={[styles.botao, loading && styles.botaoDisabled]}
                        onPress={handleRecovery}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.textoBotao}>Gerar Token</Text>
                        )}
                    </TouchableOpacity>

                    <Link href="/redefinir-senha" asChild>
                        <TouchableOpacity style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Já tenho o código</Text>
                        </TouchableOpacity>
                    </Link>

                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Voltar ao Login</Text>
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
    backButtonText: { color: '#666', fontSize: 16, fontFamily: 'Poppins' },

    secondaryButton: { width: 320, height: 50, justifyContent: 'center', alignItems: 'center', borderColor: '#24BF94', borderWidth: 1, borderRadius: 10, marginBottom: 10 },
    secondaryButtonText: { color: '#24BF94', fontSize: 16, fontFamily: 'Rubik' }
});