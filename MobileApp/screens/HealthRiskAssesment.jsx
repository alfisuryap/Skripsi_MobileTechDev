import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    FlatList,
    ActivityIndicator,
    SafeAreaView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase'; // Pastikan path ini benar
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { useFocusEffect } from '@react-navigation/native';

export default function HealthRiskAssessmentScreen({ navigation }) {
    const [loading, setLoading] = useState(true);
    const [allInputHRA, setAllInputHRA] = useState([]); // Data InputHRA lengkap (setelah dikelompokkan)
    const [personalInputHRA, setPersonalInputHRA] = useState([]); // Data InputHRA personal (setelah dikelompokkan)
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('general'); // 'general' atau 'personal'
    const [userId, setUserId] = useState(null);

    // Fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD UTC
    const getToday = () => {
        return moment().utc().format('YYYY-MM-DD');
    };

    // Fungsi untuk memuat data pengguna dari AsyncStorage
    const loadUser = useCallback(async () => {
        try {
            const rawUser = await AsyncStorage.getItem('user');
            if (rawUser) {
                const parsedUser = JSON.parse(rawUser);
                setUserId(parsedUser.id);
            } else {
                console.warn('User data not found in AsyncStorage.');
                setUserId(null); // Pastikan userId null jika tidak ada data user
            }
        } catch (error) {
            console.error('Error loading user from AsyncStorage:', error);
            setUserId(null);
        }
    }, []);

    // Fungsi helper untuk mengelompokkan data InputHRA berdasarkan sub_proses_id
    // Ini akan mengembalikan array objek unik, di mana setiap objek merepresentasikan satu sub_proses
    // dan berisi referensi ke proses induk serta ID dari semua item InputHRA asli yang termasuk dalam sub_proses ini.
    const groupHRABySubProses = (data) => {
        const uniqueSubProsesMap = new Map();
        data.forEach(item => {
            if (item.sub_proses_id && item.sub_proses_id.id) {
                const subProsesId = item.sub_proses_id.id;
                if (!uniqueSubProsesMap.has(subProsesId)) {
                    uniqueSubProsesMap.set(subProsesId, {
                        sub_proses_id: item.sub_proses_id,
                        proses_id: item.proses_id, // Simpan juga proses_id induk
                        originalHraIds: [item.id] // Simpan ID dari item InputHRA asli
                    });
                } else {
                    // Jika sub_proses sudah ada, tambahkan ID item InputHRA asli ke array
                    const existingEntry = uniqueSubProsesMap.get(subProsesId);
                    existingEntry.originalHraIds.push(item.id);
                }
            }
            // Jika tidak ada sub_proses_id, item ini akan diabaikan dari pengelompokan ini
            // Anda bisa menambahkan logika fallback di sini jika item tanpa sub_proses_id perlu ditampilkan
        });
        return Array.from(uniqueSubProsesMap.values());
    };

    // Fungsi untuk mengambil semua data InputHRA (untuk tab General)
    const fetchAllInputHRA = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('InputHRA')
            .select(`
                id,
                proses_id (id, kode, proses),
                sub_proses_id (id, kode, sub_proses),
                aktivitas_id (id, kode, aktivitas),
                sub_aktivitas_id (id, kode, sub_aktivitas)
            `);

        if (error) {
            console.error('Error fetching all InputHRA:', error);
            Alert.alert('Error', 'Gagal memuat data umum HRA.');
            setAllInputHRA([]);
        } else {
            console.log('All InputHRA fetched:', data);
            const groupedData = groupHRABySubProses(data);
            setAllInputHRA(groupedData);
        }
        setLoading(false);
    }, []);

    // Fungsi untuk mengambil data InputHRA yang relevan dengan JobSurveyAnswer pengguna (untuk tab Personal)
    const fetchPersonalInputHRA = useCallback(async () => {
        if (!userId) {
            setPersonalInputHRA([]);
            return;
        }

        setLoading(true);
        const today = getToday();

        // 1. Ambil inputhra_id dari JobSurveyAnswer untuk user dan hari ini
        const { data: surveyAnswers, error: surveyError } = await supabase
            .from('JobSurveyAnswer')
            .select('inputhra_id')
            .eq('user_id', userId)
            .gte('created_at', today + 'T00:00:00Z')
            .lt('created_at', moment.utc(today).add(1, 'days').format('YYYY-MM-DD') + 'T00:00:00Z');

        if (surveyError) {
            console.error('Error fetching JobSurveyAnswer for personal HRA:', surveyError);
            Alert.alert('Error', 'Gagal memuat jawaban survei pribadi.');
            setPersonalInputHRA([]);
            setLoading(false);
            return;
        }

        if (!surveyAnswers || surveyAnswers.length === 0) {
            console.log('No JobSurveyAnswer for today for this user.');
            setPersonalInputHRA([]);
            setLoading(false);
            return;
        }

        // Ekstrak ID InputHRA unik dari jawaban survei
        const inputHraIds = [...new Set(surveyAnswers.map(answer => answer.inputhra_id))];

        if (inputHraIds.length === 0) {
            setPersonalInputHRA([]);
            setLoading(false);
            return;
        }

        // 2. Ambil detail InputHRA berdasarkan ID yang ditemukan
        const { data: inputHraDetails, error: detailsError } = await supabase
            .from('InputHRA')
            .select(`
                id,
                proses_id (id, kode, proses),
                sub_proses_id (id, kode, sub_proses),
                aktivitas_id (id, kode, aktivitas),
                sub_aktivitas_id (id, kode, sub_aktivitas)
            `)
            .in('id', inputHraIds);

        if (detailsError) {
            console.error('Error fetching InputHRA details for personal HRA:', detailsError);
            Alert.alert('Error', 'Gagal memuat detail HRA pribadi.');
            setPersonalInputHRA([]);
        } else {
            console.log('Personal InputHRA fetched:', inputHraDetails);
            const groupedDetails = groupHRABySubProses(inputHraDetails);
            setPersonalInputHRA(groupedDetails);
        }
        setLoading(false);
    }, [userId]); // userId sebagai dependency

    // useFocusEffect untuk memuat data setiap kali layar menjadi fokus
    useFocusEffect(
        useCallback(() => {
            loadUser(); // Muat user terlebih dahulu
            fetchAllInputHRA(); // Selalu muat data general
            // fetchPersonalInputHRA akan dipanggil setelah userId tersedia
        }, [loadUser, fetchAllInputHRA])
    );

    // Efek terpisah untuk memanggil fetchPersonalInputHRA ketika userId berubah
    useEffect(() => {
        if (userId) {
            fetchPersonalInputHRA();
        }
    }, [userId, fetchPersonalInputHRA]);


    // Fungsi untuk mendapatkan teks yang akan ditampilkan di tombol (hanya sub_proses)
    const getItemDisplayText = (item) => {
        // Item sekarang adalah objek yang dikelompokkan, jadi kita langsung akses sub_proses_id
        if (item.sub_proses_id?.kode && item.sub_proses_id?.sub_proses) {
            return `${item.sub_proses_id.kode}\n${item.sub_proses_id.sub_proses}`;
        }
        // Fallback jika ada item yang tidak memiliki sub_proses_id (seharusnya tidak terjadi setelah pengelompokan)
        if (item.proses_id?.kode && item.proses_id?.proses) {
            return `${item.proses_id.kode}\n${item.proses_id.proses}`;
        }
        return `ID: ${item.id}`; // Fallback ke ID jika tidak ada yang ditemukan
    };

    // Filter data berdasarkan tab aktif dan query pencarian
    const filteredData = (activeTab === 'general' ? allInputHRA : personalInputHRA).filter(item => {
        const text = getItemDisplayText(item).toLowerCase();
        return text.includes(searchQuery.toLowerCase());
    });

    // Handler untuk menekan item grid
    const handleItemPress = (item) => {
        // Meneruskan sub_proses_id dan proses_id ke layar detail
        // Serta array originalHraIds untuk mengambil detail aktivitas/sub-aktivitas di layar detail
        navigation.navigate('HRADetailScreen', {
            subProsesItem: item.sub_proses_id,
            parentProsesItem: item.proses_id,
            originalHraIds: item.originalHraIds
        });
    };

    // Render item untuk FlatList
    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.gridItem} onPress={() => handleItemPress(item)}>
            <Text style={styles.gridItemText}>{getItemDisplayText(item)}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Health Risk Assessment</Text>
            </View>

            {/* Tabs General / Personal */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'general' && styles.activeTab]}
                    onPress={() => setActiveTab('general')}
                >
                    <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>General</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'personal' && styles.activeTab]}
                    onPress={() => setActiveTab('personal')}
                >
                    <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>Personal</Text>
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search"
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Content Grid */}
            {loading ? (
                <ActivityIndicator size="large" color="#2F80ED" style={styles.loadingIndicator} />
            ) : (
                <FlatList
                    data={filteredData}
                    renderItem={renderItem}
                    keyExtractor={item => item.sub_proses_id.id.toString()} // Key extractor berdasarkan ID sub_proses
                    numColumns={2} // 2 kolom seperti di gambar
                    contentContainerStyle={styles.gridContainer}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Tidak ada data yang ditemukan.</Text>
                            {activeTab === 'personal' && (
                                <Text style={styles.emptySubText}>
                                    Silakan isi Job Survey Anda untuk melihat HRA pribadi.
                                </Text>
                            )}
                        </View>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#fff',
    },
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6,
    },
    activeTab: {
        backgroundColor: '#2F80ED',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
    },
    activeTabText: {
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    loadingIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContainer: {
        paddingHorizontal: 10,
        paddingVertical: 16,
    },
    gridItem: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 15,
        margin: 6,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    gridItemText: {
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#777',
        textAlign: 'center',
        marginBottom: 10,
    },
    emptySubText: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
