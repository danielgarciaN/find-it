import React, { useState, useEffect } from "react";
import Icon from 'react-native-vector-icons/Ionicons';

import {
  Text,
  StyleSheet,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
  SafeAreaView,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { getFirestore, doc, updateDoc, getDoc } from "firebase/firestore";

export default function Settings() {
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore();
  
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    profilePictureUrl: null
  });
  
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPhoneNumber, setTempPhoneNumber] = useState("");
  
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          // Obtener datos básicos de Auth
          const userBasicData = {
            name: currentUser.displayName || "",
            email: currentUser.email || "",
            phoneNumber: currentUser.phoneNumber || "",
            profilePictureUrl: currentUser.photoURL
          };
          
          setUserData(userBasicData);
          setTempName(userBasicData.name);
          setTempPhoneNumber(userBasicData.phoneNumber);
          
          // Obtener datos adicionales de Firestore
          try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
              const firestoreData = userDoc.data();
              // Actualizar configuraciones de la app
              if (firestoreData.preferences) {
                setNotifications(firestoreData.preferences.notifications ?? true);
                setSounds(firestoreData.preferences.sounds ?? true);
                setDarkMode(firestoreData.preferences.darkMode ?? false);
              }
            }
          } catch (firestoreError) {
            console.error("Error loading Firestore data:", firestoreError);
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/');
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "No se pudo cerrar sesión. Inténtalo de nuevo.");
    }
  };

  const handleSaveProfile = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        // Actualizar perfil en Authentication
        await updateProfile(currentUser, {
          displayName: tempName
        });
        
        // Actualizar perfil en Firestore
        await updateDoc(doc(db, "users", currentUser.uid), {
          name: tempName,
          phoneNumber: tempPhoneNumber
        });
        
        // Actualizar estado local
        setUserData({
          ...userData,
          name: tempName,
          phoneNumber: tempPhoneNumber
        });
        
        setEditing(false);
        Alert.alert("Éxito", "Perfil actualizado correctamente");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "No se pudo actualizar el perfil. Inténtalo de nuevo.");
    }
  };

  const handleSavePreferences = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await updateDoc(doc(db, "users", currentUser.uid), {
          "preferences.notifications": notifications,
          "preferences.sounds": sounds,
          "preferences.darkMode": darkMode
        });
        
        Alert.alert("Éxito", "Preferencias guardadas correctamente");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      Alert.alert("Error", "No se pudieron guardar las preferencias. Inténtalo de nuevo.");
    }
  };

  const handleChangeProfilePicture = () => {
    // Esta funcionalidad requeriría acceso a la cámara o galería
    Alert.alert("Próximamente", "Esta función estará disponible en futuras versiones.");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon 
            name="arrow-back" 
            size={24} 
            color="#fff" 
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil</Text>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={handleChangeProfilePicture} style={styles.profileImageContainer}>
              {userData.profilePictureUrl ? (
                <Image source={{ uri: userData.profilePictureUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profilePlaceholderText}>
                    {userData.name ? userData.name.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}
              <View style={styles.editImageButton}>
                <Text style={styles.editImageButtonText}>+</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.profileInfo}>
              {editing ? (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Nombre:</Text>
                    <TextInput
                      style={styles.input}
                      value={tempName}
                      onChangeText={setTempName}
                      placeholder="Tu nombre"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Teléfono:</Text>
                    <TextInput
                      style={styles.input}
                      value={tempPhoneNumber}
                      onChangeText={setTempPhoneNumber}
                      placeholder="Tu teléfono"
                      keyboardType="phone-pad"
                    />
                  </View>
                  
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Email:</Text>
                    <Text style={styles.emailText}>{userData.email}</Text>
                    <Text style={styles.emailNote}>El email no se puede cambiar</Text>
                  </View>
                  
                  <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => setEditing(false)} style={[styles.actionButton, styles.cancelButton]}>
                      <Text style={styles.actionButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveProfile} style={styles.actionButton}>
                      <Text style={styles.actionButtonText}>Guardar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.profileName}>{userData.name || "Usuario"}</Text>
                  <Text style={styles.profileEmail}>{userData.email || ""}</Text>
                  {userData.phoneNumber ? (
                    <Text style={styles.profilePhone}>{userData.phoneNumber}</Text>
                  ) : null}
                  
                  <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
                    <Text style={styles.editButtonText}>Editar perfil</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>

        {/* App Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias de la aplicación</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Setting 1</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#c7d1d8", true: "#478783" }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Setting 2</Text>
            <Switch
              value={sounds}
              onValueChange={setSounds}
              trackColor={{ false: "#c7d1d8", true: "#478783" }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Setting 3</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: "#c7d1d8", true: "#478783" }}
              thumbColor="#fff"
            />
          </View>
          
          <TouchableOpacity onPress={handleSavePreferences} style={styles.savePreferencesButton}>
            <Text style={styles.savePreferencesButtonText}>Guardar preferencias</Text>
          </TouchableOpacity>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acerca de</Text>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Versión</Text>
            <Text style={styles.aboutText}>1.0.0</Text>
          </View>
          
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Desarrollado por</Text>
            <Text style={styles.aboutText}>Equipo FindIt</Text>
          </View>
        </View>
        
        {/* Logout Button */}
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f6f8fa",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#478783',
    padding: 15,
    paddingTop: 20,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerRight: {
    width: 30,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f5856',
    marginBottom: 16,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profilePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#c7d1d8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePlaceholderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#478783',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  editImageButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#478783',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  emailText: {
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  emailNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    backgroundColor: '#478783',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#c7d1d8',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  savePreferencesButton: {
    backgroundColor: '#478783',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  savePreferencesButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#333',
  },
  aboutText: {
    fontSize: 16,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});