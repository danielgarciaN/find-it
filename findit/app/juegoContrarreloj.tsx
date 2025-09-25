import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, Animated } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { AntDesign } from '@expo/vector-icons';
import { getFirestore, collection, getDocs, query, where, doc, getDoc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAuth } from 'firebase/auth';
import uuid from 'react-native-uuid';
import { app } from '../firebase';
import { router } from 'expo-router';
import { functions } from '../firebase'; 

const { width } = Dimensions.get('window');

export default function JuegoContrarreloj() {
  const db = getFirestore(app);
  const auth = getAuth();
  const [imagenSeleccionada, setImagenSeleccionada] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState(300); // 5 minutos
  const [modalFinal, setModalFinal] = useState(false);
  const [racha, setRacha] = useState(0);
  const [fallos, setFallos] = useState(0);
  const [retoActual, setRetoActual] = useState<string>('');
  const animacion = useRef(new Animated.Value(1)).current;
  const [variantesReto, setVariantesReto] = useState<Array<string> | null>(null);
  

  const seleccionarImagen = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', copyToCacheDirectory: true, multiple: false });
    if (!result.canceled && result.assets?.length > 0) setImagenSeleccionada(result.assets[0].uri);
  };

  const eliminarImagen = () => setImagenSeleccionada(null);

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
    } else {
      setFallos((prev) => prev + 1);
    }

    setImagenSeleccionada(null);
    obtenerRetoAleatorio();
  };

  const guardarResultadosContrarreloj = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const partidasRef = collection(db, "users", user.uid, "partidasContrarreloj");

    try {
      const userDoc = await getDoc(userRef);
      const datos = userDoc.data() || {};

      const objetosAnteriores = datos.objetosEncontrados || 0;
      const partidasAnteriores = datos.partidasTotales || 0;
      const objetosJugadosAnteriores = datos.objetosJugados || 0;

      const objetosEncontradosTotales = objetosAnteriores + racha;
      const partidasTotales = partidasAnteriores + 1;
      const objetosJugadosEnEstaPartida = racha + fallos;
      const objetosJugadosTotales = objetosJugadosAnteriores + objetosJugadosEnEstaPartida;

      const precisionCalculada = objetosJugadosTotales > 0
        ? Math.round((objetosEncontradosTotales / objetosJugadosTotales) * 100)
        : 0;

      await updateDoc(userRef, {
        objetosEncontrados: objetosEncontradosTotales,
        partidasTotales: partidasTotales,
        precision: precisionCalculada,
        objetosJugados: objetosJugadosTotales,
      });

      await addDoc(partidasRef, {
        puntos: racha,
        fecha: Timestamp.now(),
        objetosCorrectos: racha,
        objetosFallados: fallos,
        precisionMedia: precisionCalculada,
      });

      console.log("✅ Estadísticas y partida Contrarreloj guardadas");
    } catch (error) {
      console.error("❌ Error guardando resultados:", error);
    }
  };

  const formatearTiempo = (seg: number) => {
    const m = Math.floor(seg / 60).toString().padStart(2, '0');
    const s = (seg % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => { obtenerRetoAleatorio(); }, []);

  useEffect(() => {
    if (tiempoRestante <= 0) {
      Animated.sequence([
        Animated.timing(animacion, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(animacion, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setModalFinal(true);
      return;
    }

    const intervalo = setInterval(() => {
      setTiempoRestante((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [tiempoRestante]);

  const finalizarPartida = async () => {
    await guardarResultadosContrarreloj();
    router.replace('/home');
  };

  const [mostrarModalCerrar, setMostrarModalCerrar] = useState(false);
  const cerrarJuego = () => {
    setMostrarModalCerrar(false);
    setImagenSeleccionada(null);
    setTiempoRestante(300);
    setRacha(0);
    setFallos(0);
    setModalFinal(false);
    setRetoActual('');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={() => setMostrarModalCerrar(true)}>
        <AntDesign name="close" size={24} color="#D9534F" />
      </TouchableOpacity>

      <Text style={styles.title}>Reto actual:</Text>
      <Text style={styles.challenge}>📸 Encuentra y sube una imagen de un/una <Text style={styles.highlight}>{retoActual}</Text></Text>

      <Animated.Text style={[styles.timer, { transform: [{ scale: animacion }] }]}>⏳ {formatearTiempo(tiempoRestante)}</Animated.Text>
      <Text style={styles.racha}>Objetos correctos: {racha}</Text>
      <Text style={styles.racha}>Objetos fallados: {fallos}</Text>

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
        <Text style={styles.uploadButtonText}>{imagenSeleccionada ? 'Cambiar imagen' : 'Seleccionar imagen'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.checkButton, { backgroundColor: imagenSeleccionada ? '#478783' : '#ccc' }]}
        onPress={comprobarImagen}
        disabled={!imagenSeleccionada}
      >
        <Text style={styles.uploadButtonText}>Comprobar</Text>
      </TouchableOpacity>

      {modalFinal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>⏰ ¡Tiempo agotado!</Text>
            <Text style={styles.modalText}>Objetos correctos: {racha}</Text>
            <Text style={styles.modalText}>Objetos fallados: {fallos}</Text>
            <TouchableOpacity style={styles.modalButtonFinalizar} onPress={finalizarPartida}>
              <Text style={styles.modalButtonText}>Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {mostrarModalCerrar && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Cerrar juego</Text>
            <Text style={styles.modalText}>¿Seguro que quieres salir? Perderás tu progreso actual.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setMostrarModalCerrar(false)}>
                <Text>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#D9534F' }]} onPress={() => { cerrarJuego(); router.replace('/home'); }}>
                <Text style={{ color: 'white' }}>Salir</Text>
              </TouchableOpacity>
            </View>
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
    marginBottom: 10,
  },
  racha: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f5856',
    marginBottom: 10,
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
  modal: {
    marginTop: 40,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
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
    zIndex: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f5856',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalButtonFinalizar: {
    marginTop: 16,
    backgroundColor: '#478783',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
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
    zIndex: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 6,
    alignItems: 'center',
  },

});
