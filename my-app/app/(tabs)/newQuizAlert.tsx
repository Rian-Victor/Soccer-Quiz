import React, { useEffect, useState } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { quizService } from '@/services/quizApi';

export function NewQuizAlert() {
    const [visible, setVisible] = useState(false);
    const [newQuiz, setNewQuiz] = useState<any>(null);
    const router = useRouter();

    useEffect(() => {
        checkForNewQuiz();
    }, []);

    const checkForNewQuiz = async () => {
        try {
            console.log("🔍 Verificando novos quizzes...");
            const quizzes = await quizService.getQuizzes(); 
            
            if (quizzes && quizzes.length > 0) {
                const sortedQuizzes = [...quizzes].sort((a: any, b: any) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                });

                const latestQuiz = sortedQuizzes[0]; 
                console.log("🏆 Quiz mais recente:", latestQuiz.title, "ID:", latestQuiz.id);

                const lastSeenId = await AsyncStorage.getItem('last_seen_quiz_id');
                console.log("💾 Último ID visto:", lastSeenId);

                if (latestQuiz.id !== lastSeenId) {
                    console.log("🚀 NOVIDADE ENCONTRADA! Abrindo modal...");
                    setNewQuiz(latestQuiz);
                    setVisible(true);
                } else {
                    console.log("💤 Nenhuma novidade.");
                }
            } else {
                console.log("⚠️ Nenhum quiz encontrado na API.");
            }
        } catch (error) {
            console.log("❌ Erro ao verificar novos quizzes:", error);
        }
    };

    const handleClose = async () => {
        if (newQuiz) {
            await AsyncStorage.setItem('last_seen_quiz_id', newQuiz.id);
            console.log("✅ ID salvo como visto:", newQuiz.id);
        }
        setVisible(false);
    };

    const handlePlayNow = async () => {
        if (newQuiz) {
            await AsyncStorage.setItem('last_seen_quiz_id', newQuiz.id);
            setVisible(false);
            router.push({ pathname: "/game", params: { mode: "custom", quizId: newQuiz.id } } as any);
        }
    };

    if (!newQuiz) return null;

    return (
        <Modal
            transparent
            animationType="slide"
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Feather name="bell" size={32} color="#FFF" />
                    </View>
                    
                    <Text style={styles.title}>Novo Desafio!</Text>
                    <Text style={styles.subtitle}>
                        O quiz <Text style={{fontWeight: 'bold'}}>"{newQuiz.title}"</Text> acabou de sair do forno.
                    </Text>
                    
                    <View style={styles.infoBadge}>
                        <Text style={styles.infoText}>Dificuldade: {newQuiz.difficulty || 'Geral'}</Text>
                    </View>

                    <TouchableOpacity style={styles.playButton} onPress={handlePlayNow}>
                        <Text style={styles.playButtonText}>JOGAR AGORA</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>Ver depois</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    card: {
        backgroundColor: 'white',
        width: '100%',
        padding: 25,
        borderRadius: 25,
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5
    },
    iconContainer: {
        backgroundColor: '#24BF94',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: -55, 
        borderWidth: 4,
        borderColor: '#fff'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20
    },
    infoBadge: {
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginBottom: 25
    },
    infoText: {
        color: '#00695C',
        fontWeight: '600'
    },
    playButton: {
        backgroundColor: '#24BF94',
        width: '100%',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 10
    },
    playButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16
    },
    closeButton: {
        padding: 10,
    },
    closeButtonText: {
        color: '#999',
        fontSize: 14
    }
});