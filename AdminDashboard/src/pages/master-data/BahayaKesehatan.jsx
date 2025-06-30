import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../../database/supabaseClient";
import { toast } from "react-toastify";

export default function BahayaKesehatan({ Logout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);

  const [data, setData] = useState([]);
  const [bahaya_kesehatan, setBahayaKesehatan] = useState("");
  const [editId, setEditId] = useState(null);

  const fetchData = async () => {
    const { data, error } = await supabase.from("BahayaKesehatan").select("*");
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

  const openAddForm = () => {
    setEditId(null);
    setBahayaKesehatan("");
    setShowFormModal(true);
  };

  const openEditForm = (item) => {
    setEditId(item.id);
    setBahayaKesehatan(item.bahaya_kesehatan);
    setShowFormModal(true);
  };

  const closeForm = () => {
    setEditId(null);
    setBahayaKesehatan("");
    setShowFormModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!bahaya_kesehatan) {
      toast.error("Mohon isi field!");
      return;
    }

    const { data: existing } = await supabase.from("BahayaKesehatan").select("*").eq("bahaya_kesehatan", bahaya_kesehatan);
    if (!editId && existing.length > 0) {
      toast.error("Bahaya Kesehatan sudah ada!");
      return;
    }

    if (editId) {
      const { error } = await supabase.from("BahayaKesehatan").update({ bahaya_kesehatan }).eq("id", editId);
      if (error) toast.error("Gagal update data!");
      else toast.success("Data berhasil diperbarui");
    } else {
      const { error } = await supabase.from("BahayaKesehatan").insert([{ bahaya_kesehatan }]);
      if (error) toast.error("Gagal menambahkan data!");
      else toast.success("Data berhasil ditambahkan");
    }

    closeForm();
    fetchData();
  };

  const handleDelete = async (id) => {
    const konfirmasi = confirm("Yakin ingin menghapus data ini?");
    if (!konfirmasi) return;

    const { error } = await supabase.from("ManajemenOperasi").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus data!");
    else {
      toast.success("Data berhasil dihapus");
      fetchData();
    }
  };

  return (
    <>
      <div className="flex">
        <div className="w-64">
          <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        </div>
        <div className="flex-1 px-6 py-6">
          <div className="w-full max-w-none px-4">
            <h1 className="text-2xl font-bold text-indigo-700 mb-4">Master Data Bahaya Kesehatan</h1>
            <button
              onClick={openAddForm}
              className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              + Tambah Data
            </button>

            <div className="w-full bg-white p-6 rounded shadow overflow-x-auto">
              <table className="w-full text-base text-left table-auto">
                <thead>
                  <tr className="border-b bg-gray-100 text-center">
                    <th className="py-2 px-3">Bahaya Kesehatan</th>
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
                        <td className="py-2 px-3">{row.bahaya_kesehatan}</td>
                        <td className="py-2 px-3 flex gap-2">
                          <button
                            onClick={() => openEditForm(row)}
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

      {/* Modal Form */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editId ? "Edit Data" : "Tambah Data"}
            </h2>

            <label className="block text-sm font-medium mb-1">Bahaya Kesehatan</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
              value={bahaya_kesehatan}
              onChange={(e) => setBahayaKesehatan(e.target.value)}
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

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
