import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../config/supabase'
import bcrypt from 'bcryptjs';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase
      .from('AkunManagement')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      Alert.alert('Login gagal', 'Email tidak ditemukan');
      return;
    }

    const match = await bcrypt.compare(password, data.password);
    if (!match) {
      Alert.alert('Login gagal', 'Password salah');
      return;
    }

    Alert.alert('Login berhasil', `Selamat datang, ${data.nama_lengkap}`);
    // navigation.navigate('Home'); // setelah nanti ada home
  };

  return (
    <View style={{ padding: 20, marginTop: 100 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>
      <TextInput
        placeholder="Email"
        onChangeText={setEmail}
        value={email}
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
      />
      <TextInput
        placeholder="Password"
        onChangeText={setPassword}
        value={password}
        secureTextEntry
        style={{ borderWidth: 1, marginBottom: 20, padding: 8 }}
      />
      <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: '#4F46E5', padding: 12, borderRadius: 6 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}
