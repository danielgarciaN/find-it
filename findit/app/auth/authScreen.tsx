import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Animated, StyleSheet,
  ImageBackground, StatusBar, Dimensions, Image, Keyboard, Alert,
  TouchableWithoutFeedback, ScrollView,KeyboardAvoidingView, Platform
} from 'react-native';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
import { app } from '../../firebase';
import {getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword} from 'firebase/auth';
const auth = getAuth(app);
const db = getFirestore(app);

export default function AuthScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(params.mode === 'login');
  const toggleAnim = useRef(new Animated.Value(isLogin ? 0 : 1)).current;

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    if (params.mode) {
      const newMode = params.mode === 'login';
      setIsLogin(newMode);
      Animated.timing(toggleAnim, {
        toValue: newMode ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [params.mode]);

  const switchForm = (newMode: boolean) => {
    if (isLogin !== newMode) {
      setIsLogin(newMode);
      setMensajeError('');
      setEmail('');
      setPassword('');
      setRepetirContrasena('');
      setNombre('');
      setTelefono('');
  
      Animated.timing(toggleAnim, {
        toValue: newMode ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleRegister = async() => {
    setMensajeError('');

    if (!nombre || !telefono || !email || !password || !repetirContrasena) {
      setMensajeError('Por favor, completa todos los campos');
      return;
    }

    if (!/^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]{3,}$/.test(nombre)) {
      setMensajeError("El nombre debe contener solo letras y al menos 3 caracteres.");
      return;
    }

    if (!/^\+?[0-9]+$/.test(telefono)) {
      setMensajeError("El teléfono solo puede contener números y el símbolo '+'.");
      return;
    }

    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setMensajeError("El correo electrónico no es válido.");
      return;
    }

    if (password.length < 8) {
      setMensajeError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== repetirContrasena) {
      setMensajeError("Las contraseñas no coinciden");
      return;
    }

    try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;
    // Guardar datos en Firestore
    await setDoc(doc(db, 'users', userId), {
      nombre,
      telefono,
      email,
      fechaRegistro: new Date().toISOString(),
      objetosEncontrados: 0,
      precision: 0,
      puntos: 0,
      partidasTotales: 0,
    });

    setTimeout(() => {
      router.replace('/home');
    }, 1000);
  } catch (error: any) {
    console.error("Error al registrar:", error);
    if (error.code === 'auth/email-already-in-use') {
      setMensajeError("El correo electrónico ya está en uso.");
    } else {
      setMensajeError("Error al registrar. Inténtalo de nuevo.");
    }
  }
  };

  const handleLogin = async() => {
    setMensajeError('');

    if (!email || !password) {
      setMensajeError('Por favor, completa todos los campos');
      return;
    }

    if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setMensajeError("El correo electrónico no es válido.");
      return;
    }

    if (password.length < 8) {
      setMensajeError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setTimeout(() => {
        router.replace('/home');
      }, 1000);
    }
    catch (error) {
      console.error('Error al iniciar sesión:', error);
      setMensajeError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
      return;
    }

  };

  return (
      <View style={styles.containerBackground}>
        <View style={styles.imageContainer}>
          <ImageBackground source={require('../../assets/images/background.jpg')} style={styles.background}>
            <View style={styles.overlayBackground} />
            <Image source={require('../../assets/images/Logo_NF_Blanco.png')} style={styles.logo} />
          </ImageBackground>
        </View>

        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" />
          <View style={[styles.container, { height: isLogin ? '90%' : '130%' }]}>
            <View style={styles.toggleContainer}>
              <Animated.View
                style={[
                  styles.toggleBackground,
                  {
                    left: toggleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '50%'],
                    }),
                  },
                ]}
              />
              <TouchableOpacity style={styles.toggleButton} onPress={() => switchForm(true)}>
                <Text style={[styles.toggleText, isLogin && styles.activeText]}>Iniciar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.toggleButton} onPress={() => switchForm(false)}>
                <Text style={[styles.toggleText, !isLogin && styles.activeText]}>Registrarse</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.title}>Bienvenido a FindIt</Text>

            {!isLogin ? (
              <>
                <ScrollView
                  contentContainerStyle={styles.scrollContainer}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  style={{ width: '100%' }}
                >
                  <View style={styles.inputGroup}>
                    <TextInput style={styles.input} placeholder="Nombre" placeholderTextColor="#213e3d" value={nombre} onChangeText={setNombre} />
                    <TextInput style={styles.input} placeholder="Teléfono" placeholderTextColor="#213e3d" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
                    <TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#213e3d" value={email} onChangeText={setEmail} keyboardType="email-address" />
                    <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#213e3d" secureTextEntry value={password} onChangeText={setPassword} />
                    <TextInput style={styles.input} placeholder="Repetir contraseña" placeholderTextColor="#213e3d" secureTextEntry value={repetirContrasena} onChangeText={setRepetirContrasena} />
                  </View>

                  {mensajeError ? <Text style={styles.warningText}>{mensajeError}</Text> : null}

                  <TouchableOpacity style={styles.button} onPress={handleRegister}>
                    <Text style={styles.buttonText}>Crear cuenta</Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              <>
                <View style={{ height: 10 }} />

                <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Correo electrónico" placeholderTextColor="#213e3d" value={email} onChangeText={setEmail} keyboardType="email-address" /></View>
                <View style={styles.inputContainer}><TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor="#213e3d" secureTextEntry textContentType="password" autoComplete="off" value={password} onChangeText={setPassword} /></View>
                {mensajeError ? <Text style={styles.warningText}>{mensajeError}</Text> : null}
                <View style={{ height: mensajeError ? 10 : 40 }} />
                <TouchableOpacity style={styles.button} onPress={handleLogin}>
                  <Text style={styles.buttonText}>Iniciar sesión</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </View>
  );
}

const styles = StyleSheet.create({
  containerBackground: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: height * 0.5,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    overflow: 'hidden',
  },
  background: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  overlayBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  logo: {
    width: '100%',
    height: '19%',
    resizeMode: 'contain',
    marginTop: height * 0.12,
  },
  safeArea: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#c7d1d8',
    width: '100%',
    height: '165%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: -height * 0.28,
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#839197',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 10,
    position: 'relative',
  },
  toggleBackground: {
    position: 'absolute',
    width: '50%',
    height: '100%',
    backgroundColor: '#478783',
    borderRadius: 25,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeText: {
    color: '#FFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f5856',
    marginBottom: 10,
  },
  warningText: {
    color: '#D9534F',
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.04,
    borderWidth: 1,
    borderColor: '#213e3d',
    borderRadius: 10,
    marginBottom: height * 0.015,
    fontSize: height * 0.02,
    backgroundColor: '#fff',
  },

  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },

  inputGroup: {
    width: '100%',
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 10,
  },

  button: {
    backgroundColor: '#478783',
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.1,
    borderRadius: 30,
    alignItems: 'center',
    alignSelf: 'center',
    width: '85%',
    marginTop: 5,
  },

  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: height * 0.022,
  },

  scrollContainer: {
    paddingBottom: 30,
    width: '100%',
  },
});
