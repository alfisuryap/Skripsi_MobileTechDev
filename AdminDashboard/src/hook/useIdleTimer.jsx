import { useEffect, useRef } from "react";

const useIdleTimer = (
    onIdle,
    timeout = 5 * 60 * 1000, // default 5 menit
    warningTime = 30 * 1000, // default 30 detik sebelum logout
    onWarning = () => { }
) => {
    const timerRef = useRef(null); // untuk menyimpan timeout logout
    const warningRef = useRef(null); // untuk menyimpan timeout peringatan

    // Mereset ulang semua timer setiap kali user beraktivitas
    const resetTimer = () => {
        clearTimeout(timerRef.current);
        clearTimeout(warningRef.current);

        // Set timer untuk peringatan (misal: muncul modal 30 detik sebelum logout)
        warningRef.current = setTimeout(() => {
            onWarning();
        }, timeout - warningTime);

        // Set timer utama untuk logout setelah user idle
        timerRef.current = setTimeout(() => {
            onIdle();
        }, timeout);
    };

    useEffect(() => {
        const events = ["mousemove", "keydown", "scroll", "click"];

        // Tambahkan event listener untuk semua interaksi user
        events.forEach((event) => window.addEventListener(event, resetTimer));
        resetTimer(); // Inisialisasi timer pertama saat komponen dimount

        // Cleanup saat komponen di-unmount
        return () => {
            events.forEach((event) => window.removeEventListener(event, resetTimer));
            clearTimeout(timerRef.current);
            clearTimeout(warningRef.current);
        };
    }, []);
};

export default useIdleTimer;