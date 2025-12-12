import { StyleSheet, View, Image, Text, TouchableOpacity, ScrollView, Modal, TextInput, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { teamService, TeamCreate, TeamResponse } from "../../services/quizApi";

interface TeamWithMembers extends TeamResponse {
    memberNames: string[];
}

export default function CreateQuiz() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [teams, setTeams] = useState<TeamWithMembers[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newTeam, setNewTeam] = useState({
        name: "",
        country: "",
        members: ""
    });
    const [loading, setLoading] = useState(false);
    const params = useLocalSearchParams();

    const categories = [
        { id: 1, name: "Futmesa" },
        { id: 2, name: "Futebol" },
        { id: 3, name: "Futsal" },
        { id: 4, name: "Futvôlei" }
    ];

    useEffect(() => {
        loadTeams();
    }, []);

    const loadTeams = async () => {
        try {
            const existingTeams = await teamService.getTeams();
            const teamsWithMemberNames = existingTeams.map(team => ({
                ...team,
                memberNames: team.members.map(member => `Usuário ${member}`)
            }));
            setTeams(teamsWithMemberNames);
        } catch (error) {
            console.error("Erro ao carregar times:", error);
        }
    };

    const handleCategoryPress = (categoryId: number) => {
        setSelectedCategory(categoryId);
    };

    const router = useRouter();

    const handleBack = () => {
        router.push("/(tabs)/quizzes");
    };

    const handleCriarPergunta = () => {
        if (!selectedCategory) {
            alert("Selecione uma categoria primeiro!");
            return;
        }

        const selectedCategoryName = categories.find(cat => cat.id === selectedCategory)?.name || "Futebol";

        router.push({
            pathname: "/(tabs)/criarpergunta",
            params: {
                category: selectedCategoryName,
                categoryId: selectedCategory.toString()
            }
        });
    };

    const handleAvançar = () => {
        setModalVisible(true);
    };

    const handleCreateTeam = async () => {
        if (newTeam.name.trim() === "" || newTeam.country.trim() === "") {
            Alert.alert("Atenção", "Preencha o nome e país do time!");
            return;
        }

        try {
            setLoading(true);

            const membersArray = newTeam.members
                .split(',')
                .map(member => member.trim())
                .filter(member => member !== '')
                .map(member => parseInt(member) || 0);

            const teamData: TeamCreate = {
                name: newTeam.name,
                country: newTeam.country,
                members: membersArray
            };

            console.log("Criando time:", teamData);
            await teamService.createTeam(teamData);
            
            await loadTeams();
            
            setNewTeam({ name: "", country: "", members: "" });
            setModalVisible(false);
            
            Alert.alert("Sucesso", "Time criado com sucesso!");

        } catch (error: any) {
            console.error("Erro ao criar time:", error);
            Alert.alert("Erro", `Não foi possível criar o time: ${error.message}`);
        } finally {
            setLoading(false);
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
                    <Text style={styles.subtitle}>Criar quiz</Text>
                    <TouchableOpacity onPress={handleCriarPergunta}>
                        <Image
                            source={require('../../assets/images/plus-square.png')}
                            style={styles.editIcon}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollcontent}>

                    <View style={styles.categoriesSection}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.horizontalScroll}
                        >
                            <View style={styles.categoriesContainer}>
                                {categories.map((category) => (
                                    <TouchableOpacity
                                        key={category.id}
                                        style={[
                                            styles.categoryCard,
                                            selectedCategory === category.id && styles.categoryCardSelected
                                        ]}
                                        onPress={() => handleCategoryPress(category.id)}
                                    >
                                        <Text style={[
                                            styles.categoryTitle,
                                            selectedCategory === category.id && styles.categoryTitleSelected
                                        ]}>
                                            {category.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    <View style={styles.teamsSection}>
                        {teams.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>
                                    Nenhum time criado ainda.{"\n"}
                                    Clique em "Avançar" para criar o primeiro time!
                                </Text>
                            </View>
                        ) : (
                            teams.map((team, index) => (
                                <View key={team.id} style={styles.teamContainer}>
                                    <Text style={styles.teamTitle}>
                                        {team.name}
                                    </Text>
                                    <Text style={styles.teamMembers}>
                                        Membros: {team.memberNames.join(', ')}
                                    </Text>

                                </View>
                            ))
                        )}
                    </View>

                    <TouchableOpacity 
                        style={styles.avancarButton}
                        onPress={handleAvançar}
                    >
                        <Text style={styles.avancarText}>
                            {teams.length === 0 ? "Avançar" : "Avançar"}
                        </Text>
                    </TouchableOpacity>

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
                        <Text style={styles.modalTitle}>Criar Novo Time</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nome do Time</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newTeam.name}
                                onChangeText={(text) => setNewTeam({ ...newTeam, name: text })}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>País</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newTeam.country}
                                onChangeText={(text) => setNewTeam({ ...newTeam, country: text })}
                                editable={!loading}
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>IDs dos Membros (opcional)</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newTeam.members}
                                onChangeText={(text) => setNewTeam({ ...newTeam, members: text })}
                                editable={!loading}
                            />
                            <Text style={styles.helperText}>
                                IDs numéricos dos usuários, separados por vírgula
                            </Text>
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
                                onPress={handleCreateTeam}
                                disabled={loading}
                            >
                                <Text style={styles.confirmButtonText}>
                                    {loading ? "Criando..." : "Criar Time"}
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
    categoriesSection: {
        width: "90%",
        alignSelf: "center",
        marginBottom: 30,
    },
    horizontalScroll: {
        width: "100%",
    },
    categoriesContainer: {
        flexDirection: "row",
        paddingRight: 20,
    },
    categoryCard: {
        width: 127,
        height: 50,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#a6a6a6",
        borderRadius: 12,
        padding: 15,
        marginRight: 15,
    },
    categoryCardSelected: {
        backgroundColor: "#24bf94",
    },
    categoryTitle: {
        fontFamily: "Rubik",
        fontSize: 16,
        fontWeight: "500",
        textAlign: "center",
        color: "#000",
    },
    categoryTitleSelected: {
        color: "#FFF",
    },
    teamsSection: {
        width: "90%",
        alignSelf: "center",
        flexDirection: "column",
        gap: 18,
        justifyContent: "space-between",
        marginBottom: 30,
    },
    teamContainer: {
        width: "100%",
        backgroundColor: "#FFF",
        borderRadius: 12,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    teamTitle: {
        fontFamily: "Rubik",
        fontSize: 18,
        fontWeight: "500",
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: "black",
        paddingBottom: 5,
    },
    teamMembers: {
        fontFamily: "Rubik",
        fontSize: 14,
        color: "#777",
        marginBottom: 5,
    },
    teamId: {
        fontFamily: "Rubik",
        fontSize: 12,
        color: "#999",
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
    avancarButton: {
        width: "40%",
        alignSelf: "center",
        backgroundColor: "#24bf94",
        borderRadius: 12,
        padding: 15,
        alignItems: "center",
        marginBottom: 30,
    },
    avancarText: {
        fontFamily: "Rubik",
        fontSize: 18,
        fontWeight: "500",
        color: "#FFF",
    },
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
    helperText: {
        fontFamily: "Rubik",
        fontSize: 12,
        color: "#777",
        marginTop: 4,
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