import { useEffect, useState } from "react";
import { supabase } from "../../database/supabaseClient";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  FileText, Shield, AlertTriangle, Layers, Activity, UserCog, BarChart2, PlusCircle,
  User,
  UserCog2,
  ListCheck,
  User2Icon
} from "lucide-react";

const dashboardItems = [
  { key: "Proses", label: "Proses", icon: Layers, color: "bg-blue-100 text-blue-700", table: "Proses" },
  { key: "SubProses", label: "Sub-Proses", icon: Layers, color: "bg-blue-100 text-blue-700", table: "SubProses" },
  { key: "Aktivitas", label: "Aktivitas", icon: Activity, color: "bg-yellow-100 text-yellow-700", table: "Aktivitas" },
  { key: "SubAktivitas", label: "Sub-Aktivitas", icon: Activity, color: "bg-yellow-100 text-yellow-700", table: "SubAktivitas" },
  { key: "ManajemenOperasi", label: "Manajemen Operasi", icon: FileText, color: "bg-indigo-100 text-indigo-700", table: "ManajemenOperasi" },
  { key: "total_bahaya", label: "Bahaya Kesehatan", icon: AlertTriangle, color: "bg-red-100 text-red-700" },
  { key: "total_risiko", label: "Risiko Kesehatan", icon: Shield, color: "bg-orange-100 text-orange-700" },
  { key: "Hierarki", label: "Hierarki", icon: ListCheck, color: "bg-purple-100 text-purple-700", table: "Hierarki" },
  { key: "InputHRA", label: "Data HRA", icon: FileText, color: "bg-teal-100 text-teal-700", table: "InputHRA" },
  { key: "AkunManagement", label: "Karyawan", icon: User2Icon, color: "bg-green-100 text-green-700", table: "AkunManagement" },

];

export default function Dashboard({ logout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [counts, setCounts] = useState({});
  const navigate = useNavigate();

  const fetchCounts = async () => {
    const newCounts = {};

    // Loop semua master table biasa
    for (const item of dashboardItems) {
      // Skip yang bukan tabel biasa (contoh: total_bahaya)
      if (!item.table) continue;

      const { count, error } = await supabase
        .from(item.table)
        .select("*", { count: "exact", head: true });

      newCounts[item.key] = error ? 0 : count;
    }

    // Hitung total bahaya & risiko
    const { count: totalBahaya } = await supabase
      .from("InputHRA")
      .select("*", { count: "exact", head: true })
      .not("bahaya_kesehatan", "is", null);

    const { count: totalRisiko } = await supabase
      .from("InputHRA")
      .select("*", { count: "exact", head: true })
      .not("risiko_kesehatan", "is", null);

    newCounts["total_bahaya"] = totalBahaya || 0;
    newCounts["total_risiko"] = totalRisiko || 0;

    setCounts(newCounts);
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <>
      <div className="w-full flex">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        <main className="flex-1 p-6 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700 mb-2">Dashboard</h1>
            <p className="text-gray-600">Selamat datang di halaman Admin.</p>
          </div>

          {/* === AKSI CEPAT === */}
          <div className="relative border border-gray-300 rounded-xl p-6 mt-6">
            <h2 className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Aksi Cepat
            </h2>
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={() => navigate("/input-hra")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition"
              >
                <PlusCircle className="w-5 h-5" /> Input HRA Baru
              </button>

              <button
                onClick={() => navigate("/settings/akun-management")}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition"
              >
                <UserCog className="w-5 h-5" /> Tambah Akun
              </button>
            </div>
          </div>

          {/* === STATISTIK DATA === */}
          <div className="relative border border-gray-300 rounded-xl p-6 mt-6">
            <h2 className="absolute -top-3 left-4 bg-white px-2 text-sm font-semibold text-gray-700">
              Statistik Data
            </h2>
            <div className="flex items-center justify-between mb-4 mt-2">
              <button
                onClick={fetchCounts}
                className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 text-sm rounded"
              >
                <BarChart2 className="w-4 h-4" /> Refresh Statistik
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dashboardItems.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="p-4 rounded-xl shadow bg-white border border-gray-200">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="text-xl font-semibold text-gray-800">
                        {counts[key] ?? "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Modal Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Yakin ingin Logout?</h2>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  logout();
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}