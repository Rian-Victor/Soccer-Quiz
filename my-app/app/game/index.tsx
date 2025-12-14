import React, { useEffect, useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { quizGameService } from '../../services/quizApi'; 
import { Feather } from '@expo/vector-icons';

export default function GameScreen() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [currentQuiz, setCurrentQuiz] = useState<any>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const [timer, setTimer] = useState(15);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        iniciarJogo();
    }, []);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsActive(false);
            Alert.alert("Tempo Esgotado!", "Você demorou demais.", [
                { text: "Tentar Próxima", onPress: () => handleResponder(true) }
            ]);
        }
        return () => clearInterval(interval);
    }, [isActive, timer]);

    const iniciarJogo = async () => {
        try {
            setLoading(true);
            
            let quizData = await quizGameService.getCurrentQuiz();

            if (!quizData) {
                await quizGameService.startQuiz("general");
                quizData = await quizGameService.getCurrentQuiz();
            }

            carregarPergunta(quizData);
        } catch (error) {
            console.log(error);
            Alert.alert("Erro", "Não foi possível iniciar o jogo. Verifique a conexão.");
            router.back();
        }
    };

    const carregarPergunta = (data: any) => {
        if (!data) return;
        console.log("Dados da pergunta:", data);
        setCurrentQuiz(data);
        setTimer(15); 
        setSelectedAnswer(null); 
        setIsActive(true); 
        setLoading(false);
    };

    const handleResponder = async (tempoEsgotado = false) => {
        if (!selectedAnswer && !tempoEsgotado) return;

        setIsActive(false); 
        setLoading(true);

        try {
            const tempoGasto = 15 - timer;
            const respostaParaEnviar = selectedAnswer || "tempo_esgotado";

            const resultado = await quizGameService.submitAnswer(
                currentQuiz.session_id,
                currentQuiz.current_question.id,
                respostaParaEnviar,
                tempoGasto
            );

            console.log("Resultado:", resultado);

            if (resultado.is_correct) {
                Alert.alert("GOLAÇO! ⚽", `Você ganhou ${resultado.points_earned} pontos!`);
            } else {
                Alert.alert("NA TRAVE! ❌", "Errou ou o tempo acabou.");
            }

            if (resultado.is_quiz_finished) {
                Alert.alert("Fim de Jogo!", `Pontuação Final: ${resultado.new_total_points}`, [
                    { text: "Voltar para Home", onPress: () => router.replace("/(tabs)/home") }
                ]);
            } else {
                const nextQuiz = await quizGameService.getCurrentQuiz();
                carregarPergunta(nextQuiz);
            }

        } catch (error) {
            Alert.alert("Erro", "Falha ao enviar resposta");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#24BF94" />
                <Text style={{ marginTop: 10, color: '#555' }}>Carregando o campo...</Text>
            </View>
        );
    }

    if (!currentQuiz) return null;

    const { current_question, progress } = currentQuiz;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>Questão {progress}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: timer < 5 ? '#FF3B30' : '#24BF94' }]}>
                    <Feather name="clock" size={16} color="white" style={{ marginRight: 5 }} />
                    <Text style={styles.badgeText}>{timer}s</Text>
                </View>
            </View>

            <View style={styles.questionContainer}>
                <Text style={styles.category}>{current_question.topic}</Text>
                <Text style={styles.questionText}>{current_question.statement}</Text>
            </View>

            <View style={styles.optionsContainer}>
                {current_question.answers.map((answer: any) => (
                    <TouchableOpacity
                        key={answer.id}
                        style={[
                            styles.optionButton,
                            selectedAnswer === answer.id && styles.optionSelected
                        ]}
                        onPress={() => setSelectedAnswer(answer.id)}
                    >
                        <Text style={[
                            styles.optionText,
                            selectedAnswer === answer.id && styles.optionTextSelected
                        ]}>
                            {answer.text}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, !selectedAnswer && styles.submitButtonDisabled]}
                    disabled={!selectedAnswer}
                    onPress={() => handleResponder(false)}
                >
                    <Text style={styles.submitButtonText}>CHUTAR AO GOL</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F1F1',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        marginTop: 30
    },
    badge: {
        backgroundColor: '#333',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center'
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
    },
    questionContainer: {
        padding: 20,
        marginTop: 10,
    },
    category: {
        color: '#24BF94',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 10,
    },
    questionText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        lineHeight: 30,
    },
    optionsContainer: {
        padding: 20,
        flex: 1,
    },
    optionButton: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 15,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 2,
    },
    optionSelected: {
        borderColor: '#24BF94',
        backgroundColor: '#E8FAF6',
    },
    optionText: {
        fontSize: 16,
        color: '#333',
    },
    optionTextSelected: {
        fontWeight: 'bold',
        color: '#24BF94',
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
    },
    submitButton: {
        backgroundColor: '#24BF94',
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        backgroundColor: '#CCC',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    }
});