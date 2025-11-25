import { StyleSheet, View, Image, Text, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { questionService, QuestionCreate, QuestionResponse } from "../../services/quizApi";

export default function CreateQuestions() {
    const [questions, setQuestions] = useState<QuestionResponse[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newQuestion, setNewQuestion] = useState({
        question: "",
        answer: ""
    });
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const params = useLocalSearchParams();
    const selectedCategory = params.category as string || "Futebol";

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            const existingQuestions = await questionService.getQuestions();
            setQuestions(existingQuestions);
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
            
            const questionData: QuestionCreate = {
                statement: newQuestion.question,
                topic: selectedCategory, 
                difficulty: "medium"
            };

            const createdQuestion = await questionService.createQuestion(questionData);
            
            setQuestions(prev => [...prev, createdQuestion]);
            setNewQuestion({ question: "", answer: "" });
            setModalVisible(false);
            
            Alert.alert("Sucesso", "Pergunta criada com sucesso!");
        } catch (error) {
            console.error("Erro ao criar pergunta:", error);
            Alert.alert("Erro", "Não foi possível criar a pergunta");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelNewQuestion = () => {
        setNewQuestion({ question: "", answer: "" });
        setModalVisible(false);
    };

    const handleSaveAll = () => {
        Alert.alert("Sucesso", "Todas as perguntas foram salvas!");
        router.back();
    };

    const updateQuestion = async (id: string, field: string, value: string) => {
        try {
            const updateData = field === 'question' ? { statement: value } : {};
            
            if (Object.keys(updateData).length > 0) {
                await questionService.updateQuestion(id, updateData);
                
                setQuestions(prev => 
                    prev.map(q => q.id === id ? { ...q, [field]: value } : q)
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
                    <TouchableOpacity onPress={handleAddQuestion} disabled={loading}>
                        <Image
                            source={require('../../assets/images/plus-square.png')}
                            style={[styles.editIcon, loading && { opacity: 0.5 }]}
                        />
                    </TouchableOpacity>
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
                                        <Text style={styles.inputLabel}>Dificuldade</Text>
                                        <Text style={styles.difficultyText}>{item.difficulty}</Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </View>

                    {questions.length > 0 && (
                        <TouchableOpacity 
                            style={styles.saveButton} 
                            onPress={handleSaveAll}
                            disabled={loading}
                        >
                            <Text style={styles.saveButtonText}>
                                {loading ? "Salvando..." : "Salvar"}
                            </Text>
                        </TouchableOpacity>
                    )}

                </ScrollView>

            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCancelNewQuestion}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Nova Pergunta - {selectedCategory}</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Pergunta</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newQuestion.question}
                                onChangeText={(text) => setNewQuestion({...newQuestion, question: text})}
                                placeholder="Digite a pergunta..."
                                multiline
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Resposta</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newQuestion.answer}
                                onChangeText={(text) => setNewQuestion({...newQuestion, answer: text})}
                                placeholder="Digite a resposta..."
                                multiline
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.cancelButton]} 
                                onPress={handleCancelNewQuestion}
                                disabled={loading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.confirmButton]} 
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
    difficultyText: {
        fontFamily: "Rubik",
        fontSize: 14,
        color: "#777",
        padding: 12,
        backgroundColor: "#F8F8F8",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

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
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },

    modalButton: {
        flex: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },

    cancelButton: {
        backgroundColor: '#f1f1f1',
    },

    confirmButton: {
        backgroundColor: '#24bf94',
    },

    cancelButtonText: {
        fontFamily: "Rubik",
        fontSize: 16,
        color: '#333',
    },

    confirmButtonText: {
        fontFamily: "Rubik",
        fontSize: 16,
        color: '#FFF',
        fontWeight: "500",
    },
});