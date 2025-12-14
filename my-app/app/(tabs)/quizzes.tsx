import { StyleSheet, View, Image, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MyQuizzes() {
    const router = useRouter();
    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        loadUserRole();
    }, []);

    const loadUserRole = async () => {
        try {
            const role = await AsyncStorage.getItem("user_role");
            setUserRole(role);
        } catch (error) {
            console.error("Erro ao carregar role do usuário:", error);
        }
    };

    const quizzes = [
        { id: "1", title: "Tipos de carros de jogadores", date: "15/06/2025", category: "Futebol" },
        { id: "2", title: "Qual a comida favorita do Messi", date: "18/08/2025", category: "Futebol" },
        { id: "3", title: "Como o Messi compra pão", date: "21/08/2025", category: "Futebol" },
        { id: "4", title: "Se Cristiano Ronaldo fosse um ator, quem seria", date: "20/09/2025", category: "Futebol" },
        { id: "5", title: "Quem são as mães dos jogadores famosos", date: "23/10/2025", category: "Futebol" },
        { id: "6", title: "Quais desses jogadores é famoso", date: "25/10/2025", category: "Futebol" },
    ];

    const handleCreateQuiz = () => {
        router.push("/(tabs)/criarquiz");
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
                    <Text style={styles.subtitle}>Seus quizzes</Text>
                    {userRole === "admin" && (
                        <TouchableOpacity onPress={handleCreateQuiz}>
                            <Image 
                                source={require('../../assets/images/edit.png')} 
                                style={styles.editIcon}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView style={styles.scrollcontent}>
                    <View style={styles.quizList}>
                        {quizzes.map((quiz) => (
                            <View key={quiz.id} style={styles.quizCard}>
                                <View style={styles.quizImg}></View>
                                <View style={styles.quizInfo}>
                                    <Text style={styles.quizTitle}>{quiz.title}</Text>
                                    <Text style={styles.quizDate}>{quiz.date}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

            </View>
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

    quizList: {
        width: "90%",
        alignSelf: "center",
    },

    quizCard: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },

    quizImg: {
        width: 55,
        height: 55,
        backgroundColor: "#D9D9D9",
        borderRadius: 8,
        marginRight: 10,
    },

    quizInfo: {
        flexShrink: 1,
    },

    quizTitle: {
        fontFamily: "Rubik",
        fontSize: 15,
        marginBottom: 4,
    },

    quizDate: {
        color: "#777",
    },

});