import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import useIdleTimer from "./hook/useIdleTimer";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import InputHRA from "./pages/InputHRA";
import Proses from "./pages/master-data/Proses";
import SubProses from "./pages/master-data/SubProses";
import Aktivitas from "./pages/master-data/Aktivitas";
import SubAktivitas from "./pages/master-data/SubAktivitas";
import ManajemenOperasi from "./pages/master-data/ManajemenOperasi";
import BahayaKesehatan from "./pages/master-data/BahayaKesehatan";
import RisikoKesehatan from "./pages/master-data/RisikoKesehatan";
import Hierarki from "./pages/master-data/Hierarki";
import Login from "./pages/Login";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Mengecek localStorage saat load
  useEffect(() => {
    const isAuth = localStorage.getItem("auth") === "true";
    setIsLoggedIn(isAuth);
  }, []);

  // Login handler
  const login = () => {
    localStorage.setItem("auth", "true");
    setIsLoggedIn(true);
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem("auth");
    setIsLoggedIn(false);
    toast.info("Anda telah logout otomatis karena tidak aktif.");
  };

  // ⏳ Pasang idle timer
  useIdleTimer(
    () => {
      if (isLoggedIn) logout();
    },
    5 * 60 * 1000,
    30 * 1000,
    () => {
      if (isLoggedIn) {
        toast.warn("Sesi Anda hampir habis! Klik di mana saja untuk tetap login.", {
          autoClose: 30000,
        });
      }
    }
  );

  return (
    <Router>

      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {isLoggedIn ? (
        <Routes>
          <Route path="/dashboard" element={<Dashboard logout={logout} />} />
          <Route path="/input-hra" element={<InputHRA />} />
          <Route path="/master-data/proses" element={<Proses />} />
          <Route path="/master-data/sub-proses" element={<SubProses />} />
          <Route path="/master-data/aktivitas" element={<Aktivitas />} />
          <Route path="/master-data/sub-aktivitas" element={<SubAktivitas />} />
          <Route path="/master-data/manajemen-operasi" element={<ManajemenOperasi />} />
          <Route path="/master-data/bahaya-kesehatan" element={<BahayaKesehatan />} />
          <Route path="/master-data/risiko-kesehatan" element={<RisikoKesehatan />} />
          <Route path="/master-data/hierarki" element={<Hierarki />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<Login login={login} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
