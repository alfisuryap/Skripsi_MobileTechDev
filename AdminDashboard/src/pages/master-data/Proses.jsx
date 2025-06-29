import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../../database/supabaseClient";
import { toast } from "react-toastify";

export default function Proses({ Logout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [data, setData] = useState([]);
  const [kode, setKode] = useState("");
  const [proses, setProses] = useState("");
  const [editId, setEditId] = useState(null);

  // Ambil data dari Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("Proses").select("*");
    if (error) {
      console.error("Fetch error:", error.message);
      toast.error("Gagal mengambil data");
    } else {
      setData(data);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Simpan atau edit data
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!kode || !proses) {
      toast.error("Mohon isi semua field!");
      return;
    }

    if (editId) {
      const { error } = await supabase
        .from("Proses")
        .update({ kode, proses })
        .eq("id", editId);
      if (error) toast.error("Gagal update data!");
      else toast.success("Data berhasil diperbarui");
    } else {
      const { error } = await supabase
        .from("Proses")
        .insert([{ kode, proses }]);
      if (error) toast.error("Gagal menambahkan data!");
      else toast.success("Data berhasil ditambahkan");
    }

    setKode("");
    setProses("");
    setEditId(null);
    fetchData();
  };

  const handleEdit = (item) => {
    setKode(item.kode);
    setProses(item.proses);
    setEditId(item.id);
  };

  const handleDelete = async (id) => {
    const konfirmasi = confirm("Yakin ingin menghapus data ini?");
    if (!konfirmasi) return;

    const { error } = await supabase.from("Proses").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus data!");
    else {
      toast.success("Data berhasil dihapus");
      fetchData();
    }
  };

  return (
    <>
      <div className="w-full flex">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        <div className="w-full px-6 py-6">
          <div className="mx-auto w-full max-w-6xl">
            <h1 className="text-2xl font-bold text-indigo-700 mb-4">Master Data Proses</h1>

            {/* Form Input */}
            <div className="w-full bg-white p-4 rounded shadow mb-6">
              <label className="block text-sm font-medium mb-1">Kode</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
              />

              <label className="block text-sm font-medium mb-1">Proses</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                value={proses}
                onChange={(e) => setProses(e.target.value)}
              />

              <button
                onClick={handleSubmit}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
              >
                {editId ? "Simpan Perubahan" : "Tambah"}
              </button>
            </div>

            {/* Table Data */}
            <div className="w-full bg-white p-4 rounded shadow overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3">Kode</th>
                    <th className="py-2 px-3">Proses</th>
                    <th className="py-2 px-3">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="text-center py-4 text-gray-500">
                        Tidak ada data.
                      </td>
                    </tr>
                  ) : (
                    data.map((row) => (
                      <tr key={row.id} className="border-b">
                        <td className="py-2 px-3">{row.kode}</td>
                        <td className="py-2 px-3">{row.proses}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button
                            onClick={() => handleEdit(row)}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(row.id)}
                            className="text-red-600 hover:underline"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
                  Logout();
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
