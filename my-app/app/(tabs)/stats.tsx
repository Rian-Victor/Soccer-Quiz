import React, { useEffect, useState, useCallback } from "react";
import {
    StyleSheet,
    View,
    Image,
    Text,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl
} from "react-native";
import { rankingService, RankingItem } from "../../services/rankingApi"; 

export default function Ranking() {
    const [ranking, setRanking] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchRanking();
    }, []);

    const fetchRanking = async () => {
        try {
            const data = await rankingService.getRanking();
            setRanking(data);
        } catch (error) {
            console.error("Erro ao buscar ranking:", error);
            Alert.alert("Erro", "Não foi possível carregar o ranking. Verifique se o Ranking Service (Porta 3004) está rodando.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchRanking();
    }, []);

    const getAvatar = () => {
        return require("../../assets/images/katherinepierce.jpg");
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: "center" }]}>
                <ActivityIndicator size="large" color="#24BF94" />
                <Text style={{marginTop: 10, color: '#555'}}>Carregando Ranking...</Text>
            </View>
        );
    }

    const firstPlace = ranking[0];
    const secondPlace = ranking[1];
    const thirdPlace = ranking[2];

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

                {/* PODIO (TOP 3) */}
                <View style={styles.topContainer}>
                    {secondPlace && (
                        <View style={styles.topItemSmall}>
                            <Image source={getAvatar()} style={styles.avatarSmall} />
                            <Text style={styles.topName} numberOfLines={1}>
                                {secondPlace.user_name}
                            </Text>
                            <View style={styles.badgeRank}><Text style={styles.badgeText}>2</Text></View>
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
                            <View style={[styles.badgeRank, {backgroundColor: '#FFC107'}]}><Text style={styles.badgeText}>1</Text></View>
                            <Text style={[styles.topPoints, { fontSize: 16, fontWeight: "bold" }]}>
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
                            <View style={[styles.badgeRank, {backgroundColor: '#BF8970'}]}><Text style={styles.badgeText}>3</Text></View>
                            <Text style={styles.topPoints}>
                                {thirdPlace.total_points}
                            </Text>
                        </View>
                    )}
                </View>

                {/* LISTA DO RESTANTE DO RANKING */}
                <ScrollView 
                    style={styles.scrollcontent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#24BF94"]} />
                    }
                >
                    <View style={styles.rankList}>
                        {ranking.map((item, index) => {
                            return (
                                <View key={item.user_id} style={styles.rankItem}>
                                    <Text style={styles.rankPosition}>
                                        {item.rank}º
                                    </Text>

                                    <View style={styles.rankUser}>
                                        <Image source={getAvatar()} style={styles.rankAvatar} />
                                        <Text style={styles.rankName}>
                                            {item.user_name}
                                        </Text>
                                    </View>

                                    <Text style={styles.rankPoints}>
                                        {item.total_points} pts
                                    </Text>
                                </View>
                            );
                        })}

                        {ranking.length === 0 && (
                            <Text style={{ textAlign: "center", marginTop: 20, color: "#999" }}>
                                Nenhum jogador no ranking ainda.{'\n'}
                                Jogue um quiz para aparecer aqui!
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
        backgroundColor: "#f1f1f1",
    },
    content: {
        flex: 1,
        alignItems: "center",
    },
    logoContent: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 50,
        marginBottom: 10
    },
    loginLogo: {
        width: 30,
        height: 30,
        marginRight: 10,
    },
    title: {
        fontFamily: "Rubik", 
        fontSize: 22,
        fontWeight: "bold",
        color: "#333"
    },
    topContainer: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 20,
        height: 160,
    },
    topItemMain: {
        alignItems: "center",
        marginHorizontal: 10,
        marginBottom: 20,
        zIndex: 10
    },
    topItemSmall: {
        alignItems: "center",
        marginHorizontal: 5,
    },
    avatarMain: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        borderColor: "#FFC107",
    },
    avatarSmall: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: "#C0C0C0",
    },
    avatarSmallTwo: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 3,
        borderColor: "#BF8970",
    },
    topName: {
        marginTop: 5,
        fontSize: 12,
        fontWeight: '600',
        width: 80,
        textAlign: 'center'
    },
    topPoints: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#24BF94",
    },
    badgeRank: {
        backgroundColor: '#C0C0C0',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: 60, 
        right: 0
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold'
    },
    scrollcontent: {
        flex: 1,
        width: "100%",
        backgroundColor: '#fff',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 5
    },
    rankList: {
        width: "100%",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 50,
    },
    rankItem: {
        flexDirection: "row",
        backgroundColor: "#f9f9f9",
        marginBottom: 10,
        borderRadius: 12,
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee'
    },
    rankPosition: {
        width: 30,
        fontSize: 16,
        fontWeight: "bold",
        color: "#555"
    },
    rankUser: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    rankAvatar: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 10,
        backgroundColor: '#ddd'
    },
    rankName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#333'
    },
    rankPoints: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#24BF94",
    },
});