import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert, // Tetap gunakan Alert untuk notifikasi sederhana
    Modal
} from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import 'moment/locale/id'; // Pastikan locale 'id' dimuat
import { supabase } from '../config/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

console.log('Home Screen');

export default function HomeScreen({ navigation }) {
    const [userName, setUserName] = useState('');
    const [currentTime, setCurrentTime] = useState(moment());
    const [clockInTime, setClockInTime] = useState(null);
    const [clockOutTime, setClockOutTime] = useState(null);
    const [user, setUser] = useState(null);
    const [totalRisiko, setTotalRisiko] = useState(0); // Risiko General (total dari semua InputHRA)
    const [personalRisiko, setPersonalRisiko] = useState(0); // Risiko Personal (dari JobSurveyAnswer hari ini)
    const [infoVisible, setInfoVisible] = useState(false);

    // Effect untuk memperbarui waktu setiap detik
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(moment());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch General HRA (total risiko dari semua InputHRA)
    useEffect(() => {
        const fetchGeneralHRA = async () => {
            const { data, error } = await supabase
                .from("InputHRA")
                .select("id"); // Hanya perlu ID untuk menghitung jumlah baris

            if (!error && data) {
                // Mengubah perhitungan: sekarang hanya menghitung jumlah baris
                const total = data.length;
                setTotalRisiko(total);
            } else {
                console.log("Fetch General InputHRA error:", error);
            }
        };
        fetchGeneralHRA();
    }, []); // Runs once on component mount

    // Load user data from AsyncStorage and potentially fetch user details from AkunManagement
    // This effect should also trigger fetchPersonalHRA once user data is available
    useEffect(() => {
        const loadUserAndFetchPersonalHRA = async () => {
            try {
                const rawUser = await AsyncStorage.getItem('user');
                if (!rawUser) {
                    console.error("User data tidak ditemukan di storage");
                    return;
                }

                const parsedUser = JSON.parse(rawUser);
                setUser(parsedUser); // Set user dari AsyncStorage

                // Ambil nama dari AkunManagement atau fallback ke user_metadata/email
                const { data: akunData, error: akunError } = await supabase
                    .from("AkunManagement")
                    .select("nama_lengkap") // Asumsi ada kolom 'nama_lengkap' di AkunManagement
                    .eq("user_id", parsedUser.id)
                    .maybeSingle();

                if (akunError) {
                    console.error("Supabase AkunManagement error:", akunError);
                    setUserName(parsedUser.user_metadata?.nama || parsedUser.email || 'User');
                } else if (akunData && akunData.nama_lengkap) { // Check for nama_lengkap
                    setUserName(akunData.nama_lengkap);
                } else {
                    setUserName(parsedUser.user_metadata?.nama || parsedUser.email || 'User');
                }

                // *** Trigger fetchPersonalHRA immediately after user data is loaded ***
                if (parsedUser.id) {
                    fetchPersonalHRA(parsedUser.id);
                }

            } catch (error) {
                console.error("Failed to load user:", error);
            }
        };
        // Panggil fungsi ini hanya sekali saat komponen dimuat
        loadUserAndFetchPersonalHRA();
    }, [fetchPersonalHRA]); // fetchPersonalHRA adalah dependency karena dipanggil di sini

    const getWIBTimestamp = () => {
        const date = new Date();
        return date;
    };

    const formatTime = (timestamp) => {
        return moment(timestamp).utcOffset('+07:00').format('HH:mm');
    };

    const getToday = () => {
        return moment().utc().format('YYYY-MM-DD');
    };

    const fetchAttendance = useCallback(async () => {
        try {
            const raw = await AsyncStorage.getItem("user");
            if (!raw) {
                console.warn("User data not found in AsyncStorage during fetchAttendance.");
                setClockInTime(null);
                setClockOutTime(null);
                return;
            }
            const parsedUser = JSON.parse(raw);
            const user_id = parsedUser.id;

            if (!user_id) {
                console.error("User ID not found in parsed user data.");
                setClockInTime(null);
                setClockOutTime(null);
                return;
            }

            const today = getToday();

            const { data, error } = await supabase
                .from("AkunManagement")
                .select("id, tanggal_absen, clock_in, clock_out")
                .eq("user_id", user_id)
                .maybeSingle();

            console.log("Fetched Supabase data for attendance:", data);
            console.log("Supabase error for attendance:", error);

            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching attendance from Supabase:", error);
                setClockInTime(null);
                setClockOutTime(null);
                return;
            }

            if (data) {
                const storedDate = moment.utc(data.tanggal_absen).format('YYYY-MM-DD');

                if (storedDate === today) {
                    setClockInTime(data.clock_in ? formatTime(data.clock_in) : null);
                    setClockOutTime(data.clock_out ? formatTime(data.clock_out) : null);
                } else {
                    console.log("Detected new day, resetting attendance data in DB.");
                    const { error: updateError } = await supabase
                        .from("AkunManagement")
                        .update({
                            tanggal_absen: today,
                            clock_in: null,
                            clock_out: null
                        })
                        .eq("user_id", user_id);

                    if (updateError) {
                        console.error("Error resetting attendance for new day:", updateError);
                    }
                    setClockInTime(null);
                    setClockOutTime(null);
                }
            } else {
                setClockInTime(null);
                setClockOutTime(null);
            }

        } catch (error) {
            console.error("Error in fetchAttendance:", error);
            setClockInTime(null);
            setClockOutTime(null);
        }
    }, []);

    // Fetch Personal HRA (Personal Risk)
    const fetchPersonalHRA = useCallback(async (currentUserId) => {
        console.log("DEBUG: fetchPersonalHRA called for userId:", currentUserId);
        if (!currentUserId) {
            console.log("DEBUG: currentUserId is null, setting personalRisiko to 0.");
            setPersonalRisiko(0);
            return;
        }

        const today = getToday(); // YYYY-MM-DD UTC
        console.log("DEBUG: Today for personal HRA:", today);

        // 1. Get the inputhra_id from today's JobSurveyAnswer for this user
        const { data: surveyAnswers, error: surveyError } = await supabase
            .from('JobSurveyAnswer')
            .select('inputhra_id')
            .eq('user_id', currentUserId)
            .gte('created_at', today + 'T00:00:00Z') // Start of today UTC
            .lt('created_at', moment.utc(today).add(1, 'days').format('YYYY-MM-DD') + 'T00:00:00Z'); // Start of tomorrow UTC

        if (surveyError) {
            console.error("DEBUG: Error fetching JobSurveyAnswer for personal HRA:", surveyError);
            setPersonalRisiko(0);
            return;
        }

        console.log("DEBUG: Survey Answers for today:", surveyAnswers);

        if (!surveyAnswers || surveyAnswers.length === 0) {
            console.log("DEBUG: No survey answers for today, setting personalRisiko to 0.");
            setPersonalRisiko(0); // No survey answers for today
            return;
        }

        // Extract unique inputhra_ids to avoid double counting if multiple answers point to the same InputHRA
        const inputHraIds = [...new Set(surveyAnswers.map(answer => answer.inputhra_id))];
        console.log("DEBUG: Unique InputHRA IDs from survey:", inputHraIds);

        if (inputHraIds.length === 0) {
            console.log("DEBUG: No unique InputHRA IDs, setting personalRisiko to 0.");
            setPersonalRisiko(0);
            return;
        }

        // 2. Fetch the bahaya_kesehatan from InputHRA for these IDs
        // Kita hanya perlu memastikan ada entri, tidak perlu menjumlahkan nilai 'bahaya_kesehatan'
        const { data: inputHraData, error: inputHraError } = await supabase
            .from('InputHRA')
            .select('id') // Hanya perlu ID untuk menghitung jumlahnya
            .in('id', inputHraIds);

        if (inputHraError) {
            console.error("DEBUG: Error fetching InputHRA for personal HRA calculation:", inputHraError);
            setPersonalRisiko(0);
            return;
        }

        console.log("DEBUG: InputHRA data for personal HRA (for counting):", inputHraData);

        // 3. Calculate total personal risk by counting the number of identified risks
        // Sekarang hanya menghitung jumlah baris yang ditemukan
        const calculatedPersonalRisk = inputHraData.length;
        setPersonalRisiko(calculatedPersonalRisk);
        console.log('DEBUG: Personal HRA calculated (count):', calculatedPersonalRisk);
    }, []);

    const handleClockIn = async () => {
        try {
            const rawUser = await AsyncStorage.getItem('user');
            if (!rawUser) return Alert.alert("Error", "User data tidak ditemukan.");

            const parsedUser = JSON.parse(rawUser);
            const user_id = parsedUser.id;
            if (!user_id) return Alert.alert("Error", "User ID tidak ditemukan.");

            const now = getWIBTimestamp();
            const today = getToday();

            const { data: existingAttendance, error: selectError } = await supabase
                .from("AkunManagement")
                .select("id, tanggal_absen, clock_in, clock_out")
                .eq("user_id", user_id)
                .maybeSingle();

            if (selectError && selectError.code !== 'PGRST116') {
                console.error("Select error during clock-in:", selectError);
                Alert.alert("Gagal", "Terjadi kesalahan saat memeriksa absen.");
                return;
            }

            let currentAttendanceId = null;

            if (existingAttendance) {
                const storedDate = moment.utc(existingAttendance.tanggal_absen).format('YYYY-MM-DD');
                if (storedDate === today) {
                    if (existingAttendance.clock_in) {
                        Alert.alert('Gagal', 'Anda sudah melakukan Clock In hari ini.');
                        return;
                    }
                    currentAttendanceId = existingAttendance.id;
                }
            }

            if (!currentAttendanceId) {
                const { data: updateData, error: updateError } = await supabase
                    .from("AkunManagement")
                    .update({
                        tanggal_absen: today,
                        clock_in: now.toISOString(),
                        clock_out: null,
                    })
                    .eq("user_id", user_id);

                if (updateError) {
                    console.error("Update error during clock-in:", updateError);
                    Alert.alert("Gagal", "Clock In gagal: " + updateError.message);
                    return;
                }
            } else {
                const { data: updateData, error: updateError } = await supabase
                    .from("AkunManagement")
                    .update({ clock_in: now.toISOString() })
                    .eq("id", currentAttendanceId);

                if (updateError) {
                    console.error("Update error during clock-in (existing record):", updateError);
                    Alert.alert("Gagal", "Clock In gagal: " + updateError.message);
                    return;
                }
            }

            setClockInTime(formatTime(now));
            await fetchAttendance();
            navigation.replace("ClockInSuccess", { clockInTime: now.toISOString() });

        } catch (error) {
            console.error("Clock In error:", error);
            Alert.alert("Gagal", "Clock In gagal: " + error.message);
        }
    };

    const handleClockOut = async () => {
        try {
            const rawUser = await AsyncStorage.getItem('user');
            if (!rawUser) return Alert.alert("Error", "User data tidak ditemukan");

            const parsedUser = JSON.parse(rawUser);
            const user_id = parsedUser.id;
            if (!user_id) return Alert.alert("Error", "User ID tidak ditemukan");

            const now = getWIBTimestamp();
            const today = getToday();

            const { data, error: selectError } = await supabase
                .from('AkunManagement')
                .select('id, clock_in, tanggal_absen')
                .eq('user_id', user_id)
                .eq('tanggal_absen', today)
                .maybeSingle();

            if (selectError && selectError.code !== 'PGRST116') {
                console.error("Select error during clock-out:", selectError);
                Alert.alert("Gagal", "Terjadi kesalahan saat memeriksa absen.");
                return;
            }

            if (!data || !data.clock_in) {
                Alert.alert('Gagal', 'Belum melakukan Clock In hari ini');
                return;
            }

            const { error } = await supabase
                .from('AkunManagement')
                .update({ clock_out: now.toISOString() })
                .eq('id', data.id);

            if (error) throw error;

            setClockOutTime(formatTime(now));
            await fetchAttendance();
            navigation.replace("ClockOutSuccess", { clockOutTime: now.toISOString() });

        } catch (err) {
            console.log('Clock Out error:', err.message);
            Alert.alert('Gagal', 'Clock Out gagal');
        }
    };

    const handleJobSurvey = () => {
        navigation.navigate('JobSurvey');
    };

    // useFocusEffect untuk memanggil fetchAttendance dan fetchPersonalHRA saat layar fokus
    useFocusEffect(
        useCallback(() => {
            fetchAttendance();
            // fetchPersonalHRA sudah dipanggil oleh useEffect loadUserAndFetchPersonalHRA
            // Ini adalah fallback atau untuk refresh saat kembali ke layar.
            if (user?.id) {
                fetchPersonalHRA(user.id);
            }
        }, [fetchAttendance, fetchPersonalHRA, user]) // Tambahkan dependensi
    );


    const hari = currentTime.format('dddd');
    const tanggal = currentTime.format('DD MMMM YYYY');

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

                {/* Attendance */}
                <View style={styles.attendanceCard}>
                    <View style={styles.attendanceTopRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.attendanceTitle}>Attendance</Text>
                            <View style={styles.dateRow}>
                                <Text style={styles.calendarIcon}>📅</Text>
                                <Text style={styles.dateText}>{hari}, {tanggal}</Text>
                            </View>
                        </View>

                        <View style={styles.verticalDivider} />

                        <View style={styles.clockSection}>
                            <View style={styles.clockRow}>
                                <Text style={styles.clockLabel}>Clock In</Text>
                                <Text style={styles.clockValue}>{clockInTime || '--:--'}</Text>
                            </View>
                            <View style={styles.clockRow}>
                                <Text style={styles.clockLabel}>Clock Out</Text>
                                <Text style={styles.clockValue}>{clockOutTime || '--:--'}</Text>
                            </View>
                        </View>
                    </View>

                    {!clockInTime && (
                        <TouchableOpacity style={styles.clockButton} onPress={handleClockIn}>
                            <View style={styles.clockIconCircle} />
                            <Text style={styles.clockButtonText}>Clock In</Text>
                        </TouchableOpacity>
                    )}

                    {clockInTime && !clockOutTime && (
                        <TouchableOpacity
                            style={[styles.clockButton, { backgroundColor: '#999', marginTop: 10 }]}
                            onPress={handleClockOut}
                        >
                            <View style={styles.clockIconCircle} />
                            <Text style={styles.clockButtonText}>Clock Out</Text>
                        </TouchableOpacity>
                    )}

                    {clockInTime && clockOutTime && (
                        <View style={[styles.clockButton, { backgroundColor: '#323d6654', marginTop: 10 }]}>
                            <Text style={styles.clockButtonText}>Absensi Selesai Hari Ini</Text>
                        </View>
                    )}

                </View>

                {/*Health Risk Assessment*/}
                <View style={styles.hraContainer}>
                    {/* Header */}
                    <View style={styles.hraHeader}>
                        <Text style={styles.hraTitle}>Health Risk Assessment</Text>
                        <Ionicons name="chevron-forward" size={20} color="#2f80ed" />
                    </View>

                    {/* Content */}
                    <View style={styles.hraContent}>
                        <View style={styles.hraBox}>
                            <Text style={styles.hraLabel}>General</Text>
                            <Text style={styles.hraValue}><Text style={styles.bold}>{totalRisiko}</Text> Danger/Risk</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.hraBox}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.hraLabel}>Personal</Text>
                                <TouchableOpacity onPress={() => setInfoVisible(true)}>
                                    <Ionicons name="information-circle-outline" size={15} color="#298BDA" style={{ marginLeft: 4, marginTop: -10 }} />
                                </TouchableOpacity>
                            </View>

                            {/* Display Personal Risk or Info Modal */}
                            {personalRisiko > 0 ? (
                                <Text style={styles.hraValue}><Text style={styles.bold}>{personalRisiko}</Text> Danger/Risk</Text>
                            ) : (
                                <Text style={styles.hraValue}>-</Text>
                            )}

                            <Modal
                                visible={infoVisible}
                                transparent
                                animationType="fade"
                                onRequestClose={() => setInfoVisible(false)}
                            >
                                <View style={{
                                    flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'
                                }}>
                                    <View style={{
                                        backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%', alignItems: 'center'
                                    }}>
                                        <Ionicons name="information-circle" size={50} color="#2f80ed" style={{ marginBottom: 10 }} />
                                        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Information</Text>
                                        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                                            You haven’t filled out your job survey today so the information cannot be displayed.
                                            {"\n\n"}Fill out your job survey to see your Personal HRA.
                                        </Text>
                                        <TouchableOpacity
                                            style={{ backgroundColor: '#2f80ed', padding: 10, borderRadius: 6, marginBottom: 10, width: '100%' }}
                                            onPress={() => {
                                                setInfoVisible(false);
                                                navigation.navigate("JobSurvey"); // arahkan ke form Job Survey
                                            }}
                                        >
                                            <Text style={{ color: 'white', textAlign: 'center' }}>Job Survey</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={{ borderColor: '#ccc', borderWidth: 1, padding: 10, borderRadius: 6, width: '100%' }}
                                            onPress={() => setInfoVisible(false)}
                                        >
                                            <Text style={{ textAlign: 'center' }}>Close</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </Modal>

                        </View>
                    </View>

                    {/* Button */}
                    <View style={styles.JobSurveyBox}>
                        <TouchableOpacity style={styles.jobSurveyButton} onPress={handleJobSurvey}>
                            <Text style={styles.jobSurveyText}>Job Survey</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffffff',
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
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
    },

    subGreeting: {
        fontSize: 15,
        color: 'white',
    },

    time: {
        color: '#fff',
        fontSize: 16,
    },

    attendanceCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderColor: '#2F80ED',
        borderWidth: 1,
        marginTop: 20,
        marginLeft: 20,
        marginRight: 20,
        marginBottom: 20,
    },

    attendanceTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    attendanceTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2F80ED',
        marginBottom: 4,
    },

    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },

    calendarIcon: {
        fontSize: 12,
        marginRight: 6,
    },

    dateText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
    },

    verticalDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#eee',
        marginHorizontal: 8,
    },

    clockSection: {
        flex: 1,
        paddingLeft: 12,
        justifyContent: 'center',
    },

    clockLabel: {
        fontSize: 14,
        color: '#6B7280',
    },

    clockValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4B5563',
    },

    clockRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },

    clockButton: {
        marginTop: 16,
        backgroundColor: '#2F80ED',
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    clockIconCircle: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
        marginRight: 8,
    },

    clockButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },

    hraContainer: {
        backgroundColor: '#ffffffff',
        borderRadius: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: '#d6eaff',
    },

    hraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#d6eaff',
        padding: 8,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
    },

    hraTitle: {
        color: '#2f80ed',
        fontWeight: 'bold',
    },

    hraContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        alignItems: 'center',
    },

    hraBox: {
        alignItems: 'center',
        flex: 1,
    },

    hraLabel: {
        color: '#7f8c8d',
        fontSize: 13,
        marginBottom: 4,
    },

    hraValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3436',
    },

    bold: {
        fontWeight: 'bold',
        fontSize: 18,
    },

    divider: {
        width: 1,
        height: '70%',
        backgroundColor: '#e0e0e0',
    },

    jobSurveyButton: {
        borderWidth: 1,
        borderColor: '#2f80ed',
        paddingVertical: 8,
        borderRadius: 8,
        marginTop: 12,
        alignItems: 'center',
        margin: 10,
        padding: 150,
    },

    jobSurveyText: {
        color: '#2f80ed',
        fontWeight: '600',
    },
});
