import { StyleSheet, View, Image, Text, TouchableOpacity, ScrollView } from "react-native";

export default function MyQuizzes() {
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
                    <TouchableOpacity>
                        <Image 
                            source={require('../../assets/images/edit.png')} 
                            style={styles.editIcon}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scrollcontent}>
                    <View style={styles.quizList}>

                        <View style={styles.quizCard}>
                            <View style={styles.quizImg}></View>
                            <View style={styles.quizInfo}>
                                <Text style={styles.quizTitle}>Tipos de carros de jogadores</Text>
                                <Text style={styles.quizDate}>15/06/2025</Text>
                            </View>
                        </View>

                        <View style={styles.quizCard}>
                            <View style={styles.quizImg}></View>
                            <View style={styles.quizInfo}>
                                <Text style={styles.quizTitle}>Qual a comida favorita do Messi</Text>
                                <Text style={styles.quizDate}>18/08/2025</Text>
                            </View>
                        </View>

                        <View style={styles.quizCard}>
                            <View style={styles.quizImg}></View>
                            <View style={styles.quizInfo}>
                                <Text style={styles.quizTitle}>Como o Messi compra pão</Text>
                                <Text style={styles.quizDate}>21/08/2025</Text>
                            </View>
                        </View>

                        <View style={styles.quizCard}>
                            <View style={styles.quizImg}></View>
                            <View style={styles.quizInfo}>
                                <Text style={styles.quizTitle}>Se Cristiano Ronaldo fosse um ator, quem seria</Text>
                                <Text style={styles.quizDate}>20/09/2025</Text>
                            </View>
                        </View>

                        <View style={styles.quizCard}>
                            <View style={styles.quizImg}></View>
                            <View style={styles.quizInfo}>
                                <Text style={styles.quizTitle}>Quem são as mães dos jogadores famosos</Text>
                                <Text style={styles.quizDate}>23/10/2025</Text>
                            </View>
                        </View>

                        <View style={styles.quizCard}>
                            <View style={styles.quizImg}></View>
                            <View style={styles.quizInfo}>
                                <Text style={styles.quizTitle}>Quais desses jogadores é famoso</Text>
                                <Text style={styles.quizDate}>25/10/2025</Text>
                            </View>
                        </View>

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
        fontSize: 22,
        fontWeight: 500,
    },

    editIcon: {
        width: 22,
        height: 22,
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
