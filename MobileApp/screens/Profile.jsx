import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';

console.log('Profile Screen');

export default function ProfileScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const route = useRoute();
    const [loading, setLoading] = useState(true);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const fetchUser = async () => {
        setLoading(true);
        try {
            const raw = await AsyncStorage.getItem('user');
            if (!raw) return;

            let parsed = null;
            try {
                parsed = JSON.parse(raw);
            } catch (e) {
                console.warn("Corrupted user data. Clearing...");
                await AsyncStorage.removeItem('user');
                return;
            }

            setUser(parsed);
        } catch (err) {
            console.error("Error fetching user:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [route.params?.refresh]);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            await AsyncStorage.clear();
            navigation.replace('LoginScreen');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const handleEditProfile = () => {
        navigation.navigate('EditProfileScreen', {
            onGoBack: () => fetchUser(),
        })
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchUser();
        }, [])
    );

    const buildImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const url = `https://cghmehqpyvjeghukblxm.supabase.co/storage/v1/object/public/fotoprofile/${path.startsWith('akun/') ? path : 'akun/' + path}`;
        return `${url}?t=${Date.now()}`;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 50 }}>Loading Profile...</Text>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: 'center', marginTop: 50, color: 'red' }}>
                    No user data found.
                </Text>
                <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
                <LogoutModal
                    visible={showLogoutModal}
                    onConfirm={() => {
                        setShowLogoutModal(false);
                        handleLogout();
                    }}
                    onCancel={() => setShowLogoutModal(false)}
                />
            </View>
        );
    }

    if (!user) return null;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Image
                    source={
                        user?.foto_profile
                            ? (() => {
                                const url = buildImageUrl(user.foto_profile);
                                console.log("📸 Image URL:", url);
                                return { uri: url };
                            })()
                            : require('../assets/avatar.png')
                    } style={styles.avatar}
                />
                <View style={styles.infoBox}>
                    <Text style={styles.name}>{user.nama}</Text>
                    <Text style={styles.value}>{user.email}</Text>
                    <Text style={styles.value}>{user.role}</Text>

                    <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                        <Text style={styles.editButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={() => setShowLogoutModal(true)}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
            <LogoutModal
                visible={showLogoutModal}
                onConfirm={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                }}
                onCancel={() => setShowLogoutModal(false)}
            />
        </View >
    );
}

const LogoutModal = ({ visible, onConfirm, onCancel }) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
        >
            <View style={styles.modalBackground}>
                <View style={styles.modalContainer}>
                    <View style={styles.iconWrapper}>
                        <Text style={styles.icon}>❓</Text>
                    </View>
                    <Text style={styles.title}>Confirmation</Text>
                    <Text style={styles.message}>Are you sure you want to log out?</Text>

                    <TouchableOpacity style={styles.yesButton} onPress={onConfirm}>
                        <Text style={styles.yesText}>Yes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        justifyContent: "space-between",
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#f5f6fa',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
        elevation: 3,
        marginTop: 40,
    },
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        marginRight: 20,
        backgroundColor: '#ddd',
    },
    infoBox: {
        flex: 1,
    },
    name: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 2,
        color: '#2f80ed',
    },
    value: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 2,
    },
    editButton: {
        marginTop: 8,
        backgroundColor: '#2f80ed',
        paddingVertical: 10,
        borderRadius: 6,
    },
    editButtonText: {
        textAlign: 'center',
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    },
    logoutButton: {
        borderColor: '#298BDA',
        borderWidth: 1,
        paddingVertical: 12,
        borderRadius: 8,
    },
    logoutText: {
        color: '#298BDA',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: 300,
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    iconWrapper: {
        backgroundColor: '#FFD600',
        borderRadius: 999,
        padding: 12,
        marginBottom: 16,
    },
    icon: {
        fontSize: 32,
        color: '#fff',
    },
    title: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#555',
        textAlign: 'center',
        marginBottom: 24,
    },
    yesButton: {
        backgroundColor: '#2196F3',
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 10,
        width: '100%',
        marginBottom: 12,
    },
    yesText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#F1F1F1',
        paddingVertical: 10,
        paddingHorizontal: 32,
        borderRadius: 10,
        width: '100%',
    },
    cancelText: {
        color: '#333',
        textAlign: 'center',
        fontWeight: '600',
    },
});
