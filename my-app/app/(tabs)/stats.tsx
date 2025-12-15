import React, { useEffect, useState, useCallback } from "react";
import {
    StyleSheet,
    View,
    Image,
    Text,
    ScrollView,
    ActivityIndicator,
    Alert,
    RefreshControl,
    TouchableOpacity
} from "react-native";
import { rankingService, RankingItem, FastestPlayerItem } from "../../services/rankingApi";

type RankingTab = 'general' | 'fastest';

export default function Ranking() {
    const [activeTab, setActiveTab] = useState<RankingTab>('general');

    const [generalRanking, setGeneralRanking] = useState<RankingItem[]>([]);
    const [fastestRanking, setFastestRanking] = useState<FastestPlayerItem[]>([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]); 

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'general') {
                const data = await rankingService.getRanking();
                setGeneralRanking(data);
            } else {
                const data = await rankingService.getFastestPlayers();
                setFastestRanking(data);
            }
        } catch (error) {
            console.error("Erro ao buscar dados:", error);
            Alert.alert("Erro", "Não foi possível carregar o ranking. Verifique a conexão.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, [activeTab]);

    const getAvatar = () => {
        return require("../../assets/images/katherinepierce.jpg");
    };

    const renderPodium = () => {
        const list = activeTab === 'general' ? generalRanking : fastestRanking;

        const first = list[0];
        const second = list[1];
        const third = list[2];

        const getValue = (item: any) => {
            if (activeTab === 'general') return `${item.total_points} pts`;
            return item.fastest_time_formatted || "--:--";
        };

        return (
            <View style={styles.topContainer}>
                {second && (
                    <View style={styles.topItemSmall}>
                        <Image source={getAvatar()} style={styles.avatarSmall} />
                        <Text style={styles.topName} numberOfLines={1}>{second.user_name}</Text>
                        <View style={styles.badgeRank}><Text style={styles.badgeText}>2</Text></View>
                        <Text style={styles.topPoints}>{getValue(second)}</Text>
                    </View>
                )}

                {first && (
                    <View style={styles.topItemMain}>
                        <Image source={getAvatar()} style={styles.avatarMain} />
                        <Text style={styles.topName} numberOfLines={1}>{first.user_name}</Text>
                        <View style={[styles.badgeRank, { backgroundColor: '#FFC107' }]}><Text style={styles.badgeText}>1</Text></View>
                        <Text style={[styles.topPoints, { fontSize: 16, fontWeight: "bold" }]}>{getValue(first)}</Text>
                    </View>
                )}

                {third && (
                    <View style={styles.topItemSmall}>
                        <Image source={getAvatar()} style={styles.avatarSmallTwo} />
                        <Text style={styles.topName} numberOfLines={1}>{third.user_name}</Text>
                        <View style={[styles.badgeRank, { backgroundColor: '#BF8970' }]}><Text style={styles.badgeText}>3</Text></View>
                        <Text style={styles.topPoints}>{getValue(third)}</Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContent}>
                    <Image source={require("../../assets/images/LogoBG.png")} style={styles.loginLogo} />
                    <Text style={styles.title}>FUTQUIZ</Text>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'general' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('general')}
                    >
                        <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>Geral</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'fastest' && styles.tabButtonActive]}
                        onPress={() => setActiveTab('fastest')}
                    >
                        <Text style={[styles.tabText, activeTab === 'fastest' && styles.tabTextActive]}>Mais Rápidos</Text>
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#24BF94" />
                    </View>
                ) : (
                    <>
                        {renderPodium()}

                        <ScrollView
                            style={styles.scrollcontent}
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#24BF94"]} />}
                        >
                            <View style={styles.rankList}>
                                {(activeTab === 'general' ? generalRanking : fastestRanking).map((item: any) => (
                                    <View key={item.user_id} style={styles.rankItem}>
                                        <Text style={styles.rankPosition}>{item.rank}º</Text>

                                        <View style={styles.rankUser}>
                                            <Image source={getAvatar()} style={styles.rankAvatar} />
                                            <View>
                                                <Text style={styles.rankName}>{item.user_name}</Text>
                                                <Text style={styles.rankSubtext}>
                                                    {activeTab === 'general'
                                                        ? `${item.total_quizzes || 0} quizzes`
                                                        : '100% de acerto'}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.rankPoints}>
                                            {activeTab === 'general'
                                                ? `${item.total_points} pts`
                                                : item.fastest_time_formatted}
                                        </Text>
                                    </View>
                                ))}

                                {((activeTab === 'general' && generalRanking.length === 0) ||
                                    (activeTab === 'fastest' && fastestRanking.length === 0)) && (
                                        <Text style={styles.emptyText}>
                                            {activeTab === 'general'
                                                ? "Nenhum jogador pontuou ainda."
                                                : "Ninguém completou um quiz com 100% de acerto ainda."}
                                        </Text>
                                    )}
                            </View>
                        </ScrollView>
                    </>
                )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
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
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#e0e0e0',
        borderRadius: 25,
        padding: 4,
        marginVertical: 15,
        width: '80%',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#24BF94',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        elevation: 2,
    },
    tabText: {
        fontFamily: "Rubik",
        color: '#777',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFF',
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
    rankSubtext: {
        fontSize: 10,
        color: '#999',
        marginTop: 1
    },
    rankPoints: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#24BF94",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 20,
        color: "#999",
        paddingHorizontal: 20
    }
});