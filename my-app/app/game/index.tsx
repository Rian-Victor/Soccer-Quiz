import React, { useEffect, useState } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { quizGameService } from '../../services/quizApi';
import { Feather } from '@expo/vector-icons';

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [currentQuiz, setCurrentQuiz] = useState<any>(null);

    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [timer, setTimer] = useState(15);
    const [isActive, setIsActive] = useState(false);

    const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
    const [resultData, setResultData] = useState<{ correct: boolean, correctId: string } | null>(null);

    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        iniciarJogo();
    }, []);

    useEffect(() => {
        let interval: any = null;
        if (isActive && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0 && gameState === 'playing') {
            setIsActive(false);
            handleTempoEsgotado();
        }
        return () => clearInterval(interval);
    }, [isActive, timer, gameState]);

    const iniciarJogo = async () => {
        try {
            setLoading(true);
            let quizData = await quizGameService.getCurrentQuiz();

            if (!quizData) {
                const mode = (params.mode as "general" | "team") || "general";
                const teamId = params.teamId as string;
                await quizGameService.startQuiz(mode, teamId);
                quizData = await quizGameService.getCurrentQuiz();
            }
            prepararRodada(quizData);
        } catch (error) {
            console.log(error);
            Alert.alert("Erro", "Falha ao iniciar. Tente novamente.");
            router.back();
        }
    };

    const prepararRodada = (data: any) => {
        if (!data) return;
        setCurrentQuiz(data);
        setTimer(15);
        setSelectedAnswer(null);
        setGameState('playing');
        setResultData(null);
        setSubmitting(false);
        setIsActive(true);
        setLoading(false);
    };

    const handleTempoEsgotado = () => {
        Alert.alert("Tempo Esgotado!", "Que pena, acabou o tempo.", [
            { text: "Continuar", onPress: () => handleResponder(true) }
        ]);
    };

    const handleResponder = async (tempoEsgotado = false) => {
        if (submitting) return;
        if (!selectedAnswer && !tempoEsgotado) return;

        setSubmitting(true);
        setIsActive(false);
        setGameState('feedback');

        try {
            const tempoGasto = 15 - timer;
            const respostaEnviar = selectedAnswer || "tempo_esgotado";

            const resultado = await quizGameService.submitAnswer(
                currentQuiz.session_id,
                currentQuiz.current_question.id,
                respostaEnviar,
                tempoGasto
            );

            setResultData({
                correct: resultado.is_correct,
                correctId: resultado.correct_answer_id
            });

            setTimeout(async () => {
                if (resultado.is_quiz_finished) {
                    Alert.alert("Fim de Jogo!", `Pontuação Final: ${resultado.new_total_points}`, [
                        { text: "Voltar para Home", onPress: () => router.replace("/(tabs)/home") }
                    ]);
                } else {
                    const nextQuiz = await quizGameService.getCurrentQuiz();
                    prepararRodada(nextQuiz);
                }
            }, 2000);

        } catch (error) {
            Alert.alert("Atenção", "Erro ao processar resposta. Tente novamente.");
            setGameState('playing');
            setSubmitting(false);
            setIsActive(true);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#24BF94" />
                <Text style={{ marginTop: 10, color: '#555' }}>Iniciando quiz...</Text>
            </View>
        );
    }

    if (!currentQuiz) return null;

    const { current_question, progress } = currentQuiz;
    const isButtonDisabled = !selectedAnswer || gameState === 'feedback' || submitting;

    return (
        <SafeAreaView style={styles.container}>

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="chevron-left" size={28} color="#004D40" />
                </TouchableOpacity>
                <Text style={styles.progressText}>{progress}</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="x" size={24} color="#004D40" />
                </TouchableOpacity>
            </View>

            {/* TIMER */}
            <View style={styles.timerContainer}>
                <View style={[styles.timerCircle, timer < 5 && styles.timerCircleRed]}>
                    <Text style={[styles.timerText, timer < 5 && { color: '#FF3B30' }]}>{timer}</Text>
                </View>
            </View>

            <View style={styles.questionCard}>
                <Text style={styles.questionText}>{current_question.statement}</Text>
            </View>

            <View style={styles.optionsContainer}>
                {current_question.answers.map((answer: any) => {

                    let itemStyle = styles.optionButton;
                    let textStyle = styles.optionText;
                    let iconName = "circle";
                    let iconColor = "#ccc";

                    const isSelected = selectedAnswer === answer.id;

                    if (gameState === 'playing') {
                        if (isSelected) {
                            iconName = "check-circle";
                            iconColor = "#333";
                        }
                    }
                    else if (gameState === 'feedback' && resultData) {
                        if (isSelected) {
                            if (resultData.correct) {
                                itemStyle = styles.optionCorrect;
                                iconName = "check-circle";
                                iconColor = "#004D40";
                            } else {
                                itemStyle = styles.optionWrong;
                                iconName = "x-circle"; 
                                iconColor = "#591313";
                            }
                        }
                        else if (answer.id === resultData.correctId) {
                            itemStyle = styles.optionCorrect;
                            iconName = "check-circle";
                            iconColor = "#004D40";
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={answer.id}
                            style={itemStyle}
                            disabled={gameState === 'feedback' || submitting}
                            onPress={() => setSelectedAnswer(answer.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={textStyle}>{answer.text}</Text>
                            <Feather name={iconName as any} size={24} color={iconColor} />
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isButtonDisabled && styles.submitButtonDisabled]}
                    disabled={isButtonDisabled}
                    onPress={() => handleResponder(false)}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? "Proxima..." : "Enviar"}
                    </Text>
                </TouchableOpacity>
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create<any>({
    container: { flex: 1, backgroundColor: '#F1F3F4' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
    progressText: { fontSize: 16, fontWeight: 'bold', color: '#333' },

    timerContainer: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
    timerCircle: { width: 55, height: 55, borderRadius: 30, borderWidth: 4, borderColor: '#24BF94', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    timerCircleRed: { borderColor: '#FF3B30' },
    timerText: { fontSize: 18, fontWeight: 'bold', color: '#24BF94' },

    questionCard: { backgroundColor: 'white', marginHorizontal: 20, padding: 30, borderRadius: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    questionText: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: 24 },

    optionsContainer: { paddingHorizontal: 20, flex: 1 },

    optionButton: {
        backgroundColor: 'white',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 1
    },
    optionText: { fontSize: 16, color: '#333', fontWeight: '500' },

    optionCorrect: {
        backgroundColor: '#A8D5C6',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#24BF94'
    },

    optionWrong: {
        backgroundColor: '#F29898',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D32F2F'
    },

    footer: { padding: 20, paddingBottom: 20 },
    submitButton: { backgroundColor: '#24BF94', padding: 16, borderRadius: 30, alignItems: 'center' },
    submitButtonDisabled: { backgroundColor: '#CCC' },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});