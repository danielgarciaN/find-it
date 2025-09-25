import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function ModoContrarreloj() {
  const router = useRouter();

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Modo Contrarreloj</Text>

        <Text style={styles.description}>
            En este modo tienes <Text style={styles.bold}>5 minutos en total</Text> para completar tantos retos como puedas. 
        </Text>

        <Text style={styles.description}>
            Cada reto consiste en <Text style={styles.bold}>encontrar y fotografiar objetos cotidianos</Text> como una{" "}
            <Text style={styles.highlight}>planta</Text>, una <Text style={styles.highlight}>taza</Text> o una <Text style={styles.highlight}>cuchara</Text>.
        </Text>

        <Text style={styles.listItem}>
            • <Text style={styles.bold}>Cada acierto:</Text> suma <Text style={styles.highlight}>1 punto</Text> y se te propondrá un nuevo objeto automáticamente. ¡No pasa nada si fallas!
        </Text>

        <Text style={styles.listItem}>
            • <Text style={styles.bold}>El reto finaliza cuando se agote el tiempo:</Text> ¡intenta lograr la mayor puntuación posible!
        </Text>

        <TouchableOpacity style={styles.playButton} onPress={() => router.replace('/juegoContrarreloj')}>
            <Text style={styles.playButtonText}>¡Empezar!</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2f5856',
    marginBottom: 40,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    color: '#333',
    lineHeight: 28,
    textAlign: 'justify',
    marginBottom: 15,
  },
  playButton: {
    backgroundColor: '#478783',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: 'center',
    marginTop: width * 0.05,
  },
  playButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    marginTop: 20,
    alignSelf: 'center',
  },
  backText: {
    color: '#2f5856',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: 'bold',
    color: '#2f5856',
  },
  highlight: {
    color: '#478783',
    fontWeight: 'bold',
  },
  listItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 24,
  },
});
