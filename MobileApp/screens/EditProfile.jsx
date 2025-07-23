import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode as atob } from 'base-64';


export default function EditProfileScreen() {
    const navigation = useNavigation();
    const [profile, setProfile] = useState(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const init = async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission required', 'We need access to your gallery!');
                return;
            }

            try {
                const rawUser = await AsyncStorage.getItem('user');
                if (!rawUser) return;

                const parsedUser = JSON.parse(rawUser);
                setUser(parsedUser);
                await getProfile(parsedUser);
            } catch (err) {
                console.error("Gagal ambil user:", err);
            }
        };

        init();
    }, []);

    async function getProfile(userFromStorage) {
        const user_id = userFromStorage?.id;
        if (!user_id) return console.error("User ID tidak ditemukan");

        const { data, error } = await supabase
            .from('AkunManagement')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error);
            return;
        }

        setProfile(data);
        setFullName(data.nama_lengkap);
        setEmail(data.email);
        setImageUrl(data.foto_profile || '');
    }

    async function updateProfile() {
        try {
            const rawUser = await AsyncStorage.getItem('user');
            if (!rawUser) return console.error("User data tidak ditemukan di storage");

            const parsedUser = JSON.parse(rawUser);
            const user_id = parsedUser.id;

            if (!user_id) return console.error("User ID tidak ditemukan di storage");

            const { data: authData, error: authError } = await supabase.auth.updateUser({
                email: email,
            });

            if (authError) {
                console.error("Gagal update email Auth:", authError);
                Alert.alert("Error", authError.message || "Gagal update email");
                return;
            }

            const { error: dbError } = await supabase
                .from('AkunManagement')
                .update({ nama_lengkap: fullName, email: email })
                .eq('user_id', user_id);

            if (dbError) {
                console.error("Gagal update DB:", dbError);
                Alert.alert("Error", "Profil gagal diperbarui di database");
                return;
            }

            Alert.alert(
                'Berhasil',
                'Profil diperbarui. Cek email untuk konfirmasi email baru ya! 📧',
                [{
                    text: 'OK', onPress: () => {
                        navigation.navigate("MainTabs", {
                            screen: "Profile",
                            params: { refresh: true },
                        });
                    }
                }]
            );
        } catch (error) {
            console.error("Failed to update user:", error);
            Alert.alert("Gagal", "Terjadi error saat update profile");
        }
        if (route.params?.onGoBack) route.params.onGoBack();
        navigation.goBack();
    }

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                base64: true,
                quality: 1,
            });

            if (result.canceled) return;

            const asset = result.assets[0];
            const fileExt = asset.uri.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `akun/${fileName}`;

            const base64 = asset.base64;
            const binary = atob(base64);
            const byteArray = new Uint8Array([...binary].map(char => char.charCodeAt(0)));

            const { data, error } = await supabase.storage
                .from('fotoprofile')
                .upload(filePath, byteArray, {
                    contentType: `akun/${fileExt}`,
                    upsert: true,
                });

            if (error) {
                console.error("Upload failed:", error);
                Alert.alert("Gagal", "Upload gambar gagal");
                return;
            }

            const { data: publicData } = supabase.storage.from('fotoprofile').getPublicUrl(filePath);
            setImageUrl(publicData.publicUrl);

            const rawUser = await AsyncStorage.getItem('user');
            const parsedUser = JSON.parse(rawUser);
            const user_id = parsedUser?.id;

            const { error: updateError } = await supabase
                .from('AkunManagement')
                .update({ foto_profile: publicData.publicUrl })
                .eq('user_id', user_id);

            if (updateError) {
                console.error("Update DB error:", updateError);
                Alert.alert("Gagal", "Update database gagal");
            }

            Alert.alert("Berhasil", "Foto profil berhasil diperbarui ✅");
        } catch (err) {
            console.error("Error di pickImage:", err);
            Alert.alert("Error", "Terjadi kesalahan saat memilih gambar");
        }
    };

    async function resetPassword() {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (!error) {
            console.log('Email yang dikirim:', email);
            Alert.alert('Email Terkirim', 'Cek inbox untuk reset password.');
        } else {
            console.error("Error di pickImage:", error);
        }
    }

    return (
        <View style={{ padding: 20, marginTop: 30 }}>
            {/* Tombol Back */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 15 }}>
                <Text style={{ fontSize: 18 }}>← Edit Profil</Text>
            </TouchableOpacity>

            <View style={styles.container}>
                <Image
                    source={
                        imageUrl
                            ? { uri: imageUrl }
                            : require('../assets/avatar.png')
                    }
                    style={styles.avatar}
                />
            </View>
            <Button title="Ganti Foto Profil" onPress={pickImage} />
            <View style={{ height: 10 }} />

            <Text>Nama Lengkap</Text>
            <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
            />

            <Text>Email</Text>
            <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, padding: 8, marginBottom: 10 }}
            />

            <TouchableOpacity style={styles.saveButton} onPress={updateProfile}>
                <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.restButton} onPress={resetPassword}>
                <Text style={styles.resetButtonText}>Reset Password</Text>
            </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: 'center',
        marginBottom: 20,

    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#ddd',
        marginBottom: -15,
    },
    saveButton: {
        marginTop: 8,
        backgroundColor: '#2f80ed',
        paddingVertical: 15,
        borderRadius: 6,
    },
    saveButtonText: {
        textAlign: 'center',
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    restButton: {
        marginTop: 8,
        borderColor: '#ed2f2fff',
        paddingVertical: 15,
        borderRadius: 6,
        borderWidth: 2
    },
    resetButtonText: {
        textAlign: 'center',
        color: '#ed2f2fff',
        fontWeight: '600',
        fontSize: 16,
    },
})