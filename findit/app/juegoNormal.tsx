import React, { useState, useEffect, useRef } from 'react';
import {View,Text,StyleSheet,TouchableOpacity,Image,Dimensions,Animated,Alert, Platform,} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {getFirestore,collection,getDocs,query,where,doc, updateDoc, increment, addDoc, Timestamp, getDoc} from 'firebase/firestore';
import {getStorage,ref,uploadBytes,getDownloadURL,} from 'firebase/storage';
import {getFunctions,httpsCallable,} from 'firebase/functions';
import uuid from 'react-native-uuid';
import { app } from '../firebase';
import { functions } from '../firebase';
import { getAuth } from 'firebase/auth';

const guardarResultadosPartida = async (rachaFinal: number) => {
  const auth = getAuth();
  const db = getFirestore(app);
  const user = auth.currentUser;

  if (!user) {
    console.warn("⚠️ No hay usuario autenticado");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const partidasRef = collection(db, "users", user.uid, "partidas");

  try {
    const userDoc = await getDoc(userRef);
    const datos = userDoc.data();

    const objetosAnteriores = datos?.objetosEncontrados || 0;
    const partidasAnteriores = datos?.partidasTotales || 0;
    const objetosJugadosAnteriores = datos?.objetosJugados || (partidasAnteriores * 10) || 0; // fallback

    const objetosEncontradosTotales = objetosAnteriores + rachaFinal;
    const partidasTotales = partidasAnteriores + 1;
    const objetosJugadosEnEstaPartida = rachaFinal + 1; // racha + 1 fallo
    const objetosJugadosTotales = objetosJugadosAnteriores + objetosJugadosEnEstaPartida;

    const precisionCalculada = objetosJugadosTotales > 0
      ? Math.round((objetosEncontradosTotales / objetosJugadosTotales) * 100)
      : 0;

    const puntosActualizados = objetosEncontradosTotales * 10;

    // Actualiza estadísticas del usuario
    await updateDoc(userRef, {
      objetosEncontrados: objetosEncontradosTotales,
      partidasTotales: partidasTotales,
      precision: precisionCalculada,
      puntos: puntosActualizados,
      objetosJugados: objetosJugadosTotales, // Nuevo campo para almacenar objetos jugados
    });

    // Crea una nueva entrada en partidas
    await addDoc(partidasRef, {
      puntos: rachaFinal * 10,
      fecha: Timestamp.now(),
      objetosCorrectos: rachaFinal,
      precisionMedia: precisionCalculada,
      objetosJugados: objetosJugadosEnEstaPartida,
    });

    console.log("✅ Resultados actualizados correctamente");
  } catch (error) {
    console.error("❌ Error guardando resultados:", error);
  }
};



const { width } = Dimensions.get('window');

export default function Juego() {
  const router = useRouter();
  const db = getFirestore(app);

  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(300);
  const [modalTiempoAgotado, setModalTiempoAgotado] = useState(false);
  const [modalIncorrecto, setModalIncorrecto] = useState(false);
  const [modalCorrecto, setModalCorrecto] = useState(false);
  const [racha, setRacha] = useState(0);
  const [retoActual, setRetoActual] = useState<string>('');
  const [variantesReto, setVariantesReto] = useState<Array<string> | null>(null);
  const animacion = useRef(new Animated.Value(1)).current;

  const seleccionarImagen = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const uri = result.assets[0].uri;
      setImagenSeleccionada(uri);
    }
  };

  const eliminarImagen = () => {
    setImagenSeleccionada(null);
  };

  const obtenerRetoAleatorio = async () => {
    try {
      const q = query(collection(db, 'retos'), where('activo', '==', true));
      const snapshot = await getDocs(q);
      const documentos = snapshot.docs;

      if (documentos.length === 0) {
        console.warn('No hay retos disponibles');
        return;
      }

      const indiceAleatorio = Math.floor(Math.random() * documentos.length);
      const reto = documentos[indiceAleatorio].data();

      setRetoActual(reto.palabra);
      setVariantesReto(reto.variantes ?? []);
    } catch (error) {
      console.error('Error obteniendo reto aleatorio:', error);
    }
  };

  const analizarImagen = async () => {
    if (!imagenSeleccionada) {
      console.warn("⚠️ No hay imagen seleccionada");
      return [];
    }

    try {
      console.log("📤 Subiendo imagen...");
      const response = await fetch(imagenSeleccionada);
      const blob = await response.blob();
      const filename = `${uuid.v4()}.jpg`;

      const storage = getStorage();
      const storageRef = ref(storage, `imagenes/${filename}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      console.log("🌐 URL de imagen subida:", downloadURL);

      // ✅ CONFIGURACIÓN CORRECTA DE FUNCTIONS
      const visionFunction = httpsCallable(functions, 'analizarImagen');

      const result = await visionFunction({ imageUrl: downloadURL }) as any;
      console.log("✅ Etiquetas recibidas:", result.data.etiquetas);

      return result.data.etiquetas.map((et) => et.toLowerCase());
    } catch (error) {
      console.error('❌ Error analizando imagen:', error);
      return [];
    }
  };



  const comprobarImagen = async () => {
    console.log("Comprobando imagen...");

    const etiquetas = await analizarImagen();
    console.log("Reto actual:", retoActual);
    console.log("Variantes del reto:", variantesReto);

    const etiquetasLower = etiquetas.map((etiqueta) => etiqueta.toLowerCase());

    const esCorrecta =
      Array.isArray(variantesReto) &&
      variantesReto.some((variante) =>
        etiquetasLower.includes(variante.toLowerCase())
      );

    console.log("¿Es correcta?", esCorrecta);

    if (esCorrecta) {
      setRacha((prev) => prev + 1);
      setModalCorrecto(true);
    } else {
      setModalIncorrecto(true);
    }
  };





  const formatearTiempo = (seg: number) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    obtenerRetoAleatorio();
  }, []);

  useEffect(() => {
    if (tiempoRestante <= 0) {
      Animated.sequence([
        Animated.timing(animacion, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animacion, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setModalTiempoAgotado(true);
      return;
    }

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [tiempoRestante]);

  const iniciarNuevoReto = () => {
    setModalCorrecto(false);
    setImagenSeleccionada(null);
    setTiempoRestante(300);
    obtenerRetoAleatorio();
  };

  const reiniciarJuegoCompleto = () => {
    setImagenSeleccionada(null);
    setTiempoRestante(300);
    setRacha(0);
    setModalCorrecto(false);
    setModalIncorrecto(false);
    setModalTiempoAgotado(false);
    setRetoActual('');
  };

  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setMostrarModalCerrar(true)}
      >
        <AntDesign name="close" size={24} color="#D9534F" />
      </TouchableOpacity>

      <Text style={styles.title}>Reto actual:</Text>
      <Text style={styles.challenge}>
        📸 Encuentra y sube una imagen de un/una{' '}
        <Text style={styles.highlight}>{retoActual}</Text>
      </Text>

      <Animated.Text style={[styles.timer, { transform: [{ scale: animacion }] }]}>
        ⏳ {formatearTiempo(tiempoRestante)}
      </Animated.Text>

      <View style={styles.box}>
        {imagenSeleccionada ? (
          <>
            <Image source={{ uri: imagenSeleccionada }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.deleteButton} onPress={eliminarImagen}>
              <AntDesign name="closecircle" size={24} color="#D9534F" />
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.boxText}>Toca aquí para seleccionar una imagen</Text>
        )}
      </View>

      <TouchableOpacity style={styles.uploadButton} onPress={seleccionarImagen}>
        <Text style={styles.uploadButtonText}>
          {imagenSeleccionada ? 'Cambiar imagen' : 'Seleccionar imagen'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkButton, { backgroundColor: imagenSeleccionada ? '#478783' : '#ccc' }]}
        onPress={comprobarImagen}
        disabled={!imagenSeleccionada}
      >
        <Text style={styles.uploadButtonText}>Comprobar</Text>
      </TouchableOpacity>

      {mostrarModalCerrar && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cerrar juego</Text>
            <Text style={styles.modalText}>¿Estás seguro de que quieres salir? Se perderá el progreso.</Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setMostrarModalCerrar(false)}
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
              >
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setMostrarModalCerrar(false);
                  reiniciarJuegoCompleto();
                  router.replace('/home');
                }}
                style={[styles.modalButton, { backgroundColor: '#D9534F' }]}
              >
                <Text style={{ color: 'white' }}>Salir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {modalCorrecto && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>✅ ¡Correcto!</Text>
            <Text style={styles.modalText}>Racha: {racha}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#478783', marginTop: 10 }]}
              onPress={iniciarNuevoReto}
            >
              <Text style={{ color: 'white' }}>Siguiente reto</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {modalIncorrecto && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>❌ Objeto incorrecto</Text>
            <Text style={styles.modalText}>¡Fin de la partida!</Text>
            <Text style={styles.modalText}>Puntuación final: {racha}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#478783', marginTop: 10 }]}
              onPress={async () => {
                await guardarResultadosPartida(racha);
                reiniciarJuegoCompleto();
                router.replace('/home');
              }}
            >
              <Text style={{ color: 'white' }}>Volver al inicio</Text>
            </TouchableOpacity>
            
          </View>
        </View>
      )}
      {modalTiempoAgotado && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>⏰ Tiempo agotado</Text>
            <Text style={styles.modalText}>Puntuación final: {racha}</Text>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#478783', marginTop: 10 }]}
              onPress={async () => {
                await guardarResultadosPartida(racha);
                reiniciarJuegoCompleto();
                router.replace('/home');
              }}
            >
              <Text style={{ color: 'white' }}>Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f6f8fa',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 30,
    color: '#2f5856',
  },
  challenge: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 20,
    color: '#333',
    lineHeight: 26,
  },
  highlight: {
    color: '#478783',
    fontWeight: 'bold',
  },
  timer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D9534F',
    marginBottom: 20,
  },
  box: {
    width: width * 0.8,
    height: width * 0.6,
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
    overflow: 'hidden',
  },
  boxText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  uploadButton: {
    marginTop: 20,
    backgroundColor: '#478783',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  checkButton: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 20,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  modalOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0,0,0,0.5)',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
},
modalContainer: {
  width: '80%',
  backgroundColor: '#fff',
  borderRadius: 10,
  padding: 20,
  alignItems: 'center',
  elevation: 5,
},
modalTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 10,
  color: '#D9534F',
},
modalText: {
  fontSize: 16,
  marginBottom: 20,
  textAlign: 'center',
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
},
modalButton: {
  flex: 1,
  padding: 10,
  marginHorizontal: 5,
  borderRadius: 6,
  alignItems: 'center',
},


});
