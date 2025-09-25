import { View, Text, Image, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function Bienvenida() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../assets/images/background.jpg')}
      style={styles.background}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />

      <View style={styles.overlayBackground} />

      <SafeAreaView style={styles.safeArea}>
        <View style={{ height: 180 }} />

        <Image source={require('../assets/images/Logo_NF_Blanco.png')} style={styles.logo} />
        <View style={{ height: 150 }} />
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/auth/authScreen?mode=login')}
        >
          <Text style={styles.buttonText}>Iniciar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.text}>
          ¿No tienes una cuenta?{' '}
          <Text style={styles.link} onPress={() => router.replace('/auth/authScreen?mode=signup')}>
            Regístrate
          </Text>
        </Text>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  safeArea: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '55%',
    height: height * 0.2,
    resizeMode: 'contain',
    marginBottom: height * 0.08,
  },
  button: {
    backgroundColor: '#478783',
    paddingVertical: height * 0.014,
    paddingHorizontal: width * 0.2,
    borderRadius: height * 0.035,
    width: '90%',
    alignItems: 'center',
    
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: height * 0.025,
    fontWeight: 'bold',
  },
  text: {
    color: '#FFF',
    fontSize: height * 0.017,
    textAlign: 'center',
  },
  link: {
    color: '#FFD700',
    fontWeight: 'bold',
    fontSize: height * 0.02,
  },
});
