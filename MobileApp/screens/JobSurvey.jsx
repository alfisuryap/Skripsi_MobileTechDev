import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { RadioButton, Button, TextInput, ProgressBar } from 'react-native-paper';
import { supabase } from '../config/supabase'; // Assuming this path is correct for your Supabase client
import { AntDesign } from '@expo/vector-icons'; // For icons in the modal

export default function JobSurvey({ navigation }) {
    const [step, setStep] = useState(1);
    const [inputHRA, setInputHRA] = useState([]);
    const [selectedProses, setSelectedProses] = useState(null);
    const [selectedSubProses, setSelectedSubProses] = useState(null);
    const [selectedAktivitas, setSelectedAktivitas] = useState(null);
    const [selectedSubAktivitas, setSelectedSubAktivitas] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showQuitConfirmationModal, setShowQuitConfirmationModal] = useState(false); // New state for quit confirmation
    const [isSubmitting, setIsSubmitting] = useState(false); // To prevent multiple submissions
    const [userId, setUserId] = useState(null);
    const [isSurveyCompletedToday, setIsSurveyCompletedToday] = useState(false); // State for daily check

    // This checks if there are any sub_aktivitas for the currently selected hierarchy
    const hasSubAktivitas = inputHRA.some(
        i =>
            i.proses_id?.id === selectedProses &&
            i.sub_proses_id?.id === selectedSubProses &&
            i.aktivitas_id?.id === selectedAktivitas &&
            i.sub_aktivitas_id !== null && // Check if sub_aktivitas_id object exists
            i.sub_aktivitas_id?.id !== null && // Check if its 'id' property is not null
            i.sub_aktivitas_id?.id !== '' // Check if its 'id' property is not empty
    );

    // Determine if the current step is the final step
    const isFinalStep = step === 4;

    useEffect(() => {
        const fetchDataAndUser = async () => {
            setLoading(true);
            let currentUserId = null;

            // Fetch user session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.error('Error fetching user:', userError);
            } else if (user) {
                setUserId(user.id);
                currentUserId = user.id;
            } else {
                console.warn('No user logged in.');
            }

            // Check if survey was completed today for the current user
            if (currentUserId) {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Set to start of today
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1); // Set to start of tomorrow

                const { data: existingAnswers, error: answersError } = await supabase
                    .from('JobSurveyAnswer')
                    .select('id')
                    .eq('user_id', currentUserId)
                    .gte('created_at', today.toISOString())
                    .lt('created_at', tomorrow.toISOString());

                if (answersError) {
                    console.error('Error checking existing survey answers:', answersError);
                } else if (existingAnswers && existingAnswers.length > 0) {
                    setIsSurveyCompletedToday(true);
                    console.log("Survey already completed for today.");
                }
            }

            // Fetch HRA data
            const { data, error } = await supabase
                .from('InputHRA')
                .select(`
                    id,
                    proses_id (
                        id,
                        kode,
                        proses
                    ),
                    sub_proses_id (
                        id,
                        kode,
                        sub_proses
                    ),
                    aktivitas_id (
                        id,
                        kode,
                        aktivitas
                    ),
                    sub_aktivitas_id (
                        id,
                        kode,
                        sub_aktivitas
                    )
                `);
            if (error) {
                console.error('Error fetching InputHRA:', error);
            } else {
                console.log('✅ InputHRA fetched successfully:', data);
                setInputHRA(data);
            }
            setLoading(false);
        };
        fetchDataAndUser();
    }, []);

    const handleNext = () => {
        // Validation before proceeding to the next step or showing submit modal
        if (step === 1 && !selectedProses) return;
        if (step === 2 && !selectedSubProses) return;
        if (step === 3 && !selectedAktivitas) return;
        if (step === 4 && hasSubAktivitas && !selectedSubAktivitas) return;

        if (isFinalStep) {
            setShowConfirmationModal(true); // Show confirmation modal on final step
        } else {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
            // Reset selections for the step being backed out of
            if (step === 2) setSelectedSubProses(null);
            if (step === 3) setSelectedAktivitas(null);
            if (step === 4) setSelectedSubAktivitas(null);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setShowConfirmationModal(false); // Close confirmation modal immediately

        try {
            const answersToSave = [];

            // Find the specific InputHRA entry that matches all selections
            const finalSelectedHRA = inputHRA.find(
                i =>
                    i.proses_id?.id === selectedProses &&
                    i.sub_proses_id?.id === selectedSubProses &&
                    i.aktivitas_id?.id === selectedAktivitas &&
                    (hasSubAktivitas ? i.sub_aktivitas_id?.id === selectedSubAktivitas : true)
            );

            if (!finalSelectedHRA) {
                console.error("Error: Could not find matching InputHRA entry for submission.");
                // You might want to show an error message to the user here
                setIsSubmitting(false);
                return;
            }

            // Add Proses answer
            if (selectedProses) {
                const prosesData = finalSelectedHRA.proses_id;
                answersToSave.push({
                    user_id: userId,
                    inputhra_id: finalSelectedHRA.id, // ID of the InputHRA row
                    question: 'What Process are you working on today?',
                    answer: `${prosesData.kode} - ${prosesData.proses}`,
                });
            }

            // Add Sub Proses answer
            if (selectedSubProses) {
                const subProsesData = finalSelectedHRA.sub_proses_id;
                answersToSave.push({
                    user_id: userId,
                    inputhra_id: finalSelectedHRA.id,
                    question: 'Which Sub Process are you working on today?',
                    answer: `${subProsesData.kode} - ${subProsesData.sub_proses}`,
                });
            }

            // Add Aktivitas answer
            if (selectedAktivitas) {
                const aktivitasData = finalSelectedHRA.aktivitas_id;
                answersToSave.push({
                    user_id: userId,
                    inputhra_id: finalSelectedHRA.id,
                    question: 'What Activity are you working on today?',
                    answer: `${aktivitasData.kode} - ${aktivitasData.aktivitas}`,
                });
            }

            // Add Sub Aktivitas answer if it exists and is selected
            if (hasSubAktivitas && selectedSubAktivitas) {
                const subAktivitasData = finalSelectedHRA.sub_aktivitas_id;
                answersToSave.push({
                    user_id: userId,
                    inputhra_id: finalSelectedHRA.id,
                    question: 'Which Sub Activity are you working on today?',
                    answer: `${subAktivitasData.kode} - ${subAktivitasData.sub_aktivitas}`,
                });
            }

            // Insert data into JobSurveyAnswer table
            const { error: insertError } = await supabase
                .from('JobSurveyAnswer')
                .insert(answersToSave);

            if (insertError) {
                console.error('Error saving survey answers:', insertError);
                // Handle error, e.g., show an error message to the user
            } else {
                console.log('Survey answers saved successfully!');
                setIsSurveyCompletedToday(true); // Mark survey as completed for today
                setShowSuccessModal(true); // Show success modal
                // Optionally reset form state here if user is not immediately navigated
                setSelectedProses(null);
                setSelectedSubProses(null);
                setSelectedAktivitas(null);
                setSelectedSubAktivitas(null);
                setStep(1); // Reset to first step
            }
        } catch (error) {
            console.error('An unexpected error occurred during submission:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Function to handle quitting the survey
    const handleQuitSurvey = () => {
        setShowQuitConfirmationModal(false); // Close the quit confirmation modal
        navigation.goBack(); // Navigate back (quit the survey)
    };

    const renderStep = () => {
        if (isSurveyCompletedToday) {
            return (
                <View style={styles.completedMessageCard}>
                    <AntDesign name="checkcircleo" size={60} color="#4CAF50" style={{ marginBottom: 20 }} />
                    <Text style={styles.completedMessageTitle}>Survei Selesai!</Text>
                    <Text style={styles.completedMessageText}>
                        Anda telah menyelesaikan survei untuk hari ini. Silakan kembali besok untuk mengisi survei lagi.
                    </Text>
                    <Button
                        mode="contained"
                        buttonColor="#2F80ED"
                        onPress={() => navigation.navigate("MainTabs", {
                            screen: "Home",
                            params: { refresh: true },
                        })} // Navigate back to a Home screen
                        style={styles.modalButton}
                    >
                        Kembali ke Beranda
                    </Button>
                </View >
            );
        }

        switch (step) {
            case 1:
                const uniqueProses = [...new Map(inputHRA.map(item => [item.proses_id?.id, item.proses_id])).values()]
                    .filter(item => item !== null && item.id !== null);

                return (
                    <>
                        <View style={styles.card}>
                            <Text>Questions:</Text>
                            <Text style={styles.questionTitle}>What Process are you working on today?</Text>
                            {uniqueProses.map((prosesItem, i) => (
                                <RadioButton.Item
                                    key={`proses_${prosesItem.id || i}`}
                                    label={`${prosesItem.kode} - ${prosesItem.proses}`}
                                    value={prosesItem.id}
                                    status={selectedProses === prosesItem.id ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setSelectedProses(prosesItem.id);
                                        setSelectedSubProses(null);
                                        setSelectedAktivitas(null);
                                        setSelectedSubAktivitas(null);
                                    }}
                                />
                            ))}
                        </View>
                        <TextInput
                            label="Answer"
                            value={
                                inputHRA.find(i => i.proses_id?.id === selectedProses)
                                    ? `${inputHRA.find(i => i.proses_id?.id === selectedProses).proses_id.kode} - ${inputHRA.find(i => i.proses_id?.id === selectedProses).proses_id.proses}`
                                    : ''
                            }
                            readOnly
                            style={styles.input}
                        />
                    </>
                );
            case 2:
                const uniqueSubProses = [...new Map(
                    inputHRA
                        .filter(i => i.proses_id?.id === selectedProses)
                        .map(i => [i.sub_proses_id?.id, i.sub_proses_id])
                ).values()]
                    .filter(item => item !== null && item.id !== null);

                return (
                    <>
                        <View style={styles.card}>
                            <Text>Questions:</Text>
                            <Text style={styles.questionTitle}>Which Sub Process are you working on today?</Text>
                            {uniqueSubProses.map((subProsesItem, i) => (
                                <RadioButton.Item
                                    key={`subproses_${subProsesItem.id || i}`}
                                    label={`${subProsesItem.kode} - ${subProsesItem.sub_proses}`}
                                    value={subProsesItem.id}
                                    status={selectedSubProses === subProsesItem.id ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setSelectedSubProses(subProsesItem.id);
                                        setSelectedAktivitas(null);
                                        setSelectedSubAktivitas(null);
                                    }}
                                />
                            ))}
                        </View>
                        <TextInput
                            label="Answer"
                            value={
                                inputHRA.find(i => i.sub_proses_id?.id === selectedSubProses)
                                    ? `${inputHRA.find(i => i.sub_proses_id?.id === selectedSubProses).sub_proses_id.kode} - ${inputHRA.find(i => i.sub_proses_id?.id === selectedSubProses).sub_proses_id.sub_proses}`
                                    : ''
                            }
                            readOnly
                            style={styles.input}
                        />
                    </>
                );
            case 3:
                const uniqueAktivitas = [...new Map(
                    inputHRA
                        .filter(i =>
                            i.proses_id?.id === selectedProses &&
                            i.sub_proses_id?.id === selectedSubProses
                        )
                        .map(i => [i.aktivitas_id?.id, i.aktivitas_id])
                ).values()]
                    .filter(item => item !== null && item.id !== null);

                return (
                    <>
                        <View style={styles.card}>
                            <Text>Questions:</Text>
                            <Text style={styles.questionTitle}>What Activity are you working on today?</Text>
                            {uniqueAktivitas.map((aktivitasItem, i) => (
                                <RadioButton.Item
                                    key={`aktivitas_${aktivitasItem.id || i}`}
                                    label={`${aktivitasItem.kode} - ${aktivitasItem.aktivitas}`}
                                    value={aktivitasItem.id}
                                    status={selectedAktivitas === aktivitasItem.id ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        setSelectedAktivitas(aktivitasItem.id);
                                        setSelectedSubAktivitas(null);
                                    }}
                                />
                            ))}
                        </View>
                        <TextInput
                            label="Answer"
                            value={
                                inputHRA.find(i => i.aktivitas_id?.id === selectedAktivitas)
                                    ? `${inputHRA.find(i => i.aktivitas_id?.id === selectedAktivitas).aktivitas_id.kode} - ${inputHRA.find(i => i.aktivitas_id?.id === selectedAktivitas).aktivitas_id.aktivitas}`
                                    : ''
                            }
                            readOnly
                            style={styles.input}
                        />
                    </>
                );
            case 4:
                const uniqueSubAktivitas = [...new Map(
                    inputHRA
                        .filter(i =>
                            i.proses_id?.id === selectedProses &&
                            i.sub_proses_id?.id === selectedSubProses &&
                            i.aktivitas_id?.id === selectedAktivitas &&
                            i.sub_aktivitas_id !== null &&
                            i.sub_aktivitas_id.id !== null &&
                            i.sub_aktivitas_id.id !== ''
                        )
                        .map(i => [i.sub_aktivitas_id?.id, i.sub_aktivitas_id])
                ).values()]
                    .filter(item => item !== null && item.id !== null);

                return (
                    <>
                        <View style={styles.card}>
                            <Text>Questions:</Text>
                            <Text style={styles.questionTitle}>Which Sub Activity are you working on today?</Text>
                            {hasSubAktivitas ? (
                                uniqueSubAktivitas.map((subAktivitasItem, i) => (
                                    <RadioButton.Item
                                        key={`subaktivitas_${subAktivitasItem.id || i}`}
                                        label={`${subAktivitasItem.kode} - ${subAktivitasItem.sub_aktivitas}`}
                                        value={subAktivitasItem.id}
                                        status={selectedSubAktivitas === subAktivitasItem.id ? 'checked' : 'unchecked'}
                                        onPress={() => setSelectedSubAktivitas(subAktivitasItem.id)}
                                    />
                                ))
                            ) : (
                                <Text style={styles.noSubActivityText}>No sub-activities found for the selected options.</Text>
                            )}
                        </View>
                        <TextInput
                            label="Answer"
                            value={
                                inputHRA.find(i => i.sub_aktivitas_id?.id === selectedSubAktivitas)
                                    ? `${inputHRA.find(i => i.sub_aktivitas_id?.id === selectedSubAktivitas).sub_aktivitas_id.kode} - ${inputHRA.find(i => i.sub_aktivitas_id?.id === selectedSubAktivitas).sub_aktivitas_id.sub_aktivitas}`
                                    : ''
                            }
                            readOnly
                            style={styles.input}
                        />
                    </>
                );
            default:
                return <Text style={styles.questionTitle}>More steps coming soon...</Text>;
        }
    };

    if (loading) return <ActivityIndicator size="large" color="#000" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }} />;
    // Only show "No data available" if loading is complete, inputHRA is empty, AND survey is not completed today
    if (!loading && (!inputHRA || inputHRA.length === 0) && !isSurveyCompletedToday) return <Text style={{ flex: 1, textAlign: 'center', marginTop: 50 }}>No data available.</Text>;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={{ flex: 1 }}>
                {/* Tombol "X Job Survey" yang memicu modal konfirmasi keluar */}
                <TouchableOpacity onPress={() => setShowQuitConfirmationModal(true)} style={{ marginBottom: 15, flexDirection: 'row', alignItems: 'center' }}>
                    <AntDesign name="close" size={24} color="black" />
                    <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 10 }}>Job Survey</Text>
                </TouchableOpacity>

                <View style={styles.content}>
                    {renderStep()}
                </View>

                {!isSurveyCompletedToday && ( // Only show navigation buttons if survey is not completed today
                    <View style={styles.navButtons}>
                        <Button mode="outlined" onPress={handleBack} style={styles.button} disabled={step === 1 || isSubmitting}>Back</Button>
                        <Button
                            mode="contained"
                            buttonColor="#2F80ED"
                            onPress={handleNext}
                            style={styles.button}
                            disabled={
                                isSubmitting || // Disable if submitting
                                (step === 1 && !selectedProses) ||
                                (step === 2 && !selectedSubProses) ||
                                (step === 3 && !selectedAktivitas) ||
                                (step === 4 && hasSubAktivitas && !selectedSubAktivitas)
                            }
                        >
                            {isFinalStep ? 'Submit' : 'Next'}
                        </Button>
                    </View>
                )}
                {!isSurveyCompletedToday && ( // Only show progress bar if survey is not completed today
                    <>
                        <ProgressBar progress={step / 4} color="#2F80ED" style={styles.progressBar} />
                        <Text style={styles.progressText}>{step}/4</Text>
                    </>
                )}
            </ScrollView>

            {/* Confirmation Modal (for submitting) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showConfirmationModal}
                onRequestClose={() => setShowConfirmationModal(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <AntDesign name="questioncircle" size={50} color="#FFD700" style={styles.modalIcon} />
                        <Text style={styles.modalTitle}>Konfirmasi</Text>
                        <Text style={styles.modalText}>Apakah Anda yakin ingin mengirim Survei Pekerjaan Anda?</Text>
                        <Text style={styles.modalTextSmall}>Jawaban Anda akan segera disimpan dan Anda tidak akan dapat mengubahnya lagi setelah Anda mengirimkannya.</Text>
                        <View style={styles.modalButtons}>
                            <Button
                                mode="contained"
                                buttonColor="#2F80ED"
                                onPress={handleSubmit}
                                style={styles.modalButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Mengirim...' : 'Kirim'}
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => setShowConfirmationModal(false)}
                                style={styles.modalButton}
                                disabled={isSubmitting}
                            >
                                Batal
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showSuccessModal}
                onRequestClose={() => setShowSuccessModal(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <AntDesign name="checkcircle" size={50} color="#4CAF50" style={styles.modalIcon} />
                        <Text style={styles.modalTitle}>Hore!</Text>
                        <Text style={styles.modalText}>Anda berhasil mengirim Survei Pekerjaan Anda!</Text>
                        <View style={styles.modalButtons}>
                            <Button
                                mode="contained"
                                buttonColor="#2F80ED"
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    navigation.navigate("MainTabs", {
                                        screen: "SHE",
                                        params: { refresh: true },
                                    }); // Navigate to Personal HRA
                                }}
                                style={styles.modalButton}
                            >
                                Pergi ke HRA Pribadi
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => {
                                    setShowSuccessModal(false);
                                    navigation.navigate("MainTabs", {
                                        screen: "Home",
                                        params: { refresh: true },
                                    }); // Sesuaikan dengan nama rute Home Anda
                                }}
                                style={styles.modalButton}
                            >
                                Kembali ke Beranda
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Quit Confirmation Modal (New) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={showQuitConfirmationModal}
                onRequestClose={() => setShowQuitConfirmationModal(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <AntDesign name="questioncircle" size={50} color="#FFD700" style={styles.modalIcon} />
                        <Text style={styles.modalTitle}>Konfirmasi</Text>
                        <Text style={styles.modalText}>Apakah Anda yakin ingin keluar?</Text>
                        <Text style={styles.modalTextSmall}>Anda belum menyelesaikan survei pekerjaan Anda.</Text>
                        <View style={styles.modalButtons}>
                            <Button
                                mode="contained"
                                buttonColor="#FF6347" // Warna merah untuk tombol keluar
                                onPress={handleQuitSurvey}
                                style={styles.modalButton}
                            >
                                Keluar
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={() => setShowQuitConfirmationModal(false)}
                                style={styles.modalButton}
                            >
                                Batal
                            </Button>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        margin: 20,
    },
    content: {
        marginTop: '20%',
    },
    card: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#a4a5a7ff',
        padding: 16,
        marginTop: 10,
        borderRadius: 10,
    },
    questionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 12,
    },
    noSubActivityText: {
        fontStyle: 'italic',
        color: '#777',
        textAlign: 'center',
        marginTop: 10,
    },
    input: {
        marginTop: 20,
        borderColor: '#a4a5a7ff',
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        backgroundColor: '#fff',
    },
    navButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        width: '48%',
        borderRadius: 5,
    },
    progressBar: {
        height: 8,
        marginTop: 24,
        borderRadius: 4,
    },
    progressText: {
        textAlign: 'center',
        color: '#777',
        marginTop: 8,
    },
    // Modal Styles (shared)
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
        maxWidth: 400,
    },
    modalIcon: {
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 16,
        color: '#555',
    },
    modalTextSmall: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 12,
        color: '#777',
        fontStyle: 'italic',
    },
    modalButtons: {
        flexDirection: 'column',
        width: '100%',
    },
    modalButton: {
        marginTop: 10,
        borderRadius: 8,
    },
    // Style for completed survey message
    completedMessageCard: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#d4edda', // Light green border for success
        padding: 20,
        marginTop: 50,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
    },
    completedMessageTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#28a745', // Green color
        marginBottom: 10,
    },
    completedMessageText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#555',
        marginBottom: 20,
    },
});
