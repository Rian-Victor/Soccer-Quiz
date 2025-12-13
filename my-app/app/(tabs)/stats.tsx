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

type RankingItem = {
    user_id: number;
    user_name: string;
    total_points: number;
};

export default function Ranking() {
    const [ranking, setRanking] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const API_URL = "http://localhost:3005";

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async () => {
        try {
            const response = await fetch(API_URL);
            const data: { ranking?: RankingItem[] } = await response.json();

            if (data.ranking) {
                setRanking(data.ranking);
            } else {
                setRanking([]);
            }
        } catch (error) {
            console.error("Erro ao buscar ranking:", error);
            Alert.alert("Erro", "Não foi possível carregar o ranking.");
        } finally {
            setLoading(false);
        }
    };

    const getAvatar = () => {
        return require("../../assets/images/katherinepierce.jpg");
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center" }]}>
                <ActivityIndicator size="large" color="#24BF94" />
            </View>
        );
    }

    const firstPlace: RankingItem | undefined = ranking[0];
    const secondPlace: RankingItem | undefined = ranking[1];
    const thirdPlace: RankingItem | undefined = ranking[2];
    const restOfRanking: RankingItem[] = ranking.slice(3);

    return (
        <View style={styles.container}>
            <View style={styles.content}>

                <View style={styles.logoContent}>
                    <Image
                        source={require("../../assets/images/LogoBG.png")}
                        style={styles.loginLogo}
                    />
                    <Text style={styles.title}>FUTQUIZ</Text>
                </View>

                <View style={styles.topContainer}>
                    {secondPlace && (
                        <View style={styles.topItemSmall}>
                            <Image source={getAvatar()} style={styles.avatarSmall} />
                            <Text style={styles.topName} numberOfLines={1}>
                                {secondPlace.user_name}
                            </Text>
                            <Text style={styles.topPoints}>
                                {secondPlace.total_points}
                            </Text>
                        </View>
                    )}

                    {firstPlace && (
                        <View style={styles.topItemMain}>
                            <Image source={getAvatar()} style={styles.avatarMain} />
                            <Text style={styles.topName} numberOfLines={1}>
                                {firstPlace.user_name}
                            </Text>
                            <Text style={[styles.topPoints, { fontSize: 14, fontWeight: "bold" }]}>
                                {firstPlace.total_points}
                            </Text>
                        </View>
                    )}

                    {thirdPlace && (
                        <View style={styles.topItemSmall}>
                            <Image source={getAvatar()} style={styles.avatarSmallTwo} />
                            <Text style={styles.topName} numberOfLines={1}>
                                {thirdPlace.user_name}
                            </Text>
                            <Text style={styles.topPoints}>
                                {thirdPlace.total_points}
                            </Text>
                        </View>
                    )}
                </View>

                <ScrollView style={styles.scrollcontent}>
                    <View style={styles.rankList}>
                        {restOfRanking.map((item, index) => (
                            <View key={item.user_id} style={styles.rankItem}>
                                <Text style={styles.rankPosition}>{index + 4}</Text>

                                <View style={styles.rankUser}>
                                    <Image source={getAvatar()} style={styles.rankAvatar} />
                                    <Text style={styles.rankName}>
                                        {item.user_name}
                                    </Text>
                                </View>

                                <Text style={styles.rankPoints}>
                                    {item.total_points}
                                </Text>
                            </View>
                        ))}

                        {ranking.length === 0 && (
                            <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
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
        alignItems: "center",
    },
    loginLogo: {
        width: 35,
        height: 35,
        marginRight: 10,
    },
    title: {
        fontFamily: "Rubik",
        fontSize: 25,
        fontWeight: "500",
    },
    topContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginTop: 20,
        marginBottom: 30,
        height: 150,
    },
    topItemMain: {
        alignItems: "center",
        marginHorizontal: 15,
        marginBottom: 20,
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
        color: "#666",
        fontFamily: "Rubik",
    },
    scrollcontent: {
        flex: 1,
        width: "100%",
    },
    rankList: {
        width: "90%",
        alignSelf: "center",
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
        elevation: 2,
    },
    rankPosition: {
        width: 25,
        fontSize: 16,
        fontWeight: "900",
        fontFamily: "Rubik",
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
    },
    rankPoints: {
        fontSize: 14,
        fontWeight: "bold",
        fontFamily: "Rubik",
        color: "#24BF94",
    },
});
