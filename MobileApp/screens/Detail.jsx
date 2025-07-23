import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    Modal,
    Image,
    SafeAreaView,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../config/supabase';

export default function DetailScreen({ navigation }) {
    const route = useRoute();
    // Menerima activityItem (InputHRA lengkap) dan teks bahaya spesifik yang diklik
    const { activityItem, selectedDangerText } = route.params;

    const [activeTab, setActiveTab] = useState('danger'); // 'danger' atau 'risk'
    const [activeRiskScoreTab, setActiveRiskScoreTab] = useState('withControl'); // 'withControl' atau 'withoutControl'
    const [riskMatrixVisible, setRiskMatrixVisible] = useState(false);
    const [controllingModalVisible, setControllingModalVisible] = useState(false);
    const [activeControllingTab, setActiveControllingTab] = useState('hierarchy'); // 'hierarchy' atau 'activities'
    const [hierarchiesData, setHierarchiesData] = useState([]); // Mengubah dari singular hierarkiData menjadi plural hierarchiesData
    const [expandedActivity, setExpandedActivity] = useState(null);

    // Fetch Hierarki data based on hierarki_id from activityItem
    useEffect(() => {
        const fetchHierarchies = async () => {
            if (activityItem?.id) {
                // Step 1: Get all hierarki_id's associated with this InputHRA
                const { data: inputHraHierarkiLinks, error: linkError } = await supabase
                    .from('inputhra_hierarki')
                    .select('hierarki_id')
                    .eq('inputhra_id', activityItem.id);

                if (linkError) {
                    console.error('Error fetching inputhra_hierarki links:', linkError);
                    setHierarchiesData([]);
                    return;
                }

                if (inputHraHierarkiLinks.length > 0) {
                    const hierarkiIds = inputHraHierarkiLinks.map(link => link.hierarki_id);

                    // Step 2: Fetch details for each hierarki_id
                    const { data: hierarchies, error: hierarchiesError } = await supabase
                        .from('Hierarki')
                        .select('id, kode, hierarki')
                        .in('id', hierarkiIds);

                    if (hierarchiesError) {
                        console.error('Error fetching Hierarki details:', hierarchiesError);
                        setHierarchiesData([]);
                    } else {
                        setHierarchiesData(hierarchies);
                    }
                } else {
                    setHierarchiesData([]);
                }
            } else {
                setHierarchiesData([]);
            }
        };
        fetchHierarchies();
    }, [activityItem?.id]); // Dipicu saat ID activityItem berubah

    // Data placeholder untuk Risk Follow-Up (dari Figma)
    const riskFollowUpText = "Tindakan perbaikan yang diperlukan dalam jangka 3 bulan. Dilakukan identifikasi dan identifikasi penulolahan. Monitoring dilakukan diperlukan jangka mingguan. BOD dan CEO yang akan melakukan tindakan.";

    // Data Controlling Activities (dari kolom 'pengendalian_preventive', 'pengendalian_detective', 'pengendalian_mitigative' di InputHRA)
    const controllingActivitiesData = [];
    if (activityItem.pengendalian_preventive) {
        controllingActivitiesData.push({ id: 'preventive', type: 'Preventive', description: activityItem.pengendalian_preventive });
    }
    if (activityItem.pengendalian_detective) {
        controllingActivitiesData.push({ id: 'detective', type: 'Detective', description: activityItem.pengendalian_detective });
    }
    if (activityItem.pengendalian_mitigative) {
        controllingActivitiesData.push({ id: 'mitigative', type: 'Mitigative', description: activityItem.pengendalian_mitigative });
    }

    // Sumber gambar untuk bahaya dan risiko
    const dangerImageSource = activityItem.foto_bahaya_kesehatan
        ? { uri: activityItem.foto_bahaya_kesehatan }
        : require('../assets/nodata.png'); // Pastikan Anda memiliki gambar placeholder ini

    const riskImageSource = activityItem.foto_risiko_kesehatan
        ? { uri: activityItem.foto_risiko_kesehatan }
        : require('../assets/nodata.png'); // Pastikan Anda memiliki gambar placeholder ini

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Details</Text> {/* Judul header diubah menjadi "Details" */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollViewContent}>
                {/* Section: Process */}
                <View style={styles.processCard}>
                    <Text style={styles.processLabel}>Process</Text>
                    <Text style={styles.processValue}>{activityItem?.proses_id?.kode || 'N/A'} - {activityItem?.proses_id?.proses || 'N/A'}</Text>
                </View>

                {/* Section: Risk Category */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoLabel}>Risk Category</Text>
                    {/* Menampilkan nama kategori manajemen_operasi */}
                    <Text style={styles.infoValue}>{activityItem?.manajemen_operasi_id?.manajemen_operasi || '-'}</Text>
                </View>

                {/* Tabs Danger / Risk */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'danger' && styles.activeTab]}
                        onPress={() => setActiveTab('danger')}
                    >
                        <Text style={[styles.tabText, activeTab === 'danger' && styles.activeTabText]}>Danger</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'risk' && styles.activeTab]}
                        onPress={() => setActiveTab('risk')}
                    >
                        <Text style={[styles.tabText, activeTab === 'risk' && styles.activeTabText]}>Risk</Text>
                    </TouchableOpacity>
                </View>

                {/* Konten Tab Danger */}
                {activeTab === 'danger' && (
                    <View style={styles.tabContent}>
                        {/* Gambar Bahaya Kesehatan */}
                        <Image
                            source={dangerImageSource}
                            style={styles.bahayaImage}
                            resizeMode="contain"
                            onError={(e) => console.log('Error loading danger image:', e.nativeEvent.error)}
                        />
                        {/* Teks Bahaya Kesehatan */}
                        <Text style={styles.bahayaKesehatanMainText}>{selectedDangerText || 'Deskripsi bahaya tidak tersedia.'}</Text>

                        {/* Risk Score Section */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Risk Score</Text>
                                <TouchableOpacity onPress={() => setRiskMatrixVisible(true)}>
                                    <Ionicons name="information-circle-outline" size={24} color="#2F80ED" />
                                </TouchableOpacity>
                            </View>
                            {/* Sub-Tabs With Control / Without Control */}
                            <View style={styles.riskScoreSubTabs}>
                                <TouchableOpacity
                                    style={[styles.riskScoreSubTabButton, activeRiskScoreTab === 'withControl' && styles.activeRiskScoreSubTab]}
                                    onPress={() => setActiveRiskScoreTab('withControl')}
                                >
                                    <Text style={[styles.riskScoreSubTabText, activeRiskScoreTab === 'withControl' && styles.activeRiskScoreSubTabText]}>With Control</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.riskScoreSubTabButton, activeRiskScoreTab === 'withoutControl' && styles.activeRiskScoreSubTab]}
                                    onPress={() => setActiveRiskScoreTab('withoutControl')}
                                >
                                    <Text style={[styles.riskScoreSubTabText, activeRiskScoreTab === 'withoutControl' && styles.activeRiskScoreSubTabText]}>Without Control</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Konten Risk Score Sub-Tab */}
                            {activeRiskScoreTab === 'withControl' ? (
                                <View style={styles.riskScoreContent}>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Likelihood</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.likelihood_dengan_pengendalian || '0'}</Text>
                                    </View>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Severity</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.severity_dengan_pengendalian || '0'}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.riskScoreButton}>
                                        <Text style={styles.riskScoreButtonText}>{activityItem.tingkat_bahaya_dengan_pengendalian}</Text>
                                        <Text style={styles.riskScoreButtonValue}>{activityItem.risk_dengan_pengendalian || '0'}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.riskScoreContent}>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Likelihood</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.likelihood_tanpa_pengendalian || '0'}</Text>
                                    </View>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Severity</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.severity_tanpa_pengendalian || '0'}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.riskScoreButton}>
                                        <Text style={styles.riskScoreButtonText}>{activityItem.tingkat_bahaya_tanpa_pengendalian}</Text>
                                        <Text style={styles.riskScoreButtonValue}>{activityItem.risk_tanpa_pengendalian || '0'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Controlling Section (Moved from main view, still accessible via modal) */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Controlling</Text>
                                <TouchableOpacity onPress={() => setControllingModalVisible(true)}>
                                    <Ionicons name="information-circle-outline" size={24} color="#2F80ED" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.controllingTabs}>
                                <TouchableOpacity
                                    style={[styles.controllingTabButton, activeControllingTab === 'hierarchy' && styles.activeControllingTab]}
                                    onPress={() => setActiveControllingTab('hierarchy')}
                                >
                                    <Text style={[styles.controllingTabText, activeControllingTab === 'hierarchy' && styles.activeControllingTabText]}>Hierarchy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.controllingTabButton, activeControllingTab === 'activities' && styles.activeControllingTab]}
                                    onPress={() => setActiveControllingTab('activities')}
                                >
                                    <Text style={[styles.controllingTabText, activeControllingTab === 'activities' && styles.activeControllingTabText]}>Activities</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Konten Controlling Tab */}
                            {activeControllingTab === 'hierarchy' ? (
                                <View style={styles.controllingContent}>
                                    {hierarchiesData.length > 0 ? (
                                        hierarchiesData.map(item => (
                                            <View key={item.id} style={styles.controllingHierarchyItem}>
                                                <Text style={styles.controllingHierarchyLabel}>{item.kode} </Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noDataText}>Data hierarki tidak ditemukan.</Text>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.modalContentSection}>
                                    {controllingActivitiesData.length > 0 ? (
                                        controllingActivitiesData.map(item => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.modalActivityAccordionHeader}
                                                onPress={() => setExpandedActivity(expandedActivity === item.id ? null : item.id)}
                                            >
                                                <Text style={styles.modalActivityAccordionTitle}>{item.type}</Text>
                                                <Ionicons
                                                    name={expandedActivity === item.id ? 'chevron-up' : 'chevron-down'}
                                                    size={20}
                                                    color="#555"
                                                />
                                                {expandedActivity === item.id && (
                                                    <Text style={styles.modalActivityAccordionContent}>{item.description}</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={styles.noDataText}>Tidak ada aktivitas pengendalian.</Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Konten Tab Risk */}
                {activeTab === 'risk' && (
                    <View style={styles.tabContent}>

                        <Image
                            source={riskImageSource}
                            style={styles.bahayaImage}
                            resizeMode="contain"
                            onError={(e) => console.log('Error loading risk image:', e.nativeEvent.error)}
                        />
                        <Text style={styles.bahayaKesehatanMainText}>{activityItem.risiko_kesehatan}</Text>

                        {/* Risk Score Section */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Risk Score</Text>
                                <TouchableOpacity onPress={() => setRiskMatrixVisible(true)}>
                                    <Ionicons name="information-circle-outline" size={24} color="#2F80ED" />
                                </TouchableOpacity>
                            </View>
                            {/* Sub-Tabs With Control / Without Control */}
                            <View style={styles.riskScoreSubTabs}>
                                <TouchableOpacity
                                    style={[styles.riskScoreSubTabButton, activeRiskScoreTab === 'withControl' && styles.activeRiskScoreSubTab]}
                                    onPress={() => setActiveRiskScoreTab('withControl')}
                                >
                                    <Text style={[styles.riskScoreSubTabText, activeRiskScoreTab === 'withControl' && styles.activeRiskScoreSubTabText]}>With Control</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.riskScoreSubTabButton, activeRiskScoreTab === 'withoutControl' && styles.activeRiskScoreSubTab]}
                                    onPress={() => setActiveRiskScoreTab('withoutControl')}
                                >
                                    <Text style={[styles.riskScoreSubTabText, activeRiskScoreTab === 'withoutControl' && styles.activeRiskScoreSubTabText]}>Without Control</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Konten Risk Score Sub-Tab */}
                            {activeRiskScoreTab === 'withControl' ? (
                                <View style={styles.riskScoreContent}>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Likelihood</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.likelihood_dengan_pengendalian || '0'}</Text>
                                    </View>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Severity</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.severity_dengan_pengendalian || '0'}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.riskScoreButton}>
                                        <Text style={styles.riskScoreButtonText}>{activityItem.tingkat_bahaya_dengan_pengendalian}</Text>
                                        <Text style={styles.riskScoreButtonValue}>{activityItem.risk_dengan_pengendalian || '0'}</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.riskScoreContent}>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Likelihood</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.likelihood_tanpa_pengendalian || '0'}</Text>
                                    </View>
                                    <View style={styles.riskScoreRow}>
                                        <Text style={styles.riskScoreDetailText}>Severity</Text>
                                        <Text style={styles.riskScoreDetailValue}>{activityItem.severity_tanpa_pengendalian || '0'}</Text>
                                    </View>
                                    <TouchableOpacity style={styles.riskScoreButton}>
                                        <Text style={styles.riskScoreButtonText}>{activityItem.tingkat_bahaya_tanpa_pengendalian}</Text>
                                        <Text style={styles.riskScoreButtonValue}>{activityItem.risk_tanpa_pengendalian || '0'}</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Controlling Section (Moved from main view, still accessible via modal) */}
                        <View style={styles.sectionCard}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Controlling</Text>
                                <TouchableOpacity onPress={() => setControllingModalVisible(true)}>
                                    <Ionicons name="information-circle-outline" size={24} color="#2F80ED" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.controllingTabs}>
                                <TouchableOpacity
                                    style={[styles.controllingTabButton, activeControllingTab === 'hierarchy' && styles.activeControllingTab]}
                                    onPress={() => setActiveControllingTab('hierarchy')}
                                >
                                    <Text style={[styles.controllingTabText, activeControllingTab === 'hierarchy' && styles.activeControllingTabText]}>Hierarchy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.controllingTabButton, activeControllingTab === 'activities' && styles.activeControllingTab]}
                                    onPress={() => setActiveControllingTab('activities')}
                                >
                                    <Text style={[styles.controllingTabText, activeControllingTab === 'activities' && styles.activeControllingTabText]}>Activities</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Konten Controlling Tab */}
                            {activeControllingTab === 'hierarchy' ? (
                                 <View style={styles.controllingContent}>
                                    {hierarchiesData.length > 0 ? (
                                        hierarchiesData.map(item => (
                                            <View key={item.id} style={styles.controllingHierarchyItem}>
                                                <Text style={styles.controllingHierarchyLabel}>{item.kode} </Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noDataText}>Data hierarki tidak ditemukan.</Text>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.modalContentSection}>
                                    {controllingActivitiesData.length > 0 ? (
                                        controllingActivitiesData.map(item => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.modalActivityAccordionHeader}
                                                onPress={() => setExpandedActivity(expandedActivity === item.id ? null : item.id)}
                                            >
                                                <Text style={styles.modalActivityAccordionTitle}>{item.type}</Text>
                                                <Ionicons
                                                    name={expandedActivity === item.id ? 'chevron-up' : 'chevron-down'}
                                                    size={20}
                                                    color="#555"
                                                />
                                                {expandedActivity === item.id && (
                                                    <Text style={styles.modalActivityAccordionContent}>{item.description}</Text>
                                                )}
                                            </TouchableOpacity>
                                        ))
                                    ) : (
                                        <Text style={styles.noDataText}>Tidak ada aktivitas pengendalian.</Text>

                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Risk Matrix Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={riskMatrixVisible}
                onRequestClose={() => setRiskMatrixVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity onPress={() => setRiskMatrixVisible(false)} style={styles.modalCloseButton}>
                            <Ionicons name="close-circle" size={30} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Risk Matrix</Text>
                        <Image
                            source={require('../assets/risk_matrix.png')}
                            style={styles.riskMatrixImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.modalSubtitle}>Risk Follow-Up</Text>
                        <Text style={styles.modalText}>{riskFollowUpText}</Text>
                    </View>
                </View>
            </Modal>

            {/* Controlling Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={controllingModalVisible}
                onRequestClose={() => setControllingModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <TouchableOpacity onPress={() => setControllingModalVisible(false)} style={styles.modalCloseButton}>
                            <Ionicons name="close-circle" size={30} color="#666" />
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>Controlling</Text>
                        <View style={styles.controllingModalTabs}>
                            <TouchableOpacity
                                style={[styles.controllingModalTabButton, activeControllingTab === 'hierarchy' && styles.activeControllingModalTab]}
                                onPress={() => setActiveControllingTab('hierarchy')}
                            >
                                <Text style={[styles.controllingModalTabText, activeControllingTab === 'hierarchy' && styles.activeControllingModalTabText]}>Hierarchy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.controllingModalTabButton, activeControllingTab === 'activities' && styles.activeControllingModalTab]}
                                onPress={() => setActiveControllingTab('activities')}
                            >
                                <Text style={[styles.controllingModalTabText, activeControllingTab === 'activities' && styles.activeControllingModalTabText]}>Activities</Text>
                            </TouchableOpacity>
                        </View>

                        {activeControllingTab === 'hierarchy' ? (
                             <View style={styles.controllingContent}>
                                    {hierarchiesData.length > 0 ? (
                                        hierarchiesData.map(item => (
                                            <View key={item.id} style={styles.controllingHierarchyItem}>
                                                <Text style={styles.controllingHierarchyLabel}>{item.kode} </Text>
                                            </View>
                                        ))
                                    ) : (
                                        <Text style={styles.noDataText}>Data hierarki tidak ditemukan.</Text>
                                    )}
                                </View>
                        ) : (
                            <View style={styles.modalContentSection}>
                                {controllingActivitiesData.length > 0 ? (
                                    controllingActivitiesData.map(item => (
                                        <TouchableOpacity
                                            key={item.id}
                                            style={styles.modalActivityAccordionHeader}
                                            onPress={() => setExpandedActivity(expandedActivity === item.id ? null : item.id)}
                                        >
                                            <Text style={styles.modalActivityAccordionTitle}>{item.type}</Text>
                                            <Ionicons
                                                name={expandedActivity === item.id ? 'chevron-up' : 'chevron-down'}
                                                size={20}
                                                color="#555"
                                            />
                                            {expandedActivity === item.id && (
                                                <Text style={styles.modalActivityAccordionContent}>{item.description}</Text>
                                            )}
                                        </TouchableOpacity>
                                    ))
                                ) : (
                                    <Text style={styles.noDataText}>Tidak ada aktivitas pengendalian.</Text>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
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
        flexShrink: 1,
    },
    scrollViewContent: {
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    infoCard: {
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
        borderColor: '#eee',
    },
    infoLabel: {
        fontSize: 14,
        color: '#777',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    processCard: {
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
        borderColor: '#eee',
        alignItems: 'center', // Center content horizontally
    },
    processLabel: {
        fontSize: 14,
        color: '#777',
        marginBottom: 4,
        backgroundColor: '#E6F0FF', // Light blue background
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontWeight: 'bold',
    },
    processValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 8,
        marginBottom: 10,
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 5,
    },
    tabsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4,
        marginTop: 16,
    },
    tabButton: {
        alignItems: 'center',
        borderRadius: 6,
        flexDirection: 'row',
        justifyContent: 'center',
        paddingHorizontal: 20,
        marginRight: 8,
        flex: 1,
        paddingVertical: 8,
        backgroundColor: 'transparent',
    },
    activeTab: {
        backgroundColor: '#2F80ED',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    activeTabText: {
        color: '#fff',
    },
    tabContent: {
        marginTop: 16,
        backgroundColor: '#ffffffff'
    },
    bahayaImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 10,
        backgroundColor: '#ffffffff', // Placeholder background
    },
    bahayaKesehatanMainText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#eee',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    riskScoreSubTabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4,
        marginBottom: 10,
    },
    riskScoreSubTabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
        backgroundColor: 'transparent',
    },
    activeRiskScoreSubTab: {
        backgroundColor: '#2F80ED',
    },
    riskScoreSubTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    activeRiskScoreSubTabText: {
        color: '#fff',
    },
    riskScoreContent: {
        marginTop: 10,
        alignItems: 'center', // Center content for risk score
    },
    riskScoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%', // Control width for alignment
        marginBottom: 8,
    },
    riskScoreDetailText: {
        fontSize: 14,
        color: '#555',
    },
    riskScoreDetailValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
    },
    riskScoreButton: {
        backgroundColor: '#FF6347', // Reddish color for High
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '80%', // Match width with rows above
        marginTop: 10,
    },
    riskScoreButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    riskScoreButtonValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
    },
    riskScoreWithoutControlValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2F80ED',
        marginTop: 10,
        marginBottom: 10,
    },
    // Controlling section styles (retained for modal)
    controllingTabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4,
        marginBottom: 10,
    },
    controllingTabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
        backgroundColor: 'transparent',
    },
    activeControllingTab: {
        backgroundColor: '#2F80ED',
    },
    controllingTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    activeControllingTabText: {
        color: '#fff',
    },
    controllingContent: {
        marginTop: 10,
    },
    controllingHierarchyItem: {
        
        marginBottom: 8,
        padding: 5,
        borderRadius:10,
        alignItems: 'center',
        backgroundColor: '#2F80ED',
        flexDirection: 'column',
        
    },
    controllingHierarchyLabel: {
        fontWeight: 'bold',
        color: '#fff'
    },
    controllingActivityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    controllingActivityType: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#2F80ED',
        marginRight: 10,
    },
    controllingActivityDescription: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    // Modal Styles
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '90%',
        maxHeight: '80%',
    },
    modalCloseButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    modalSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#333',
    },
    modalText: {
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
        color: '#555',
    },
    riskMatrixImage: {
        width: '100%',
        height: 200,
        marginBottom: 10,
    },
    controllingModalTabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        padding: 4,
        marginBottom: 10,
        width: '100%',
    },
    controllingModalTabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
        backgroundColor: 'transparent',
    },
    activeControllingModalTab: {
        backgroundColor: '#2F80ED',
    },
    controllingModalTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    activeControllingModalTabText: {
        color: '#fff',
    },
    modalContentSection: {
        width: '100%',
        marginTop: 10,
    },
    // New styles for modal hierarchy card
    modalHierarchyCard: {
        backgroundColor: '#F0F8FF', // Light blue background
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E6F0FF',
        marginBottom: 10,
        width: '100%',
    },
    modalHierarchyLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2F80ED',
        marginBottom: 5,
    },
    modalHierarchyDescription: {
        fontSize: 14,
        color: '#333',
        textAlign: 'center',
        marginBottom: 10,
    },
    // New styles for modal activities accordion
    modalActivityAccordionHeader: {
        backgroundColor: '#E0E0E0', // Light grey background for header
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalActivityAccordionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1, // Take available space
    },
    modalActivityAccordionContent: {
        fontSize: 14,
        color: '#555',
        marginTop: 10,
        paddingHorizontal: 10,
        paddingBottom: 5,
        width: '100%', // Ensure content takes full width
    },
});
