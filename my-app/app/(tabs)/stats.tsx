import React, { useEffect, useState } from "react";
import {
    StyleSheet,
    View,
    Image,
    Text,
    ScrollView,
    ActivityIndicator,
    Alert
} from "react-native";

export default function Ranking() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    // URL da API (Ajuste conforme onde você está rodando)
    // Se for Android Emulator: 'http://10.0.2.2:3005'
    // Se for iOS ou Web: 'http://localhost:3005'
    const API_URL = "http://10.0.2.2:3005/api/leaderboard/general";

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async () => {
        try {
            const response = await fetch(API_URL);
            const data = await response.json();

            // O backend retorna { "ranking": [...] }
            if (data.ranking) {
                setRanking(data.ranking);
            }
        } catch (error) {
            console.error("Erro ao buscar ranking:", error);
            Alert.alert("Erro", "Não foi possível carregar o ranking.");
        } finally {
            setLoading(false);
        }
    };

    // Função auxiliar para pegar o Avatar (já que o backend não manda ainda)
    const getAvatar = () => {
        return require("../../assets/images/katherinepierce.jpg");
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color="#24BF94" />
            </View>
        );
    }

    // Separa o Top 3 do resto da lista
    const firstPlace = ranking[0];
    const secondPlace = ranking[1];
    const thirdPlace = ranking[2];
    const restOfRanking = ranking.slice(3); // Do 4º em diante

    return (
        <View style={styles.container}>
            <View style={styles.content}>

                {/* LOGO HEADER */}
                <View style={styles.logoContent}>
                    <Image
                        source={require("../../assets/images/LogoBG.png")}
                        style={styles.loginLogo}
                    />
                    <Text style={styles.title}>FUTQUIZ</Text>
                </View>

                {/* PODIUM (TOP 3) - Só exibe se tiver dados suficientes */}
                <View style={styles.topContainer}>
                    {/* 2º LUGAR (Esquerda) */}
                    {secondPlace && (
                        <View style={styles.topItemSmall}>
                            <Image source={getAvatar()} style={styles.avatarSmall} />
                            <Text style={styles.topName} numberOfLines={1}>
                                {secondPlace.user_name}
                            </Text>
                            <Text style={styles.topPoints}>{secondPlace.total_points}</Text>
                        </View>
                    )}

                    {/* 1º LUGAR (Centro/Maior) */}
                    {firstPlace && (
                        <View style={styles.topItemMain}>
                            <Image source={getAvatar()} style={styles.avatarMain} />
                            <Text style={styles.topName} numberOfLines={1}>
                                {firstPlace.user_name}
                            </Text>
                            <Text style={[styles.topPoints, { fontSize: 14, fontWeight: 'bold' }]}>
                                {firstPlace.total_points}
                            </Text>
                        </View>
                    )}

                    {/* 3º LUGAR (Direita) */}
                    {thirdPlace && (
                        <View style={styles.topItemSmall}>
                            <Image source={getAvatar()} style={styles.avatarSmallTwo} />
                            <Text style={styles.topName} numberOfLines={1}>
                                {thirdPlace.user_name}
                            </Text>
                            <Text style={styles.topPoints}>{thirdPlace.total_points}</Text>
                        </View>
                    )}
                </View>

                {/* LISTA DO RESTANTE (4º LUGAR EM DIANTE) */}
                <ScrollView style={styles.scrollcontent}>
                    <View style={styles.rankList}>
                        {restOfRanking.map((item, index) => (
                            <View key={item.user_id || index} style={styles.rankItem}>
                                {/* A posição é index + 4, pois já mostramos 3 lá em cima */}
                                <Text style={styles.rankPosition}>{index + 4}</Text>

                                <View style={styles.rankUser}>
                                    <Image source={getAvatar()} style={styles.rankAvatar} />
                                    <Text style={styles.rankName}>{item.user_name}</Text>
                                </View>

                                <Text style={styles.rankPoints}>{item.total_points}</Text>
                            </View>
                        ))}

                        {ranking.length === 0 && (
                            <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>
                                Nenhum jogador no ranking ainda.
                            </Text>
                        )}
                    </View>
                </ScrollView>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        backgroundColor: "#f1f1f1",
    },
    content: {
        flex: 1,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    logoContent: {
        flex: 0.1,
        justifyContent: "center",
        marginTop: 60,
        flexDirection: "row",
        alignItems: 'center'
    },
    loginLogo: {
        width: 35,
        height: 35,
        marginBottom: 0,
        marginRight: 10,
    },
    title: {
        fontFamily: "Rubik",
        fontSize: 25,
        fontWeight: "500", // Corrigido de 500 (number) para "500" (string) ou 'bold'
    },
    topContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginTop: 20,
        marginBottom: 30,
        height: 150, // Altura fixa para alinhar o podium
    },
    topItemMain: {
        alignItems: "center",
        marginHorizontal: 15,
        marginBottom: 20, // Levanta um pouco o 1º lugar visualmente
    },
    topItemSmall: {
        alignItems: "center",
        marginHorizontal: 10,
    },
    avatarMain: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 3,
        borderColor: "#FFC107",
    },
    avatarSmall: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: "#C0C0C0",
    },
    avatarSmallTwo: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: "#BF8970",
    },
    topName: {
        marginTop: 6,
        fontSize: 12,
        fontFamily: "Rubik",
        textAlign: "center",
        maxWidth: 80,
    },
    topPoints: {
        fontSize: 10,
        color: '#666',
        fontFamily: "Rubik",
    },
    scrollcontent: {
        flex: 1,
        width: "100%",
    },
    rankList: {
        width: "90%",
        alignSelf: "center",
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 20,
        paddingBottom: 50,
    },
    rankItem: {
        flexDirection: "row",
        backgroundColor: "#fff",
        marginBottom: 10,
        borderRadius: 15,
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    rankPosition: {
        width: 25,
        fontSize: 16,
        fontWeight: "900",
        fontFamily: "Rubik",
        color: '#333'
    },
    rankUser: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginLeft: 10,
    },
    rankAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    rankName: {
        fontSize: 14,
        fontFamily: "Rubik",
        fontWeight: "400",
    },
    rankPoints: {
        fontSize: 14,
        fontWeight: "bold",
        fontFamily: "Rubik",
        color: '#24BF94',
    },
});