import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

export default function ModoNormal() {
  const router = useRouter();

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Modo Normal</Text>

        <Text style={styles.description}>
            Consiste en <Text style={styles.bold}>encontrar y fotografiar objetos cotidianos</Text> propuestos por la aplicación, como una{" "}
            <Text style={styles.highlight}>cuchara</Text>, un <Text style={styles.highlight}>tenedor</Text>, una <Text style={styles.highlight}>taza</Text>, etc.
        </Text>

        <Text style={styles.description}>
            Tienes <Text style={styles.bold}>un tiempo limitado</Text> para encontrar y capturar la imagen del objeto correcto.
        </Text>

        <Text style={styles.listItem}>
            • <Text style={styles.bold}>Si aciertas:</Text> ganarás <Text style={styles.highlight}>10 puntos</Text> y la <Text style={styles.bold}>racha</Text> se mantendrá. Se te propondrá un nuevo objeto automáticamente.
        </Text>

        <Text style={styles.listItem}>
            • <Text style={styles.bold}>Si fallas o se agota el tiempo:</Text> perderás la racha y <Text style={styles.highlight}>la partida terminará</Text>.
        </Text>

        <TouchableOpacity style={styles.playButton} onPress={() => router.replace('/juegoNormal')}>
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
