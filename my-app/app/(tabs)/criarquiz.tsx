import { StyleSheet, View, Image, Text, TouchableOpacity, ScrollView } from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function CreateQuiz() {
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const params = useLocalSearchParams();

    const categories = [
        { id: 1, name: "Futmesa" },
        { id: 2, name: "Futebol" },
        { id: 3, name: "Futsal" },
        { id: 4, name: "Futvôlei" }
    ];

    const selectedQuiz = params.quizId ? {
        id: params.quizId as string,
        title: params.quizTitle as string,
        category: params.quizCategory as string
    } : null;

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
                        <View style={styles.teamContainer}>
                            <Text style={styles.teamTitle}>Time A</Text>
                            <Text style={styles.teamMembers}>Membros: XXXX</Text>
                        </View>

                        <View style={styles.teamContainer}>
                            <Text style={styles.teamTitle}>Time B</Text>
                            <Text style={styles.teamMembers}>Membros: XXXX</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.avengarButton}>
                        <Text style={styles.avengarText}>Avançar</Text>
                    </TouchableOpacity>

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

    categoriesSection: {
        width: "90%",
        alignSelf: "center",
        marginBottom: 30,
    },

    sectionTitle: {
        fontFamily: "Rubik",
        fontSize: 18,
        fontWeight: "500",
        marginBottom: 15,
        marginLeft: 5,
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
    },

    avengarButton: {
        width: "40%",
        alignSelf: "center",
        backgroundColor: "#24bf94",
        borderRadius: 12,
        padding: 15,
        alignItems: "center",
        marginBottom: 30,
    },

    avengarText: {
        fontFamily: "Rubik",
        fontSize: 18,
        fontWeight: "500",
        color: "#FFF",
    },

});