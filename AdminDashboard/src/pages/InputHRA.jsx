import { useState } from "react";
import Sidebar from "../components/Sidebar";

export default function InputHRA({ Logout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <div className="w-full flex">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-indigo-700 mb-4">Input HRA</h1>
        </main>
      </div>

      {/* Modal Konfirmasi Logout */}
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
