import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from "react-native";

export default function ClockInSuccess({ route, navigation }) {
    const { clockOutTime } = route.params;

    const date = new Date(clockOutTime);

    const formattedDate = date.toLocaleDateString("en-GB", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
    }).replaceAll(".", ":");


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Work From Office</Text>
                <Text style={styles.date}>{formattedDate}</Text>
                <Text style={styles.time}>{formattedTime}</Text>

                <View style={styles.circle}>
                    <Text style={styles.checkmark}>✓</Text>
                </View>

                <Text style={styles.hooray}>Hooray!</Text>
                <Text style={styles.subtext}>You successfully clocked out!</Text>
            </View>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                        navigation.navigate("MainTabs", {
                            screen: "HomeScreen",
                            params: { refresh: true },
                        });
                    }
                }
            >
                <Text style={styles.buttonText}>Back to Home</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 80,
        paddingBottom: 40,
        paddingHorizontal: 24,
        alignItems: "center",
        backgroundColor: "#fff",
        justifyContent: "space-between",
    },
    content: {
        marginTop:250,
        alignItems: "center",
    },
    title: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#2b2d42",
    },
    date: {
        fontSize: 16,
        color: "#555",
        marginTop: 6,
    },
    time: {
        fontSize: 32,
        fontWeight: "bold",
        marginTop: 8,
        color: "#2b2d42",
    },
    circle: {
        marginTop: 40,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "#2ecc71",
        alignItems: "center",
        justifyContent: "center",
    },
    checkmark: {
        fontSize: 48,
        color: "#fff",
    },
    hooray: {
        fontSize: 20,
        fontWeight: "bold",
        marginTop: 20,
        color: "#2b2d42",
    },
    subtext: {
        fontSize: 14,
        marginTop: 8,
        color: "#555",
    },
    button: {
        width: "70%",
        backgroundColor: "#2980b9",
        paddingVertical: 14,
        borderRadius: 6,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        fontWeight: "600",
    },
});