import React, { useState, useEffect } from "react";
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Text,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, query, orderBy, limit, Timestamp } from "firebase/firestore";
import { app } from '../firebase';

const { width } = Dimensions.get('window');

interface UserData {
  name: string;
  points: number;
  level: number;
  streak: number;
  objectsFound: number;
  accuracy: number;
  partidasTotales: number;
}

interface GameMatch {
  puntos: number;
  fecha: Timestamp;
  objetosCorrectos: number;
  precisionMedia: number;
}

interface RankingItem {
  id: string;
  name: string;
  points: string; // Cambiado a string para poder mostrar ----
}

export default function Home() {
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore(app);

  const [userData, setUserData] = useState<UserData>({
    name: "",
    points: 0,
    level: 1,
    streak: 0,
    objectsFound: 0,
    accuracy: 0,
    partidasTotales: 0,
  });
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoClasificacion, setModoClasificacion] = useState<'normal' | 'contrarreloj'>('normal');

  const calculateLevel = (points: number): number => {
    if (points < 500) return 1;
    if (points < 1000) return 2;
    if (points < 2000) return 3;
    if (points < 3500) return 4;
    if (points < 5500) return 5;
    if (points < 8000) return 6;
    if (points < 11000) return 7;
    if (points < 15000) return 8;
    if (points < 20000) return 9;
    return 10;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          console.log("No hay usuario autenticado");
          setLoading(false);
          return;
        }

        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userDataFromFirestore = userDoc.data();
          const points = userDataFromFirestore.puntos || 0;
          const level = calculateLevel(points);

          setUserData({
            name: userDataFromFirestore.nombre || "Usuario",
            points: points,
            level: level,
            streak: 0,
            objectsFound: userDataFromFirestore.objetosEncontrados || 0,
            accuracy: Math.round(userDataFromFirestore.precision || 0),
            partidasTotales: userDataFromFirestore.partidasTotales || 0,
          });

          await loadBestMatches(currentUser.uid, modoClasificacion);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [modoClasificacion]);

  const loadBestMatches = async (userId: string, modo: 'normal' | 'contrarreloj') => {
    try {
      const partidasRef = collection(db, "users", userId, modo === 'normal' ? "partidas" : "partidasContrarreloj");
      const q = query(partidasRef, orderBy("puntos", "desc"), limit(5));
      const partidasSnapshot = await getDocs(q);

      const bestMatches: RankingItem[] = [];
      let index = 0;

      partidasSnapshot.forEach((doc) => {
        const matchData = doc.data() as GameMatch;
        bestMatches.push({
          id: (index + 1).toString(),
          name: formatDate(matchData.fecha.toDate()),
          points: `${matchData.puntos} pts`,
        });
        index++;
      });

      // Completar con guiones si faltan partidas
      for (let i = bestMatches.length + 1; i <= 5; i++) {
        bestMatches.push({
          id: i.toString(),
          name: '----',
          points: '----',
        });
      }

      setRanking(bestMatches);
    } catch (error) {
      console.error("Error loading best matches:", error);
    }
  };

  const handleLogout = () => {
    auth.signOut().then(() => {
      router.replace('/');
    });
  };

  const navigateToSettings = () => {
    router.push('/settings');
  };

  const startGame = (mode: string) => {
    router.push(`/${mode}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#478783" />
          <Text style={styles.loadingText}>Cargando datos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Image source={require('../assets/images/Logo_NF_Blanco.png')} style={styles.headerLogo} />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>Hola, {userData.name}</Text>
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsText}>{userData.points} pts</Text>
          </View>
        </View>
        <TouchableOpacity onPress={navigateToSettings} style={styles.settingsButton}>
          <Icon name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Tus estadísticas</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userData.partidasTotales}</Text>
              <Text style={styles.statLabel}>Partidas totales</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userData.objectsFound}</Text>
              <Text style={styles.statLabel}>Objetos correctos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userData.accuracy}%</Text>
              <Text style={styles.statLabel}>Precisión</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Mis mejores partidas</Text>
          <View style={styles.modeToggleContainer}>
            <TouchableOpacity
              style={[styles.modeButton, modoClasificacion === 'normal' && styles.modeButtonActive]}
              onPress={() => setModoClasificacion('normal')}
            >
              <Text style={[styles.modeButtonText, modoClasificacion === 'normal' && styles.modeButtonTextActive]}>Modo Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, modoClasificacion === 'contrarreloj' && styles.modeButtonActive]}
              onPress={() => setModoClasificacion('contrarreloj')}
            >
              <Text style={[styles.modeButtonText, modoClasificacion === 'contrarreloj' && styles.modeButtonTextActive]}>Contrarreloj</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rankingContainer}>
            {ranking.map(match => (
              <View key={match.id} style={styles.rankingRow}>
                <Text style={styles.rankingPosition}>{match.id}</Text>
                <Text style={styles.rankingName}>{match.name}</Text>
                <Text style={styles.rankingPoints}>{match.points}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Jugar</Text>
          <View style={styles.gameModes}>
            <TouchableOpacity style={styles.gameButton} onPress={() => startGame('modo-normal')}>
              <Text style={styles.gameButtonText}>Modo Normal</Text>
              <Text style={styles.gameButtonSubtext}>Haz la racha más larga que puedas</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.gameButton, styles.timeTrialButton]} onPress={() => startGame('modo-contrarreloj')}>
              <Text style={styles.gameButtonText}>Contrarreloj</Text>
              <Text style={styles.gameButtonSubtext}>Encuentra el máximo de objetos en un tiempo determinado</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#478783',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#478783',
    padding: 15,
    paddingTop: 20,
  },
  headerLogo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  userInfo: {
    flex: 1,
    marginLeft: 10,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pointsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  pointsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 5,
  },
  scrollContent: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 50,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f5856',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#478783',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#e0f0ee',
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#478783',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2f5856',
  },
  modeButtonTextActive: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  rankingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingRow: {
    flexDirection: 'row',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  currentUserRow: {
    backgroundColor: '#e6f7f5',
  },
  rankingPosition: {
    width: 24,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#478783',
  },
  rankingName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  rankingPoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#478783',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  gameModes: {
    marginTop: 8,
  },
  gameButton: {
    backgroundColor: '#478783',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timeTrialButton: {
    backgroundColor: '#2f5856',
  },
  gameButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  gameButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});