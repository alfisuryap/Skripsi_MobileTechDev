import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

console.log('Splash Screen');

export default function SplashScreen({ navigation }) {
    useEffect(() => {
        const checkLogin = async () => {
            const keep = await AsyncStorage.getItem('keep_signed_in');
            const timestamp = await AsyncStorage.getItem('login_timestamp');

            if (keep === 'true') {
                navigation.replace('HomeScreen');
            } else if (timestamp) {
                const now = new Date().getTime();
                const diff = now - parseInt(timestamp, 10);

                // 5 menit = 5 * 60 * 1000 ms = 300000
                if (diff < 300000) {
                    navigation.replace('HomeScreen');
                } else {
                    await AsyncStorage.clear(); // auto logout setelah timeout
                    navigation.replace('LoginScreen');
                }
            } else {
                navigation.replace('LoginScreen');
            }
        };

        setTimeout(checkLogin, 2000); // kasih delay animasi splash
    }, []);

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/splash.png')}
                style={styles.image}
                resizeMode="cover"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    image: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
});
