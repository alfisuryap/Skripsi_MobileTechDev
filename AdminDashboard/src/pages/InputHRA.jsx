import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../../database/supabaseClient";
import { toast } from "react-toastify";

export default function InputHRA({ Logout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState({});
  const [editId, setEditId] = useState(null);
  const [masterProses, setMasterProses] = useState([]);
  const [masterSubProses, setMasterSubProses] = useState([]);
  const [masterAktivitas, setMasterAktivitas] = useState([]);
  const [masterSubAktivitas, setMasterSubAktivitas] = useState([]);
  const [masterHierarki, setMasteHierarki] = useState([]);

  const [dropdowns, setDropdowns] = useState({
    proses: [],
    sub_proses: [],
    aktivitas: [],
    sub_aktivitas: [],
    manajemen_operasi: [],
    bahaya_kesehatan: [],
    risiko_kesehatan: [],
    hierarki: []
  });

  const fields = [
    "kode_proses", "proses", "kode_sub_proses", "sub_proses",
    "kode_aktivitas", "aktivitas", "kode_sub_aktivitas", "sub_aktivitas",
    "manajemen_operasi", "bahaya_kesehatan", "risiko_kesehatan",
    "l_tp", "s_tp", "r_tp", "kode_tingkat_bahaya_tp", "tingkat_bahaya_tp",
    "l_dp", "s_dp", "r_dp", "kode_tingkat_bahaya_dp", "tingkat_bahaya_dp",
    "kode_hierarki", "hierarki", "preventive", "detective", "mitigative"
  ];

  const fetchData = async () => {
    const { data, error } = await supabase.from("InputHRA").select("*");
    if (error) toast.error("Gagal mengambil data");
    else setData(data);
  };


  const fetchDropdowns = async () => {
    const getOptions = async (table) => {
      const { data, error } = await supabase.from(table).select("*");
      if (error) return [];
      return data;
    };

    setDropdowns({
      proses: await getOptions("Proses"),
      sub_proses: await getOptions("SubProses"),
      aktivitas: await getOptions("Aktivitas"),
      sub_aktivitas: await getOptions("SubAktivitas"),
      manajemen_operasi: await getOptions("ManajemenOperasi"),
      bahaya_kesehatan: await getOptions("BahayaKesehatan"),
      risiko_kesehatan: await getOptions("RisikoKesehatan"),
      hierarki: await getOptions("Hierarki"),
    });
  };

  const fetchMasterProses = async () => {
    const { data, error } = await supabase.from("Proses").select("*");
    if (!error) setMasterProses(data);
  };

  useEffect(() => {
    fetchData();
    fetchMasterProses();
  }, []);

  const fetchMasterSubProses = async () => {
    const { data, error } = await supabase.from("SubProses").select("*");
    if (!error) setMasterSubProses(data);
  };

  useEffect(() => {
    fetchData();
    fetchMasterSubProses();
  }, []);

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  const fetchMasterAktivitas = async () => {
    const { data, error } = await supabase.from("Aktivitas").select("*");
    if (!error) setMasterAktivitas(data);
  };

  useEffect(() => {
    fetchData();
    fetchMasterAktivitas();
  }, []);

  const fetchMasterSubAktivitas = async () => {
    const { data, error } = await supabase.from("SubAktivitas").select("*");
    if (!error) setMasterSubAktivitas(data);
  };

  useEffect(() => {
    fetchData();
    fetchMasterSubAktivitas();
  }, []);

  const fetchMasterHierarki = async () => {
    const { data, error } = await supabase.from("Hierarki").select("*");
    if (!error) setMasterHierarki(data);
  };

  useEffect(() => {
    fetchData();
    fetchMasterHierarki();
  }, []);

  const openAddForm = () => {
    setEditId(null);
    setFormData({});
    setShowFormModal(true);
  };

  const openEditForm = (item) => {
    setEditId(item.id);
    setFormData(item);
    setShowFormModal(true);
  };

  const closeForm = () => {
    setEditId(null);
    setFormData({});
    setShowFormModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };
    if (name === "l_tp" || name === "s_tp") {
      updated.r_tp = (parseInt(updated.l_tp) || 0) * (parseInt(updated.s_tp) || 0);
    }
    if (name === "l_dp" || name === "s_dp") {
      updated.r_dp = (parseInt(updated.l_dp) || 0) * (parseInt(updated.s_dp) || 0);
    }
    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };

    if (editId) {
      const { error } = await supabase.from("InputHRA").update(payload).eq("id", editId);
      if (error) toast.error("Gagal update data");
      else toast.success("Data diperbarui");
    } else {
      const { error } = await supabase.from("InputHRA").insert([payload]);
      if (error) toast.error("Gagal menambah data");
      else toast.success("Data ditambahkan");
    }

    closeForm();
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    const { error } = await supabase.from("InputHRA").delete().eq("id", id);
    if (error) toast.error("Gagal menghapus data");
    else {
      toast.success("Data dihapus");
      fetchData();
    }
  };

  const isDropdownField = (f) => [
    "kode_proses", "proses", "kode_sub_proses", "sub_proses",
    "kode_aktivitas", "aktivitas", "kode_sub_aktivitas", "sub_aktivitas",
    "manajemen_operasi", "bahaya_kesehatan", "risiko_kesehatan",
    "kode_hierarki", "hierarki"
  ].includes(f);

  const getDropdownOptions = (f) => {
    if (f.includes("proses")) return dropdowns.proses;
    if (f.includes("sub_proses")) return dropdowns.sub_proses;
    if (f.includes("aktivitas") && !f.includes("sub")) return dropdowns.aktivitas;
    if (f.includes("sub_aktivitas")) return dropdowns.sub_aktivitas;
    if (f.includes("manajemen_operasi")) return dropdowns.manajemen_operasi;
    if (f.includes("bahaya_kesehatan")) return dropdowns.bahaya_kesehatan;
    if (f.includes("risiko_kesehatan")) return dropdowns.risiko_kesehatan;
    if (f.includes("hierarki")) return dropdowns.hierarki;
    return [];
  };

  return (
    <>
      <div className="w-full flex">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-indigo-700 mb-4">Input HRA</h1>
          <button onClick={openAddForm} className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            + Tambah Data
          </button>

          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm table-auto border">
              <thead className="bg-gray-100 text-center">
                <tr>
                  {fields.map((f) => (
                    <th key={f} className="px-2 py-1 border">{f.replaceAll("_", " ").toUpperCase()}</th>
                  ))}
                  <th className="px-2 py-1 border">AKSI</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={fields.length + 1} className="text-center py-4 text-gray-500">Tidak ada data.</td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id} className="text-center border-t">
                      {fields.map((f) => (
                        <td key={f} className="border px-1 py-1">{item[f]}</td>
                      ))}
                      <td className="border px-1 py-1">
                        <button onClick={() => openEditForm(item)} className="text-blue-600 hover:underline mr-2">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Hapus</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-4xl max-h-screen overflow-auto">
            <h2 className="text-xl font-semibold mb-4">{editId ? "Edit Data HRA" : "Tambah Data HRA"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f}>
                  <label className="block text-sm font-medium mb-1">{f.replaceAll("_", " ")}</label>
                  {isDropdownField(f) ? (
                    <select
                      name={f}
                      value={formData[f] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Pilih {f.replaceAll("_", " ")}</option>
                      {getDropdownOptions(f).map((opt) => (
                        <option key={opt.kode || opt.id} value={opt.kode || opt.nama}>{opt.nama || opt.kode}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name={f}
                      value={formData[f] || ""}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  )}
                </div>
              ))}
              <div className="col-span-2 flex justify-end gap-2 mt-4">
                <button type="button" onClick={closeForm} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Batal</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
          <div className="bg-white p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">Yakin ingin Logout?</h2>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowLogoutModal(false)} className="px-4 py-2 text-sm rounded bg-gray-100 hover:bg-gray-200">
                Batal
              </button>
              <button onClick={() => { Logout(); setShowLogoutModal(false); }} className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-700">
                Ya, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}