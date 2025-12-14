import { StyleSheet, View, Image, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { questionService, QuestionCreate, QuestionResponse, answerService, AnswerCreate } from "../../services/quizApi";

interface QuestionWithAnswer extends QuestionResponse {
    correctAnswer: string;
}

export default function CreateQuestions() {
    const [questions, setQuestions] = useState<QuestionWithAnswer[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        question: "",
        answer: ""
    });
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const router = useRouter();
    const params = useLocalSearchParams();
    const selectedCategory = params.category as string || "Futebol";

    useEffect(() => {
        loadUserRole();
        loadQuestions();
    }, []);

    const loadUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem("user_role");
            setUserRole(role);
        } catch (error) {
            console.error("Erro ao carregar role do usuário:", error);
        }
    };

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const existingQuestions = await questionService.getQuestions();

            const questionsWithAnswers = await Promise.all(
                existingQuestions.map(async (question) => {
                    try {
                        const answers = await answerService.getAnswersByQuestion(question.id);
                        const correctAnswer = answers.find(answer => answer.correct)?.text || ""; 
                        return {
                            ...question,
                            correctAnswer
                        } as QuestionWithAnswer;
                    } catch (error) {
                        console.error(`Erro ao carregar respostas da pergunta ${question.id}:`, error);
                        return {
                            ...question,
                            correctAnswer: ""
                        } as QuestionWithAnswer;
                    }
                })
            );

            setQuestions(questionsWithAnswers);
        } catch (error) {
            console.error("Erro ao carregar perguntas:", error);
            Alert.alert("Erro", "Não foi possível carregar as perguntas existentes");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
    };

    const handleAddQuestion = () => {
        setModalVisible(true);
    };

    const handleSaveNewQuestion = async () => {
        if (newQuestion.question.trim() === "" || newQuestion.answer.trim() === "") {
            Alert.alert("Atenção", "Preencha tanto a pergunta quanto a resposta!");
            return;
        }

        try {
            setLoading(true);

            // 1. Criar pergunta
            const questionData: QuestionCreate = {
                statement: newQuestion.question,
                topic: selectedCategory,
                difficulty: "medium"
            };

            console.log("Criando pergunta...");
            const createdQuestion = await questionService.createQuestion(questionData);
            console.log("Pergunta criada:", createdQuestion.id);

            const answerData: AnswerCreate = {
                questionId: createdQuestion.id, 
                text: newQuestion.answer,
                correct: true
            };

            console.log("Enviando resposta...");
            await answerService.createAnswer(answerData);
            console.log("Resposta criada com sucesso!");

            await loadQuestions();
            setNewQuestion({ question: "", answer: "" });
            setModalVisible(false);

            Alert.alert("Sucesso", "Pergunta e resposta criadas com sucesso!");

        } catch (error: any) {
            console.error("Erro:", error);
            Alert.alert("Erro", error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = () => {
        Alert.alert("Sucesso", "Todas as perguntas foram salvas!");
        router.back();
    };

    const updateQuestion = async (id: string, field: string, value: string) => {
        try {
            if (field === 'statement') {
                await questionService.updateQuestion(id, { statement: value });

                setQuestions(prev =>
                    prev.map(q => q.id === id ? { ...q, statement: value } : q)
                );
            }
        } catch (error) {
            console.error("Erro ao atualizar pergunta:", error);
            Alert.alert("Erro", "Não foi possível atualizar a pergunta");
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>

                <View style={styles.logoContent}>
                    <Image
                        source={require('../../assets/images/LogoBG.png')}
                        style={styles.loginLogo}
                    />
                    <Text style={styles.title}>FUTQUIZ</Text>
                </View>

                <View style={styles.headerBar}>
                    <TouchableOpacity onPress={handleBack}>
                        <Image
                            source={require('../../assets/images/arrow-left.png')}
                            style={styles.editIcon}
                        />
                    </TouchableOpacity>
                    <Text style={styles.subtitle}>Criar perguntas</Text>
                    {userRole === "admin" && (
                        <TouchableOpacity onPress={handleAddQuestion} disabled={loading}>
                            <Image
                                source={require('../../assets/images/plus-square.png')}
                                style={[styles.editIcon, loading && { opacity: 0.5 }]}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView style={styles.scrollcontent}>
                    <View style={styles.questionsContainer}>
                        {loading && questions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>Carregando perguntas...</Text>
                            </View>
                        ) : questions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    Nenhuma pergunta criada ainda.{"\n"}
                                    Clique no + para adicionar a primeira pergunta!
                                </Text>

                            </View>
                        ) : (

                            questions.map((item, index) => (
                                <View key={item.id} style={styles.questionCard}>
                                    <View style={styles.questionHeader}>
                                        <Text style={styles.questionCategory}>{item.topic}</Text>
                                        <Text style={styles.questionNumber}>Pergunta {index + 1}</Text>
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Pergunta</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={item.statement}
                                            onChangeText={(text) => updateQuestion(item.id, 'statement', text)}
                                            placeholder="Digite a pergunta..."
                                        />
                                    </View>

                                    <View style={styles.inputContainer}>
                                        <Text style={styles.inputLabel}>Resposta Correta</Text>
                                        <Text style={styles.answerText}>{item.correctAnswer}</Text>
                                    </View>
                                </View>
                            ))

                        )}
                    </View>

                    {questions.length > 0 && userRole === "admin" && (
                        <TouchableOpacity
                            style={[styles.saveButton, loading && { opacity: 0.5 }]}
                            onPress={handleSaveAll}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>
                                {loading ? "Salvando..." : "Salvar Todas"}
                            </Text>
                        </TouchableOpacity>

                    )}

                </ScrollView>

            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => !loading && setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nova Pergunta - {selectedCategory}</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Pergunta</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newQuestion.question}
                                onChangeText={(text) => setNewQuestion({ ...newQuestion, question: text })}
                                placeholder="Digite a pergunta..."
                                multiline
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Resposta</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newQuestion.answer}
                                onChangeText={(text) => setNewQuestion({ ...newQuestion, answer: text })}
                                placeholder="Digite a resposta..."
                                multiline
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.cancelButton, loading && { opacity: 0.5 }]}
                                onPress={() => setModalVisible(false)}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.confirmButton, loading && { opacity: 0.5 }]}
                                onPress={handleSaveNewQuestion}
                                disabled={loading}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {loading ? "Criando..." : "Criar"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f1f1f1',
        alignItems: "center",
    },

    content: {
        flex: 1,
        width: "100%",
        alignItems: "center"
    },

    logoContent: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 60,
    },

    loginLogo: {
        width: 35,
        height: 35,
        marginRight: 10,
    },

    title: {
        fontFamily: 'Rubik',
        fontSize: 25,
        fontWeight: 500,
    },

    headerBar: {
        width: "90%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 25,
    },

    subtitle: {
        fontFamily: "Rubik",
        fontSize: 24,
        fontWeight: 500,
    },

    editIcon: {
        width: 25,
        height: 25,
    },

    scrollcontent: {
        width: "100%",
        marginTop: 10,
    },

    questionsContainer: {
        width: "90%",
        alignSelf: "center",
        marginBottom: 30,
    },

    emptyState: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 40,
        alignItems: "center",
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    emptyStateText: {
        fontFamily: "Rubik",
        fontSize: 16,
        color: "#777",
        textAlign: "center",
        lineHeight: 24,
    },

    questionCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },

    questionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },

    questionCategory: {
        fontFamily: "Rubik",
        fontSize: 16,
        fontWeight: "500",
        color: "#24bf94",
    },

    questionNumber: {
        fontFamily: "Rubik",
        fontSize: 14,
        color: "#777",
    },

    answerText: {
        fontFamily: "Rubik",
        fontSize: 16,
        color: "#333",
        padding: 12,
        backgroundColor: "#F8F8F8",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

    inputContainer: {
        marginBottom: 15,
    },

    inputLabel: {
        fontFamily: "Rubik",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 8,
        color: "#333",
    },

    textInput: {
        backgroundColor: "#F8F8F8",
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 8,
        padding: 12,
        fontFamily: "Rubik",
        fontSize: 16,
    },

    saveButton: {
        width: "40%",
        alignSelf: "center",
        backgroundColor: "#24bf94",
        borderRadius: 12,
        padding: 15,
        alignItems: "center",
        marginBottom: 30,
    },

    saveButtonText: {
        fontFamily: "Rubik",
        fontSize: 18,
        fontWeight: "500",
        color: "#FFF",
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },

    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },

    modalTitle: {
        fontFamily: "Rubik",
        fontSize: 20,
        fontWeight: "500",
        marginBottom: 20,
        textAlign: "center",
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },

    cancelButton: {
        backgroundColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
    },

    cancelButtonText: {
        fontFamily: "Rubik",
        fontSize: 16,
        color: '#333',
        fontWeight: "500",
    },

    confirmButton: {
        backgroundColor: '#24bf94',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        flex: 1,
        marginLeft: 10,
    },

    confirmButtonText: {
        fontFamily: "Rubik",
        fontSize: 16,
        color: '#FFF',
        fontWeight: "500",
    },
});