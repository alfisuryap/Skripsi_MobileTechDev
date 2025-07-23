import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    Image, // Import Image component
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../config/supabase';

export default function ManajemenOperasiScreen({ navigation }) {
    const route = useRoute();
    const { activityItem } = route.params; // Menerima item aktivitas dari navigasi

    const [loadingDetails, setLoadingDetails] = useState(false); // Untuk loading data spesifik di tab
    const [searchQuery, setSearchQuery] = useState('');

    // State untuk tab utama: Man, Machine, Environment
    const [activeMainTab, setActiveMainTab] = useState('man'); // Default ke 'Man'
    const [manDangerList, setManDangerList] = useState([]); // Data Danger di bawah tab Man
    const [manRiskList, setManRiskList] = useState([]);     // Data Risk di bawah tab Man
    const [machineList, setMachineList] = useState([]);     // Data untuk tab Machine (placeholder)
    const [environmentList, setEnvironmentList] = useState([]); // Data untuk tab Environment (placeholder)

    // State untuk sub-tab: Danger, Risk (hanya relevan di bawah tab Man)
    const [activeSubTab, setActiveSubTab] = useState('danger'); // Default ke 'Danger'

    // Mengambil data untuk tab 'Danger' dan 'Risk' di bawah 'Man'
    useEffect(() => {
        const fetchDataForManTabs = async () => {
            if (!activityItem || !activityItem.id) {
                setManDangerList([]);
                setManRiskList([]);
                return;
            }

            setLoadingDetails(true);

            // Fetch data for Danger (from bahaya_kesehatan)
            let dangerData = [];
            if (activityItem.bahaya_kesehatan) {
                // Asumsi bahaya_kesehatan adalah string yang dipisahkan oleh semicolon
                dangerData = String(activityItem.bahaya_kesehatan).split(';').map(s => s.trim()).filter(s => s !== '');
            }
            const formattedDanger = dangerData.map((text, index) => ({
                id: `danger-${activityItem.id}-${index}`, // Kunci unik
                description: text,
            }));
            setManDangerList(formattedDanger);

            // Fetch data for Risk (from manajemen_operasi_id)
            let riskData = [];
            if (activityItem.risiko_kesehatan) {
                // Asumsi manajemen_operasi_id adalah string yang dipisahkan oleh semicolon
                riskData = String(activityItem.risiko_kesehatan).split(';').map(s => s.trim()).filter(s => s !== '');
            }
            const formattedRisk = riskData.map((text, index) => ({
                id: `risk-${activityItem.id}-${index}`, // Kunci unik
                description: text,
            }));
            setManRiskList(formattedRisk);

            setLoadingDetails(false);
        };

        // Hanya fetch data untuk tab 'Man' jika tab utama adalah 'Man'
        if (activeMainTab === 'man') {
            fetchDataForManTabs();
        } else {
            // Kosongkan daftar jika tab utama bukan 'Man'
            setManDangerList([]);
            setManRiskList([]);
            // Anda bisa menambahkan logika fetch untuk Machine/Environment di sini jika ada data
            setMachineList([]);
            setEnvironmentList([]);
        }
    }, [activeMainTab, activityItem]); // Dipicu saat tab utama atau activityItem berubah

    // Filter konten berdasarkan tab aktif (utama dan sub) serta query pencarian
    const filteredContent = useCallback(() => {
        let listToFilter = [];
        if (activeMainTab === 'man') {
            listToFilter = activeSubTab === 'danger' ? manDangerList : manRiskList;
        } else if (activeMainTab === 'machine') {
            listToFilter = machineList;
        } else if (activeMainTab === 'environment') {
            listToFilter = environmentList;
        }

        return listToFilter.filter(item => {
            return item.description.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [activeMainTab, activeSubTab, manDangerList, manRiskList, machineList, environmentList, searchQuery]);

    // Render item untuk daftar Danger/Risk/Machine/Environment
    const renderListItem = ({ item }) => (
        <TouchableOpacity style={styles.listItemCard} onPress={() => {
            navigation.navigate('DetailScreen', {
                activityItem: activityItem, // Meneruskan seluruh objek activityItem (InputHRA)
                selectedDangerText: item.description // Meneruskan teks bahaya spesifik yang diklik
            });
        }}>
            <Text style={styles.listItemText}>{item.description}</Text>
            <Ionicons name="chevron-forward" size={24} color="#555" />
        </TouchableOpacity>
    );

    // Komponen untuk menampilkan pesan "Tidak ada data" dengan gambar
    const NoDataComponent = () => (
        <View style={styles.noDataContainer}>
            <Image
                source={require('../assets/nodata.png')} // Gambar nodata.png
                style={styles.noDataImage}
                resizeMode="contain"
            />
            <Text style={styles.noDataText}>There's no data yet.</Text>
        </View>
    );

    // Render konten berdasarkan tab aktif (utama dan sub)
    const renderMainTabContent = () => {
        if (loadingDetails) {
            return <ActivityIndicator size="large" color="#2F80ED" style={styles.loadingIndicator} />;
        }

        if (activeMainTab === 'man') {
            const dataToDisplay = filteredContent();
            return (
                <View style={styles.manTabContentContainer}>
                    {/* Sub-Tabs Danger / Risk */}
                    <View style={styles.subTabsContainer}>
                        <TouchableOpacity
                            style={[styles.subTabButton, activeSubTab === 'danger' && styles.activeSubTab]}
                            onPress={() => setActiveSubTab('danger')}
                        >
                            <Text style={[styles.subTabText, activeSubTab === 'danger' && styles.activeSubTabText]}>Danger</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.subTabButton, activeSubTab === 'risk' && styles.activeSubTab]}
                            onPress={() => setActiveSubTab('risk')}
                        >
                            <Text style={[styles.subTabText, activeSubTab === 'risk' && styles.activeSubTabText]}>Risk</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Konten Sub-Tab */}
                    <FlatList
                        data={dataToDisplay}
                        renderItem={renderListItem}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={NoDataComponent} // Menggunakan komponen NoDataComponent
                        scrollEnabled={false} // FlatList ini di dalam FlatList utama yang sudah bisa discroll
                        contentContainerStyle={styles.flatListSectionContentContainer}
                    />
                </View>
            );
        } else {
            // Konten untuk tab Machine dan Environment (saat ini kosong)
            return <NoDataComponent />; // Menggunakan komponen NoDataComponent
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Layar Utama */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{activityItem?.aktivitas_id?.aktivitas || activityItem?.sub_aktivitas_id?.sub_aktivitas || 'Manajemen Operasi'}</Text>
            </View>

            {/* Tabs Man / Machine / Environment */}
            <View style={styles.mainTabsContainer}>
                <TouchableOpacity
                    style={[styles.mainTabButton, activeMainTab === 'man' && styles.activeMainTab]}
                    onPress={() => setActiveMainTab('man')}
                >
                    <Text style={[styles.mainTabText, activeMainTab === 'man' && styles.activeMainTabText]}>Man</Text>
                    <View style={[styles.mainTabCountBubble, activeMainTab === 'man' && styles.activeMainTabCountBubble]}>
                        <Text style={[styles.mainTabCount, activeMainTab === 'man' && styles.activeMainTabCount]}>
                            {manDangerList.length + manRiskList.length}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mainTabButton, activeMainTab === 'machine' && styles.activeMainTab]}
                    onPress={() => setActiveMainTab('machine')}
                >
                    <Text style={[styles.mainTabText, activeMainTab === 'machine' && styles.activeMainTabText]}>Machine</Text>
                    <View style={[styles.mainTabCountBubble, activeMainTab === 'machine' && styles.activeMainTabCountBubble]}>
                        <Text style={[styles.mainTabCount, activeMainTab === 'machine' && styles.activeMainTabCount]}>
                            {machineList.length}
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.mainTabButton, activeMainTab === 'environment' && styles.activeMainTab]}
                    onPress={() => setActiveMainTab('environment')}
                >
                    <Text style={[styles.mainTabText, activeMainTab === 'environment' && styles.activeMainTabText]}>Environment</Text>
                    <View style={[styles.mainTabCountBubble, activeMainTab === 'environment' && styles.activeMainTabCountBubble]}>
                        <Text style={[styles.mainTabCount, activeMainTab === 'environment' && styles.activeMainTabCount]}>
                            {environmentList.length}
                        </Text>
                    </View>
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

            {/* Konten Tab Utama - Menggunakan FlatList untuk seluruh konten di bawah search bar */}
            <View style={styles.tabContentWrapper}>
                <FlatList
                    data={[{ key: 'mainContent' }]} // Dummy data untuk membuat FlatList bisa di-scroll
                    renderItem={renderMainTabContent}
                    keyExtractor={item => item.key}
                    contentContainerStyle={styles.tabContentContainer}
                    showsVerticalScrollIndicator={false}
                />
            </View>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
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
    // Gaya untuk tab utama (Man, Machine, Environment)
    mainTabsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Rata kanan kiri
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#e0e0e0', // Warna latar belakang abu-abu
        borderRadius: 8,
        padding: 4,
    },
    mainTabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6, // Radius untuk tombol itu sendiri
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'transparent', // Default transparan
    },
    activeMainTab: {
        backgroundColor: '#2F80ED', // Warna biru saat aktif
    },
    mainTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    activeMainTabText: {
        color: '#fff', // Teks putih saat aktif
    },
    mainTabCountBubble: {
        marginLeft: 5,
        backgroundColor: '#fff', // Bubble putih
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    activeMainTabCountBubble: {
        backgroundColor: '#fff', // Bubble tetap putih
    },
    mainTabCount: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#777', // Teks abu-abu untuk angka
    },
    activeMainTabCount: {
        color: '#2F80ED', // Teks angka biru saat tab utama aktif
    },

    // Gaya untuk search bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        marginHorizontal: 16,
        marginVertical: 16,
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

    // Gaya untuk konten tab utama
    tabContentWrapper: {
        flex: 1,
    },
    tabContentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },

    // Gaya khusus untuk konten di dalam tab 'Man'
    manTabContentContainer: {
        // Tidak perlu padding horizontal di sini karena sudah ada di tabContentContainer
    },

    // Gaya untuk sub-tab (Danger, Risk)
    subTabsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Rata kiri
        backgroundColor: '#e0e0e0', // Warna latar belakang abu-abu
        borderRadius: 8,
        padding: 4,
        marginBottom: 10, // Jarak antara sub-tab dan daftar
    },
    subTabButton: {
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 6, // Radius untuk tombol itu sendiri
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginRight: 8,
        backgroundColor: 'transparent', // Default transparan
    },
    activeSubTab: {
        backgroundColor: '#298BDA', // Warna biru sedikit berbeda untuk sub-tab aktif
    },
    subTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    activeSubTabText: {
        color: '#fff',
    },

    // Gaya untuk daftar item (Danger/Risk)
    listItemCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    listItemText: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        marginRight: 10,
    },

    // Gaya untuk kondisi tidak ada data
    noDataContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        paddingVertical: 20,
        // Hapus background, border, shadow dari sini agar hanya gambar dan teks
        // backgroundColor: '#fff',
        // borderRadius: 12,
        // borderWidth: 1,
        // borderColor: '#eee',
    },
    noDataImage: {
        width: 150, // Sesuaikan ukuran gambar
        height: 150, // Sesuaikan ukuran gambar
        marginBottom: 10,
    },
    noDataText: {
        fontSize: 16,
        color: '#777',
        marginTop: 10,
    },
    loadingIndicator: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    flatListSectionContentContainer: {
        // Gaya untuk FlatList di dalam section (jika perlu padding tambahan)
    }
});
