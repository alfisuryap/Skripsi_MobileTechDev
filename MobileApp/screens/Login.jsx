import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
} from 'react-native';
import { supabase } from '../config/supabase'
import bcrypt from 'bcryptjs';
import { Alert } from 'react-native';
import Checkbox from 'expo-checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log(">>> LoginScreen loaded");

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);

  const handleLogin = async () => {
    await AsyncStorage.removeItem("user_data");
    await supabase.auth.signOut();

    if (!email || !password) {
      Alert.alert('Validasi Gagal', 'Mohon isi email dan password');
      return;
    }

    try {
      // 🔐 Gunakan Supabase Auth
      console.log("LOGIN INPUT:", email, password);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      console.log("LOGIN:", { data, error });

      if (error) {
        Alert.alert('Login gagal', error.message);
        return;
      }
      const user_id = data.user.id; // ✅ UUID dari Supabase Auth

      // 🔄 Ambil data dari tabel AkunManagement untuk nama lengkap dsb
      const { data: akunData, error: akunError } = await supabase
        .from('AkunManagement')
        .select('*')
        .eq('user_id', user_id)
        .single();

      if (akunError || !akunData) {
        Alert.alert('Login gagal', 'Data akun tidak ditemukan');
        return;
      }

      Alert.alert('Login berhasil', `Selamat datang, ${akunData.nama_lengkap}`);
      console.log('Login Success');
      await AsyncStorage.setItem('user_nama', akunData.nama_lengkap);
      await AsyncStorage.setItem('user_email', akunData.email);

      const now = new Date().getTime();
      await AsyncStorage.setItem('login_timestamp', now.toString());

      if (keepSignedIn) {
        await AsyncStorage.setItem('isLoggedIn', 'true');
      } else {
        await AsyncStorage.removeItem('isLoggedIn');
      }

      const userObject = {
        id: user_id,
        nama: akunData.nama_lengkap,
        email: akunData.email,
        role: akunData.role,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userObject));

      navigation.replace('MainTabs');
    } catch (err) {
      Alert.alert('Terjadi kesalahan', err.message);
    }
  };


  return (
    <ImageBackground
      source={require('../assets/BG_Login.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.card}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Please enter your email and password</Text>

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="name@mail.com"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.helper}>Please input your email</Text>

        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="**********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Text style={styles.helper}>Please input your password</Text>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.checkboxContainer}>
          <Checkbox
            value={keepSignedIn}
            onValueChange={setKeepSignedIn}
          />
          <Text style={styles.checkboxLabel}>Keep me signed in</Text>
        </View>

        <Image
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#0A2A47",
  },
  card: {
    width: '85%',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 42,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 6,
    backgroundColor: '#f9f9f9',
  },
  helper: {
    fontSize: 12,
    color: '#999',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  button: {
    backgroundColor: '#3478F6',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    marginTop: 14,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    alignSelf: 'flex-start',
  },
  checkboxLabel: {
    marginLeft: 6,
    color: '#333',
  },
  logo: {
    width: 100,
    height: 40,
    marginTop: 24,
  },
});