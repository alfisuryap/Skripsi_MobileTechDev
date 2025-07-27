import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Modal,
    Image,
    SafeAreaView,
    FlatList,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../config/supabase';

// Helper function to count items separated by semicolon
const countSemicolonSeparatedItems = (text) => {
    if (!text) {
        return 0;
    }
    const items = String(text).split(';').map(item => item.trim()).filter(item => item !== '');
    return items.length;
};

export default function HRADetailScreen({ navigation }) {
    const route = useRoute();
    const { subProsesItem, parentProsesItem, originalHraIds } = route.params;

    const [loadingDetails, setLoadingDetails] = useState(true);
    const [detailHRAItems, setDetailHRAItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    const getUniqueActivityDisplayKey = (item) => {
        if (!item) return 'N/A';
        // Prioritaskan aktivitas_id untuk judul utama dan kunci pengelompokan
        if (item.aktivitas_id?.kode && item.aktivitas_id?.aktivitas) {
            return `${String(item.aktivitas_id.kode)} ${String(item.aktivitas_id.aktivitas)}`;
        }
        // Fallback ke sub_aktivitas_id jika tidak ada aktivitas_id yang relevan
        if (item.sub_aktivitas_id?.kode && item.sub_aktivitas_id?.sub_aktivitas) {
            return `${String(item.sub_aktivitas_id.kode)} ${String(item.sub_aktivitas_id.sub_aktivitas)}`;
        }
        return `Item ID: ${String(item.id)}`; // Fallback jika tidak ada kode/nama yang relevan
    };

    // Fungsi helper untuk mengelompokkan data InputHRA berdasarkan Aktivitas/Sub-Aktivitas unik (kode + nama)
    const groupHRAByActivitySubActivity = (data) => {
        const uniqueActivityMap = new Map();
        data.forEach(item => {
            // Gunakan kombinasi kode dan nama sebagai kunci unik
            const uniqueKey = getUniqueActivityDisplayKey(item);

            if (!uniqueActivityMap.has(uniqueKey)) {
                uniqueActivityMap.set(uniqueKey, item); // Simpan item pertama yang ditemukan untuk kunci ini
            }
        });
        return Array.from(uniqueActivityMap.values());
    };

    // Mengambil semua item InputHRA yang termasuk dalam sub_proses ini
    useEffect(() => {
        const fetchAllRelatedHRAItems = async () => {
            if (!originalHraIds || originalHraIds.length === 0) {
                setDetailHRAItems([]);
                setLoadingDetails(false);
                return;
            }

            setLoadingDetails(true);
            const { data, error } = await supabase
                .from('InputHRA')
                .select(`
                    id,
                    proses_id (id, kode, proses),
                    sub_proses_id (id, kode, sub_proses),
                    aktivitas_id (id, kode, aktivitas),
                    sub_aktivitas_id (id, kode, sub_aktivitas),
                    hierarki_id,
                    bahaya_kesehatan,
                    risiko_kesehatan,
                    manajemen_operasi_id (id, manajemen_operasi),
                    likelihood_tanpa_pengendalian,
                    severity_tanpa_pengendalian,
                    kode_tingkat_bahaya_tanpa_pengendalian,
                    tingkat_bahaya_tanpa_pengendalian,
                    kode_tingkat_bahaya_dengan_pengendalian,
                    tingkat_bahaya_dengan_pengendalian,
                    likelihood_dengan_pengendalian,
                    severity_dengan_pengendalian,
                    risk_dengan_pengendalian,
                    risk_tanpa_pengendalian,
                    pengendalian_preventive,
                    pengendalian_detective,
                    pengendalian_mitigative,
                    foto_bahaya_kesehatan,
                    foto_risiko_kesehatan
                `)
                .in('id', originalHraIds);

            if (error) {
                console.error('Error fetching related HRA items:', error);
                Alert.alert('Error', 'Gagal memuat detail aktivitas HRA.');
                setDetailHRAItems([]);
            } else {
                console.log('Raw related HRA items fetched:', data);
                // Kelompokkan data sebelum menyimpannya ke state
                const groupedData = groupHRAByActivitySubActivity(data);
                setDetailHRAItems(groupedData);
                console.log('Grouped HRA items for display:', groupedData);
            }
            setLoadingDetails(false);
        };

        fetchAllRelatedHRAItems();
    }, [originalHraIds]);

    // Fungsi untuk mendapatkan teks yang akan ditampilkan untuk setiap aktivitas/sub-aktivitas
    const getActivitySubActivityDisplayText = (item) => {
        return getUniqueActivityDisplayKey(item);
    };

    // Filter data aktivitas/sub-aktivitas berdasarkan query pencarian DAN sub_proses_id
    const filteredActivities = detailHRAItems.filter(item => {
        const text = getActivitySubActivityDisplayText(item).toLowerCase();
        // Filter berdasarkan query pencarian DAN pastikan sub_proses_id cocok
        return text.includes(searchQuery.toLowerCase()) && item.sub_proses_id?.id === subProsesItem.id;
    });

    // Render item untuk FlatList aktivitas/sub-aktivitas
    const renderDetailItem = ({ item, index }) => {
        if (!item) {
            console.warn("Skipping rendering for null/undefined item in FlatList:", index);
            return null;
        }

        // Menghitung Risk Category: 1 jika manajemen_operasi_id ada, 0 jika tidak
        const riskCategoryCount = item.manajemen_operasi_id ? 1 : 0;

        // Menghitung Danger/Risk: jumlah item dari bahaya_kesehatan dan risiko_kesehatan
        const totalDangerRiskCount =
            countSemicolonSeparatedItems(item.bahaya_kesehatan) +
            countSemicolonSeparatedItems(item.risiko_kesehatan);

        return (
            <TouchableOpacity style={styles.activityDetailCard} onPress={() => navigation.navigate('ManajemenOperasiScreen', { activityItem: item })}>
                <View style={styles.activityDetailContent}>
                    <Text style={styles.activityDetailTitle}>{getActivitySubActivityDisplayText(item)}</Text>
                    <View style={styles.activityDetailGrid}>
                        <View style={styles.gridColumn}>
                            <Text style={styles.gridLabel}>Sub-Activity</Text>
                            <Text style={styles.gridValue}>{String(index + 1)}</Text>
                        </View>
                        <View style={styles.gridColumn}>
                            <Text style={styles.gridLabel}>Risk Category</Text>
                            {/* Menggunakan nilai count yang baru */}
                            <Text style={styles.gridValue}>{String(riskCategoryCount)}</Text>
                        </View>
                        <View style={styles.gridColumn}>
                            <Text style={styles.gridLabel}>Danger/Risk</Text>
                            {/* Menggunakan nilai count yang baru */}
                            <Text style={styles.gridValue}>{String(totalDangerRiskCount)}</Text>
                        </View>
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#555" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header Layar Utama */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{String(subProsesItem?.sub_proses || 'Detail HRA')}</Text>
            </View>

            {/* Search Bar for Activities (Fixed) */}
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

            {/* List of Activities/Sub-Activities under this Sub-Proses (Scrollable) */}
            {loadingDetails ? (
                <ActivityIndicator size="large" color="#2F80ED" style={styles.loadingIndicator} />
            ) : (
                <FlatList
                    data={filteredActivities}
                    renderItem={renderDetailItem}
                    keyExtractor={item => String(item.id)}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Tidak ada aktivitas/sub-aktivitas ditemukan untuk proses ini.</Text>
                        </View>
                    )}
                    contentContainerStyle={styles.flatListContentContainer}
                />
            )}
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
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    topTextContainer: {
        flex: 1,
        marginRight: 10,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    siteName: {
        fontSize: 14,
        color: '#555',
        marginLeft: 5,
    },
    overburdenRemoval: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    lastUpdate: {
        fontSize: 12,
        color: '#777',
    },
    topImage: {
        width: 120,
        height: 100,
        resizeMode: 'contain',
    },
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
    activityDetailCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 10,
        marginHorizontal: 16,
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
    activityDetailContent: {
        flex: 1,
        marginRight: 10,
    },
    activityDetailTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2F80ED',
        marginBottom: 8,
    },
    activityDetailGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    gridColumn: {
        flex: 1,
        alignItems: 'center',
    },
    gridLabel: {
        fontSize: 12,
        color: '#777',
        marginBottom: 4,
    },
    gridValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    loadingIndicator: {
        marginTop: 50,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
    },
    flatListContentContainer: {
        paddingBottom: 20,
    }
});
