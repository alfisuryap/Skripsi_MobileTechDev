import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TextInput,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen( { navigation } ) {
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const getUserName = async () => {
            const name = await AsyncStorage.getItem('user_nama');
            console.log('Stored user_nama:', name);
            if (name) setUserName(name);
        };
        getUserName();
    }, []);


    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('user_email');
            await AsyncStorage.removeItem('user_nama');
            navigation.replace('LoginScreen');
        } catch (error) {
            console.error('Gagal logout:', error);
        }
    };


    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Image
                        source={require('../assets/bg_header.png')}
                        style={styles.headerImage}
                    />
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.greeting}>Good Morning, {userName}</Text>
                        <Text style={styles.subGreeting}>Have a nice day!</Text>
                    </View>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#999" style={{ marginLeft: 10 }} />
                    <TextInput
                        placeholder="Search"
                        style={styles.searchInput}
                    />
                </View>

                {/* Attendance */}
                <View style={styles.attendanceCard}>
                    <Text style={styles.attendanceTitle}>Attendance</Text>
                    <View style={styles.attendanceRow}>
                        <FontAwesome name="calendar" size={16} color="#000" />
                        <Text style={styles.attendanceDate}>Thu, 12 Dec 2024</Text>
                    </View>
                    <View style={styles.clockRow}>
                        <Text style={styles.clockLabel}>Clock In</Text>
                        <Text style={styles.clockValue}>--:--</Text>
                    </View>
                    <View style={styles.clockRow}>
                        <Text style={styles.clockLabel}>Clock Out</Text>
                        <Text style={styles.clockValue}>--:--</Text>
                    </View>
                    <TouchableOpacity style={styles.clockButton}>
                        <Text style={styles.clockButtonText}>Clock In</Text>
                    </TouchableOpacity>
                </View>

                {/* Health Risk Assessment */}
                <View style={styles.hraContainer}>
                    <View style={styles.hraHeader}>
                        <Text style={styles.hraTitle}>Health Risk Assessment</Text>
                        <Ionicons name="chevron-forward" size={20} color="#2f80ed" />
                    </View>
                    <View style={styles.hraContent}>
                        <View style={styles.hraBox}>
                            <Text style={styles.hraLabel}>General</Text>
                            <Text style={styles.hraValue}>80 Danger/Risk</Text>
                        </View>
                        <View style={styles.hraBox}>
                            <Text style={styles.hraLabel}>Personal</Text>
                            <Text style={styles.hraValue}>-</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.jobSurveyButton}>
                        <Text style={styles.jobSurveyText}>Job Survey</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'relative',
    },
    headerImage: {
        width: '100%',
        height: 200,
    },
    headerTextContainer: {
        position: 'absolute',
        top: 100,
        left: 20,
    },
    greeting: {
        fontSize: 25,
        fontWeight: '600',
        color: 'white',
    },
    subGreeting: {
        fontSize: 18,
        color: 'white',
    },
    time: {
        color: '#fff',
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        margin: 16,
        borderRadius: 12,
        paddingHorizontal: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        paddingLeft: 10,
    },
    attendanceCard: {
        backgroundColor: '#fefefe',
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        marginBottom: 16,
    },
    attendanceTitle: {
        fontWeight: 'bold',
        color: '#2f80ed',
        fontSize: 14,
        marginBottom: 8,
    },
    attendanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    attendanceDate: {
        marginLeft: 8,
        fontSize: 13,
    },
    clockRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    clockLabel: {
        fontSize: 13,
    },
    clockValue: {
        fontSize: 13,
        fontWeight: 'bold',
    },
    clockButton: {
        backgroundColor: '#2f80ed',
        paddingVertical: 10,
        borderRadius: 10,
        marginTop: 12,
    },
    clockButtonText: {
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600',
    },
    hraContainer: {
        marginHorizontal: 16,
        padding: 16,
        borderRadius: 12,
        borderColor: '#e0e0e0',
        borderWidth: 1,
        backgroundColor: '#fefefe',
        marginBottom: 16,
    },
    hraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    hraTitle: {
        color: '#2f80ed',
        fontWeight: 'bold',
    },
    hraContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    hraBox: {
        alignItems: 'center',
        flex: 1,
    },
    hraLabel: {
        fontSize: 12,
        color: '#999',
    },
    hraValue: {
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 4,
    },
    jobSurveyButton: {
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#2f80ed',
        borderRadius: 8,
        paddingVertical: 10,
    },
    jobSurveyText: {
        textAlign: 'center',
        color: '#2f80ed',
        fontWeight: '600',
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        paddingVertical: 12,
        marginHorizontal: 16,
        marginBottom: 24,
        borderRadius: 8,
    },
    logoutText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 16,
    },

});
