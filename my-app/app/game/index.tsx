import React, { useEffect, useState, useRef } from 'react';
import {
    StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    gameplayService,
    QuizSession,
    QuestionWithAnswers
} from '../../services/quizApi';
import { Feather } from '@expo/vector-icons';

export default function GameScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const quizId = params.quizId as string;

    const [loading, setLoading] = useState(true);
    const [currentQuiz, setCurrentQuiz] = useState<QuizSession | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionWithAnswers | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

    const [totalTimer, setTotalTimer] = useState(0);
    const [questionTimer, setQuestionTimer] = useState(15);
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [isActive, setIsActive] = useState(false);

    const [gameState, setGameState] = useState<'playing' | 'feedback'>('playing');
    const [resultData, setResultData] = useState<{ correct: boolean, correctId: string } | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [quizFinished, setQuizFinished] = useState(false);
    
    const [result, setResult] = useState<{
        totalPoints: number;
        correctAnswers: number;
        wrongAnswers: number;
        totalTime: number;
    } | null>(null);
    
    const [userRole, setUserRole] = useState<string | null>(null);
    const [localQuestionIndex, setLocalQuestionIndex] = useState<number>(0);

    const answersRef = useRef<any[]>([]); 
    const scoreAccumulatorRef = useRef(0); 
    const correctCountRef = useRef(0);     
    const wrongCountRef = useRef(0);       

    const questionTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const totalTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadUserRole();
        iniciarJogo();
        return () => limparTimers();
    }, []);

    const limparTimers = () => {
        if (questionTimerIntervalRef.current) clearInterval(questionTimerIntervalRef.current);
        if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
    };

    const loadUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem("user_role");
            setUserRole(role);
        } catch (error) { console.error(error); }
    };

    useEffect(() => {
        if (!quizFinished && currentQuiz && !loading) {
            totalTimerIntervalRef.current = setInterval(() => setTotalTimer((p) => p + 1), 1000);
        } else {
            if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);
        }
        return () => { if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current); };
    }, [quizFinished, currentQuiz, loading]);

    useEffect(() => {
        if (isActive && questionTimer > 0 && gameState === 'playing') {
            questionTimerIntervalRef.current = setInterval(() => setQuestionTimer((p) => p - 1), 1000);
        } else if (questionTimer === 0 && gameState === 'playing') {
            setIsActive(false);
        } else {
            if (questionTimerIntervalRef.current) clearInterval(questionTimerIntervalRef.current);
        }
        return () => { if (questionTimerIntervalRef.current) clearInterval(questionTimerIntervalRef.current); };
    }, [isActive, questionTimer, gameState]);

    useEffect(() => {
        if (currentQuiz && !quizFinished && currentQuestion === null) {
            loadCurrentQuestion();
        }
    }, [localQuestionIndex, currentQuiz]);

    useEffect(() => {
        if (currentQuiz) {
            setLocalQuestionIndex(currentQuiz.current_question_index);
        }
    }, [currentQuiz?.id]);

    const iniciarJogo = async () => {
        try {
            setLoading(true);
            scoreAccumulatorRef.current = 0;
            correctCountRef.current = 0;
            wrongCountRef.current = 0;
            answersRef.current = [];

            try {
                const activeQuiz = await gameplayService.getCurrentQuiz();
                if (activeQuiz) {
                    setCurrentQuiz(activeQuiz);
                    setQuestionStartTime(Date.now());
                    await loadCurrentQuestion();
                    return;
                }
            } catch (e) {}

            const response = await gameplayService.startQuiz(quizId);
            setCurrentQuiz(response.quiz);
            setQuestionStartTime(Date.now());
            await loadCurrentQuestion();
        } catch (error) {
            Alert.alert("Erro", "Erro ao iniciar quiz");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentQuestion = async () => {
        if (!currentQuiz) return;
        if (localQuestionIndex >= currentQuiz.questions.length) {
            finishQuiz();
            return;
        }
        const questionId = currentQuiz.questions[localQuestionIndex];
        if (!questionId) return;

        try {
            setLoading(true);
            const question = await gameplayService.getQuestionWithAnswers(questionId);
            setCurrentQuestion(question);
            setQuestionStartTime(Date.now());
            setQuestionTimer(15);
            setIsActive(true);
            setGameState('playing');
            setResultData(null);
            
            const existing = answersRef.current.find(a => a.questionId === questionId);
            setSelectedAnswer(existing ? existing.answerId : null);
        } catch (error) {
            Alert.alert("Erro", "Falha ao carregar pergunta");
        } finally {
            setLoading(false);
        }
    };

    const handleResponder = async (tempoEsgotado = false) => {
        if (submitting) return;
        if (!selectedAnswer && !tempoEsgotado) return;
        if (!currentQuiz || !currentQuestion) return;

        setSubmitting(true);
        setIsActive(false);
        setGameState('feedback');

        try {
            const tempoGasto = tempoEsgotado ? 15 : Math.floor((Date.now() - questionStartTime) / 1000);
            const respostaEnviar = selectedAnswer || "tempo_esgotado";

            const correctAnswer = currentQuestion.answers.find(a => a.correct);
            const isCorrect = correctAnswer && respostaEnviar === correctAnswer.id;

            let pointsNestaQuestao = 0;
            
            if (isCorrect) {
                pointsNestaQuestao = 100; 
                if (tempoGasto < 5) {
                    pointsNestaQuestao += 50; 
                }
                correctCountRef.current += 1;
            } else {
                wrongCountRef.current += 1;
            }

            scoreAccumulatorRef.current += pointsNestaQuestao;

            console.log(`📝 Questão respondida. 
                Pontos Ganhos: ${pointsNestaQuestao} 
                TOTAL ACUMULADO ATÉ AGORA: ${scoreAccumulatorRef.current}
                Acertos: ${correctCountRef.current} | Erros: ${wrongCountRef.current}
            `);

            // Usa o questionId do array de questões do quiz, não o id do objeto question
            const currentQuestionId = currentQuiz.questions[localQuestionIndex];
            
            console.log("💾 Salvando resposta:", {
                localQuestionIndex,
                currentQuestionId,
                currentQuestionIdFromObject: currentQuestion.id,
                answerId: respostaEnviar,
                timeTaken: tempoGasto
            });
            
            answersRef.current.push({
                questionId: currentQuestionId, // Usa o ID do array de questões
                answerId: respostaEnviar,
                timeTaken: tempoGasto,
                points: pointsNestaQuestao 
            });
            
            console.log("📝 answersRef atualizado, total:", answersRef.current.length);

            setResultData({
                correct: !!isCorrect,
                correctId: correctAnswer?.id || ""
            });

            setTimeout(() => {
                const nextIndex = localQuestionIndex + 1;
                if (nextIndex >= currentQuiz.questions.length) {
                    finishQuiz();
                } else {
                    setLocalQuestionIndex(nextIndex);
                    setCurrentQuestion(null);
                    setSelectedAnswer(null);
                    setSubmitting(false);
                }
            }, 2000);

        } catch (error) {
            console.error(error);
            setGameState('playing');
            setSubmitting(false);
            setIsActive(true);
        }
    };

    const submitAllAnswers = async () => {
        console.log("🔄 submitAllAnswers chamado");
        console.log("📊 currentQuiz:", currentQuiz?.id);
        console.log("📝 answersRef.current.length:", answersRef.current.length);
        console.log("📝 answersRef.current:", answersRef.current);
        
        if (!currentQuiz) {
            console.error("❌ currentQuiz é null");
            return;
        }
        
        if (answersRef.current.length === 0) {
            console.error("❌ Nenhuma resposta para enviar");
            return;
        }

        try {
            setSubmitting(true);
            console.log("✅ Iniciando envio de respostas...");
            
            // Envia todas as respostas na ordem correta das questões do quiz
            console.log("🔍 Comparando questões do quiz com respostas:");
            console.log("Quiz questions:", currentQuiz.questions);
            console.log("Respostas salvas:", answersRef.current.map(a => a.questionId));
            
            const orderedAnswers = currentQuiz.questions
                .map((qId) => {
                    const answer = answersRef.current.find((a) => a.questionId === qId);
                    if (!answer) {
                        console.warn(`⚠️ Resposta não encontrada para questão ${qId}`);
                    }
                    return answer;
                })
                .filter((a) => a !== undefined);

            console.log(`📤 Enviando ${orderedAnswers.length} respostas de ${currentQuiz.questions.length} questões...`);

            if (orderedAnswers.length === 0) {
                console.error("❌ Nenhuma resposta encontrada para as questões do quiz");
                return;
            }

            let currentQuizState = currentQuiz;

            for (let i = 0; i < orderedAnswers.length; i++) {
                const answer = orderedAnswers[i];
                if (!answer) {
                    console.warn(`⚠️ Resposta ${i + 1} não encontrada, pulando...`);
                    continue;
                }
                
                try {
                    console.log(`📤 Enviando resposta ${i + 1}/${orderedAnswers.length}:`, {
                        sessionId: currentQuizState.id,
                        questionId: answer.questionId,
                        answerId: answer.answerId,
                        timeTaken: answer.timeTaken
                    });
                    
                    const response = await gameplayService.submitAnswer(
                        currentQuizState.id,
                        answer.questionId,
                        answer.answerId,
                        answer.timeTaken
                    );
                    
                    console.log(`✅ Resposta ${i + 1} enviada com sucesso:`, response);
                    
                    // Atualiza o estado do quiz com a resposta do backend
                    currentQuizState = {
                        ...currentQuizState,
                        current_question_index: response.current_question_index || currentQuizState.current_question_index + 1,
                        total_points: response.new_total_points || currentQuizState.total_points
                    };
                    
                    // Se o quiz foi finalizado (is_quiz_finished = true), para de enviar
                    if (response.is_quiz_finished) {
                        console.log("🏁 Quiz finalizado no backend!");
                        break;
                    }
                } catch (error: any) {
                    console.error(`❌ Erro ao enviar resposta ${i + 1}:`, error);
                    console.error("Detalhes do erro:", error.message);
                    if (error.response) {
                        console.error("Status:", error.response.status);
                        console.error("Data:", error.response.data);
                    }
                    // Continua tentando enviar as outras respostas mesmo se uma falhar
                }
            }
            
            console.log("✅ Todas as respostas processadas");
        } catch (error: any) {
            console.error("❌ Erro geral no envio:", error);
            console.error("Detalhes do erro:", error.message);
            if (error.response) {
                console.error("Status:", error.response.status);
                console.error("Data:", error.response.data);
            }
        } finally {
            setSubmitting(false);
        }
    };

    const finishQuiz = async () => {
        if (!currentQuiz) return;

        setQuizFinished(true);
        setIsActive(false);
        limparTimers();

        const placarFinal = {
            totalPoints: scoreAccumulatorRef.current,
            correctAnswers: correctCountRef.current,
            wrongAnswers: wrongCountRef.current,
            totalTime: totalTimer
        };

        console.log("🏁 FINALIZANDO! Placar Final:", placarFinal);
        setResult(placarFinal);

        try {
            await submitAllAnswers();
        } catch (error) {
            console.log("Erro ao salvar no backend, mas o resultado local está garantido.");
        }
    };

    const handleAbandonQuiz = () => {
        setIsActive(false);
        limparTimers();
        Alert.alert(
            "Abandonar",
            `Você já respondeu ${answersRef.current.length} perguntas.`,
            [
                { text: "Ficar", onPress: () => setIsActive(true), style: "cancel" },
                { 
                    text: "Sair", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            if(currentQuiz) await gameplayService.abandonQuiz(currentQuiz.id);
                        } catch(e) {}
                        router.push(userRole === "admin" ? "/(tabs)/quizzes" : "/(tabs)/home");
                    }
                }
            ]
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    if (loading && !currentQuestion) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#24BF94" />
                <Text style={{ marginTop: 10, color: '#555' }}>Preparando jogo...</Text>
            </View>
        );
    }

    if (quizFinished && result) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView contentContainerStyle={styles.resultContainer}>
                    <Text style={styles.resultTitle}>Quiz Finalizado!</Text>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Pontuação Total</Text>
                        <Text style={styles.resultValue}>{result.totalPoints} pontos</Text>
                    </View>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Respostas Corretas</Text>
                        <Text style={styles.resultValue}>{result.correctAnswers}</Text>
                    </View>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Respostas Erradas</Text>
                        <Text style={styles.resultValue}>{result.wrongAnswers}</Text>
                    </View>
                    <View style={styles.resultCard}>
                        <Text style={styles.resultLabel}>Tempo Total</Text>
                        <Text style={styles.resultValue}>{formatTime(result.totalTime)}</Text>
                    </View>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => router.push(userRole === "admin" ? "/(tabs)/quizzes" : "/(tabs)/home")}
                    >
                        <Text style={styles.backButtonText}>Voltar</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!currentQuiz || !currentQuestion) return <View style={styles.loadingContainer}><ActivityIndicator/></View>;

    const currentQuestionNumber = localQuestionIndex + 1;
    const totalQuestions = currentQuiz.questions.length;
    const progress = `${currentQuestionNumber}/${totalQuestions}`;
    const isButtonDisabled = !selectedAnswer || gameState === 'feedback' || submitting;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={handleAbandonQuiz}>
                    <Feather name="x" size={24} color="#004D40" />
                </TouchableOpacity>
                <Text style={styles.progressText}>{progress}</Text>
                <View style={styles.totalTimerContainer}>
                    <Text style={styles.totalTimerText}>{formatTime(totalTimer)}</Text>
                </View>
            </View>

            <View style={styles.timerContainer}>
                <View style={[styles.timerCircle, questionTimer < 5 && styles.timerCircleRed]}>
                    <Text style={[styles.timerText, questionTimer < 5 && { color: '#FF3B30' }]}>{questionTimer}</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.questionCard}>
                    <Text style={styles.questionText}>{currentQuestion.statement}</Text>
                </View>
                <View style={styles.optionsContainer}>
                    {currentQuestion.answers.map((answer) => {
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
                        } else if (gameState === 'feedback' && resultData) {
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
                            } else if (answer.id === resultData.correctId) {
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
                {submitting && (
                    <View style={styles.submittingContainer}>
                        <ActivityIndicator size="small" color="#24BF94" />
                        <Text style={styles.submittingText}>Processando...</Text>
                    </View>
                )}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitButton, isButtonDisabled && styles.submitButtonDisabled]}
                    disabled={isButtonDisabled}
                    onPress={() => handleResponder(false)}
                >
                    <Text style={styles.submitButtonText}>
                        {submitting ? "..." : currentQuestionNumber === totalQuestions ? "Finalizar" : "Enviar"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F3F4' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, alignItems: 'center' },
    progressText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalTimerContainer: { backgroundColor: '#24BF94', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
    totalTimerText: { fontSize: 12, fontWeight: '600', color: '#FFF' },
    timerContainer: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
    timerCircle: { width: 55, height: 55, borderRadius: 30, borderWidth: 4, borderColor: '#24BF94', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    timerCircleRed: { borderColor: '#FF3B30' },
    timerText: { fontSize: 18, fontWeight: 'bold', color: '#24BF94' },
    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 20 },
    questionCard: { backgroundColor: 'white', marginHorizontal: 20, padding: 30, borderRadius: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    questionText: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: 24 },
    optionsContainer: { paddingHorizontal: 20, marginBottom: 20 },
    optionButton: { backgroundColor: 'white', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 30, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
    optionText: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1, marginRight: 10 },
    optionCorrect: { backgroundColor: '#A8D5C6', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 30, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#24BF94' },
    optionWrong: { backgroundColor: '#F29898', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 30, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#D32F2F' },
    submittingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 10 },
    submittingText: { fontSize: 14, color: '#24BF94', marginLeft: 10 },
    footer: { padding: 20, paddingBottom: 20 },
    submitButton: { backgroundColor: '#24BF94', padding: 16, borderRadius: 30, alignItems: 'center' },
    submitButtonDisabled: { backgroundColor: '#CCC' },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    resultContainer: { flex: 1, padding: 20, justifyContent: 'center' },
    resultTitle: { fontSize: 28, fontWeight: '600', color: '#333', textAlign: 'center', marginBottom: 30 },
    resultCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
    resultLabel: { fontSize: 14, color: '#777', marginBottom: 5 },
    resultValue: { fontSize: 24, fontWeight: '600', color: '#24BF94' },
    backButton: { backgroundColor: '#24BF94', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
    backButtonText: { fontSize: 18, fontWeight: '500', color: '#FFF' },
});