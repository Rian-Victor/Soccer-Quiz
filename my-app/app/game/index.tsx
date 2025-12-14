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
    QuestionWithAnswers,
    SubmitAnswerResponse 
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
    
    // Timer total do quiz (em segundos)
    const [totalTimer, setTotalTimer] = useState(0);
    const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());
    
    // Timer por pergunta (15 segundos)
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

    // Armazenar respostas localmente antes de submeter
    const [localAnswers, setLocalAnswers] = useState<Map<string, {
        questionId: string;
        answerId: string;
        timeTaken: number;
        timestamp: number;
    }>>(new Map());

    // Índice local para navegação
    const [localQuestionIndex, setLocalQuestionIndex] = useState<number>(0);

    const questionTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const totalTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadUserRole();
        iniciarJogo();
        return () => {
            if (questionTimerIntervalRef.current) {
                clearInterval(questionTimerIntervalRef.current);
            }
            if (totalTimerIntervalRef.current) {
                clearInterval(totalTimerIntervalRef.current);
            }
        };
    }, []);

    const loadUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem("user_role");
            setUserRole(role);
        } catch (error) {
            console.error("Erro ao carregar role do usuário:", error);
        }
    };

    // Timer total do quiz
    useEffect(() => {
        if (!quizFinished && currentQuiz && !loading) {
            totalTimerIntervalRef.current = setInterval(() => {
                setTotalTimer((prev) => prev + 1);
            }, 1000);
        } else {
            if (totalTimerIntervalRef.current) {
                clearInterval(totalTimerIntervalRef.current);
            }
        }
        return () => {
            if (totalTimerIntervalRef.current) {
                clearInterval(totalTimerIntervalRef.current);
            }
        };
    }, [quizFinished, currentQuiz, loading]);

    // Timer por pergunta (15 segundos)
    useEffect(() => {
        if (isActive && questionTimer > 0 && gameState === 'playing') {
            questionTimerIntervalRef.current = setInterval(() => {
                setQuestionTimer((prev) => prev - 1);
            }, 1000);
        } else if (questionTimer === 0 && gameState === 'playing') {
            setIsActive(false);
            handleTempoEsgotado();
        } else {
            if (questionTimerIntervalRef.current) {
                clearInterval(questionTimerIntervalRef.current);
            }
        }
        return () => {
            if (questionTimerIntervalRef.current) {
                clearInterval(questionTimerIntervalRef.current);
            }
        };
    }, [isActive, questionTimer, gameState]);

    // Carregar pergunta quando índice muda
    useEffect(() => {
        if (currentQuiz && !quizFinished && currentQuestion === null) {
            loadCurrentQuestion();
        }
    }, [localQuestionIndex, currentQuiz]);

    // Inicializar índice quando quiz é carregado
    useEffect(() => {
        if (currentQuiz) {
            setLocalQuestionIndex(currentQuiz.current_question_index);
        }
    }, [currentQuiz?.id]);

    const iniciarJogo = async () => {
        try {
            setLoading(true);
            
            // Primeiro, tentar buscar quiz ativo
            try {
                const activeQuiz = await gameplayService.getCurrentQuiz();
                if (activeQuiz) {
                    console.log("Quiz ativo encontrado, continuando de onde parou");
                    setCurrentQuiz(activeQuiz);
                    setQuizStartTime(Date.now());
                    await loadCurrentQuestion();
                    return;
                }
            } catch (error: any) {
                if (error.is404 || (error.message && error.message.includes("404"))) {
                    console.log("Nenhum quiz ativo encontrado, iniciando novo quiz");
                } else {
                    console.warn("Erro ao verificar quiz ativo:", error);
                }
            }
            
            // Se não há quiz ativo, iniciar novo
            const response = await gameplayService.startQuiz(quizId);
            setCurrentQuiz(response.quiz);
            setQuizStartTime(Date.now());
            await loadCurrentQuestion();
        } catch (error: any) {
            console.error("Erro ao iniciar quiz:", error);
            
            if (error.message && error.message.includes("quiz ativo")) {
                Alert.alert(
                    "Quiz Ativo",
                    "Você já possui um quiz em andamento. Deseja continuar de onde parou?",
                    [
                        {
                            text: "Cancelar",
                            style: "cancel",
                            onPress: () => router.back(),
                        },
                        {
                            text: "Continuar",
                            onPress: async () => {
                                try {
                                    const activeQuiz = await gameplayService.getCurrentQuiz();
                                    if (activeQuiz) {
                                        setCurrentQuiz(activeQuiz);
                                        setQuizStartTime(Date.now());
                                        await loadCurrentQuestion();
                                    }
                                } catch (err: any) {
                                    Alert.alert("Erro", "Não foi possível carregar o quiz ativo", [
                                        { text: "OK", onPress: () => router.back() },
                                    ]);
                                }
                            },
                        },
                    ]
                );
            } else {
                Alert.alert("Erro", error.message || "Não foi possível iniciar o quiz", [
                    { text: "OK", onPress: () => router.back() },
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadCurrentQuestion = async () => {
        if (!currentQuiz) {
            console.warn("Tentando carregar pergunta sem quiz ativo");
            return;
        }

        if (localQuestionIndex >= currentQuiz.questions.length) {
            console.log("Quiz finalizado - todas as perguntas foram respondidas");
            finishQuiz();
            return;
        }

        const questionId = currentQuiz.questions[localQuestionIndex];
        if (!questionId) {
            console.error("Question ID não encontrado no índice:", localQuestionIndex);
            return;
        }

        try {
            setLoading(true);
            console.log(`Carregando pergunta ${localQuestionIndex + 1}/${currentQuiz.questions.length} (ID: ${questionId})`);
            const question = await gameplayService.getQuestionWithAnswers(questionId);
            setCurrentQuestion(question);
            setQuestionStartTime(Date.now());
            setQuestionTimer(15);
            setIsActive(true);
            setGameState('playing');
            setResultData(null);
            
            // Verificar se já temos resposta local para esta pergunta
            const existingAnswer = localAnswers.get(questionId);
            if (existingAnswer) {
                setSelectedAnswer(existingAnswer.answerId);
            } else {
                setSelectedAnswer(null);
            }
            
            console.log("Pergunta carregada com sucesso");
        } catch (error: any) {
            console.error("Erro ao carregar pergunta:", error);
            Alert.alert("Erro", "Não foi possível carregar a pergunta", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleTempoEsgotado = () => {
        Alert.alert("Tempo Esgotado!", "Que pena, acabou o tempo para esta pergunta.", [
            { text: "Continuar", onPress: () => handleResponder(true) }
        ]);
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

            // Armazenar resposta localmente
            const newAnswers = new Map(localAnswers);
            newAnswers.set(currentQuestion.id, {
                questionId: currentQuestion.id,
                answerId: respostaEnviar,
                timeTaken: tempoGasto,
                timestamp: Date.now(),
            });
            setLocalAnswers(newAnswers);

            console.log("Resposta armazenada localmente:", {
                questionId: currentQuestion.id,
                answerId: respostaEnviar,
                timeTaken: tempoGasto,
                totalArmazenadas: newAnswers.size,
            });

            // Buscar resposta correta para feedback visual
            const correctAnswer = currentQuestion.answers.find(a => a.correct);
            const isCorrect = correctAnswer && respostaEnviar === correctAnswer.id;

            setResultData({
                correct: isCorrect || false,
                correctId: correctAnswer?.id || ""
            });

            // Avançar para próxima pergunta após feedback
            setTimeout(() => {
                const nextIndex = localQuestionIndex + 1;
                
                if (nextIndex >= currentQuiz.questions.length) {
                    // Última pergunta respondida, finalizar quiz
                    console.log("Última pergunta respondida, finalizando quiz...");
                    finishQuiz();
                } else {
                    // Avançar para próxima pergunta
                    setLocalQuestionIndex(nextIndex);
                    setCurrentQuestion(null);
                    setSelectedAnswer(null);
                    setSubmitting(false);
                }
            }, 2000);

        } catch (error: any) {
            console.error("Erro ao processar resposta:", error);
            Alert.alert("Atenção", "Erro ao processar resposta. Tente novamente.");
            setGameState('playing');
            setSubmitting(false);
            setIsActive(true);
        }
    };

    const submitAllAnswers = async () => {
        if (!currentQuiz || localAnswers.size === 0) {
            console.warn("Nenhuma resposta para submeter");
            return null;
        }

        try {
            setSubmitting(true);
            console.log(`Submetendo ${localAnswers.size} respostas...`);

            const startIndex = currentQuiz.current_question_index;
            const answersArray = Array.from(localAnswers.values());
            
            const questionsToSubmit = currentQuiz.questions.slice(startIndex);
            const orderedAnswers = questionsToSubmit
                .map((questionId) => answersArray.find((a) => a.questionId === questionId))
                .filter((answer) => answer !== undefined) as Array<{
                    questionId: string;
                    answerId: string;
                    timeTaken: number;
                    timestamp: number;
                }>;

            console.log(`Submetendo ${orderedAnswers.length} respostas a partir do índice ${startIndex}`);

            let finalResponse: SubmitAnswerResponse | null = null;
            let submittedCount = 0;
            let currentQuizState = currentQuiz;
            
            for (const answer of orderedAnswers) {
                try {
                    if (submittedCount > 0) {
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    }
                    
                    const response = await gameplayService.submitAnswer(
                        currentQuizState.id,
                        answer.questionId,
                        answer.answerId,
                        answer.timeTaken
                    );
                    finalResponse = response;
                    submittedCount++;
                    console.log(`Resposta ${answer.questionId} submetida com sucesso (${submittedCount}/${orderedAnswers.length})`);
                    
                    currentQuizState = {
                        ...currentQuizState,
                        current_question_index: response.current_question_index,
                        total_points: response.total_points,
                        correct_answers: response.correct_answers,
                        wrong_answers: response.wrong_answers,
                    };
                    setCurrentQuiz(currentQuizState);
                } catch (error: any) {
                    console.error(`Erro ao submeter resposta ${answer.questionId}:`, error);
                    if (error.message && error.message.includes("fora de ordem")) {
                        console.warn(`Resposta ${answer.questionId} pode já ter sido submetida, continuando...`);
                        currentQuizState = {
                            ...currentQuizState,
                            current_question_index: currentQuizState.current_question_index + 1,
                        };
                        continue;
                    }
                }
            }

            console.log(`Total de respostas submetidas: ${submittedCount}/${orderedAnswers.length}`);
            return finalResponse;
        } catch (error: any) {
            console.error("Erro ao submeter respostas:", error);
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    const finishQuiz = async () => {
        if (!currentQuiz) return;
        
        setQuizFinished(true);
        setIsActive(false);
        if (questionTimerIntervalRef.current) {
            clearInterval(questionTimerIntervalRef.current);
        }
        if (totalTimerIntervalRef.current) {
            clearInterval(totalTimerIntervalRef.current);
        }

        try {
            const finalResponse = await submitAllAnswers();
            
            if (finalResponse) {
                setResult({
                    totalPoints: finalResponse.total_points,
                    correctAnswers: finalResponse.correct_answers,
                    wrongAnswers: finalResponse.wrong_answers,
                    totalTime: totalTimer,
                });
            } else {
                setResult({
                    totalPoints: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    totalTime: totalTimer,
                });
                Alert.alert(
                    "Aviso",
                    "Não foi possível calcular a pontuação final. Algumas respostas podem não ter sido salvas."
                );
            }
        } catch (error: any) {
            console.error("Erro ao finalizar quiz:", error);
            Alert.alert(
                "Erro",
                "Não foi possível finalizar o quiz completamente. Tente novamente."
            );
        }
    };

    const getRedirectPath = () => {
        return userRole === "admin" ? "/(tabs)/quizzes" : "/(tabs)/home";
    };

    const handleAbandonQuiz = async () => {
        Alert.alert(
            "Abandonar Quiz",
            localAnswers.size > 0
                ? `Você respondeu ${localAnswers.size} pergunta(s). Deseja salvar essas respostas antes de abandonar?`
                : "Tem certeza que deseja abandonar este quiz?",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Salvar e Abandonar",
                    style: "default",
                    onPress: async () => {
                        if (!currentQuiz) return;
                        try {
                            if (localAnswers.size > 0) {
                                await submitAllAnswers();
                            }
                            await gameplayService.abandonQuiz(currentQuiz.id);
                            Alert.alert("Quiz Abandonado", "Suas respostas foram salvas", [
                                { text: "OK", onPress: () => router.push(getRedirectPath()) },
                            ]);
                        } catch (error: any) {
                            console.error("Erro ao abandonar quiz:", error);
                            Alert.alert("Erro", "Não foi possível abandonar o quiz");
                        }
                    },
                },
                {
                    text: "Abandonar Sem Salvar",
                    style: "destructive",
                    onPress: async () => {
                        if (!currentQuiz) return;
                        try {
                            await gameplayService.abandonQuiz(currentQuiz.id);
                            Alert.alert("Quiz Abandonado", "Você abandonou o quiz", [
                                { text: "OK", onPress: () => router.push(getRedirectPath()) },
                            ]);
                        } catch (error: any) {
                            console.error("Erro ao abandonar quiz:", error);
                            Alert.alert("Erro", "Não foi possível abandonar o quiz");
                        }
                    },
                },
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
                <Text style={{ marginTop: 10, color: '#555' }}>Iniciando quiz...</Text>
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
                        onPress={() => router.push(getRedirectPath())}
                    >
                        <Text style={styles.backButtonText}>
                            {userRole === "admin" ? "Voltar para Quizzes" : "Voltar para Home"}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    if (!currentQuiz || !currentQuestion) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#24BF94" />
                <Text style={{ marginTop: 10, color: '#555' }}>Carregando pergunta...</Text>
            </View>
        );
    }

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

            {/* TIMER POR PERGUNTA */}
            <View style={styles.timerContainer}>
                <View style={[styles.timerCircle, questionTimer < 5 && styles.timerCircleRed]}>
                    <Text style={[styles.timerText, questionTimer < 5 && { color: '#FF3B30' }]}>
                        {questionTimer}
                    </Text>
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
                        <Text style={styles.submittingText}>Salvando respostas...</Text>
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
                        {submitting ? "Processando..." : currentQuestionNumber === totalQuestions ? "Finalizar" : "Enviar"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F3F4' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingHorizontal: 20, 
        paddingTop: 10, 
        alignItems: 'center' 
    },
    progressText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    totalTimerContainer: {
        backgroundColor: '#24BF94',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    totalTimerText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#FFF',
    },

    timerContainer: { alignItems: 'center', marginTop: 10, marginBottom: 10 },
    timerCircle: { 
        width: 55, 
        height: 55, 
        borderRadius: 30, 
        borderWidth: 4, 
        borderColor: '#24BF94', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: 'white' 
    },
    timerCircleRed: { borderColor: '#FF3B30' },
    timerText: { fontSize: 18, fontWeight: 'bold', color: '#24BF94' },

    scrollView: { flex: 1 },
    scrollContent: { paddingBottom: 20 },

    questionCard: { 
        backgroundColor: 'white', 
        marginHorizontal: 20, 
        padding: 30, 
        borderRadius: 20, 
        marginBottom: 20, 
        elevation: 2, 
        shadowColor: '#000', 
        shadowOpacity: 0.1, 
        shadowRadius: 5 
    },
    questionText: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center', lineHeight: 24 },

    optionsContainer: { paddingHorizontal: 20, marginBottom: 20 },

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
    optionText: { fontSize: 16, color: '#333', fontWeight: '500', flex: 1, marginRight: 10 },

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

    submittingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    submittingText: {
        fontSize: 14,
        color: '#24BF94',
        marginLeft: 10,
    },

    footer: { padding: 20, paddingBottom: 20 },
    submitButton: { backgroundColor: '#24BF94', padding: 16, borderRadius: 30, alignItems: 'center' },
    submitButtonDisabled: { backgroundColor: '#CCC' },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

    resultContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    resultTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
    },
    resultCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    resultLabel: {
        fontSize: 14,
        color: '#777',
        marginBottom: 5,
    },
    resultValue: {
        fontSize: 24,
        fontWeight: '600',
        color: '#24BF94',
    },
    backButton: {
        backgroundColor: '#24BF94',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#FFF',
    },
});
