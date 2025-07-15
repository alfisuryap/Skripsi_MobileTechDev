import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { supabase } from "../../database/supabaseClient";
import { toast } from "react-toastify";
import { Pencil, Trash2 } from "lucide-react";

export default function InputHRA({ Logout }) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    proses_id: "",
    proses: "",
    sub_proses_id: "",
    sub_proses: "",
    aktivitas_id: "",
    aktivitas: "",
    sub_aktivitas_id: "",
    sub_aktivitas: "",
    hierarki_id: [],
    hierarki: [],
    manajemen_operasi_id: "",
    manajemen_operasi: "",
    bahaya_kesehatan: "",
    risiko_kesehatan: "",
    likelihood_tanpa_pengendalian: "",
    severity_tanpa_pengendalian: "",
    risk_tanpa_pengendalian: "",
    kode_tingkat_bahaya_tanpa_pengendalian: "",
    tingkat_bahaya_tanpa_pengendalian: "",
    likelihood_dengan_pengendalian: "",
    severity_dengan_pengendalian: "",
    risk_dengan_pengendalian: "",
    kode_tingkat_bahaya_dengan_pengendalian: "",
    tingkat_bahaya_dengan_pengendalian: "",
    pengendalian_preventive: "",
    pengendalian_detective: "",
    pengendalian_mitigative: "",
    foto_bahaya_kesehatan: "",
    foto_risiko_kesehatan: "",
  });

  const [dropdowns, setDropdowns] = useState({
    proses: [],
    sub_proses: [],
    aktivitas: [],
    sub_aktivitas: [],
    manajemen_operasi: [],
    hierarki: [],
  });

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  const fetchData = async () => {
    const { data, error } = await supabase
      .from("InputHRA")
      .select(`
      *,
      Proses(kode, proses),
      SubProses(kode, sub_proses),
      Aktivitas(kode, aktivitas),
      SubAktivitas(kode, sub_aktivitas),
      ManajemenOperasi(manajemen_operasi),
      inputhra_hierarki!fk_inputhra(
        hierarki_id,
        Hierarki(kode, hierarki)
      )
    `);

    if (error) {
      console.error("Fetch error", error);
      toast.error("Gagal mengambil data dari database");
    } else {
      const formatted = data.map(item => ({
        ...item,
        hierarki_id: item.inputhra_hierarki?.map(h => h.hierarki_id) || [],
        hierarki: item.inputhra_hierarki?.map(h => h.Hierarki?.hierarki) || [],
      }));
      setData(formatted);
    }
  };

  const fetchDropdowns = async () => {
    const getOptions = async (table) => {
      const { data, error } = await supabase.from(table).select("*");
      return error ? [] : data;
    };

    setDropdowns({
      proses: await getOptions("Proses"),
      sub_proses: await getOptions("SubProses"),
      aktivitas: await getOptions("Aktivitas"),
      sub_aktivitas: await getOptions("SubAktivitas"),
      hierarki: await getOptions("Hierarki"),
      manajemen_operasi: await getOptions("ManajemenOperasi"),
    });
  };

  const getRiskLevel = (likelihood, severity) => {
    const matrix = [
      ["C", "C", "C", "C", "B"],
      ["C", "C", "C", "B", "B"],
      ["C", "B", "A", "A", "AA"],
      ["B", "A", "A", "AA", "AA"],
      ["B", "A", "A", "AA", "AA"],
    ];
    const kode = matrix[likelihood - 1][severity - 1];
    const tingkatMap = { C: "Low", B: "Medium", A: "High", AA: "Extreme" };
    return { kode, tingkat: tingkatMap[kode] };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    if (name === "proses_id") {
      const found = dropdowns.proses.find((x) => x.id == value);
      updated.proses = found?.proses || "";
      updated.kode_proses = found?.kode || "";
    }

    if (name === "sub_proses_id") {
      const found = dropdowns.sub_proses.find((x) => x.id == value);
      updated.sub_proses = found?.sub_proses || "";
      updated.kode_subproses = found?.kode || "";
    }
    if (name === "aktivitas_id") {
      const found = dropdowns.aktivitas.find((x) => x.id == value);
      updated.aktivitas = found?.aktivitas || "";
      updated.kode_aktivitas = found?.kode || "";
    }
    if (name === "sub_aktivitas_id") {
      const found = dropdowns.sub_aktivitas.find((x) => x.id == value);
      updated.sub_aktivitas = found?.sub_aktivitas || "";
      updated.kode_subaktivitas = found?.kode || "";
    }
    if (name === "hierarki_id") {
      const found = dropdowns.hierarki.find((x) => x.id == value);
      updated.hierarki = found?.hierarki || "";
      updated.kode_hierarki = found?.kode || "";
    } if (name === "manajemen_operasi_id") {
      const found = dropdowns.manajemen_operasi.find((x) => x.id == value);
      updated.manajemen_operasi = found?.manajemen_operasi || "";
    }

    if (name.includes("likelihood_tanpa_pengendalian") || name.includes("severity_tanpa_pengendalian")) {
      const likelihood = parseInt(updated.likelihood_tanpa_pengendalian);
      const severity = parseInt(updated.severity_tanpa_pengendalian);
      const result = getRiskLevel(likelihood, severity);
      updated.risk_tanpa_pengendalian = likelihood * severity;
      updated.kode_tingkat_bahaya_tanpa_pengendalian = result.kode;
      updated.tingkat_bahaya_tanpa_pengendalian = result.tingkat;
    }

    if (name.includes("likelihood_dengan_pengendalian") || name.includes("severity_dengan_pengendalian")) {
      const likelihood = parseInt(updated.likelihood_dengan_pengendalian);
      const severity = parseInt(updated.severity_dengan_pengendalian);
      const result = getRiskLevel(likelihood, severity);
      updated.risk_dengan_pengendalian = likelihood * severity;
      updated.kode_tingkat_bahaya_dengan_pengendalian = result.kode;
      updated.tingkat_bahaya_dengan_pengendalian = result.tingkat;
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("🚀 handleSubmit terpanggil");

    const payload = {
      proses_id: formData.proses_id ? Number(formData.proses_id) : null,
      sub_proses_id: formData.sub_proses_id ? Number(formData.sub_proses_id) : null,
      aktivitas_id: formData.aktivitas_id ? Number(formData.aktivitas_id) : null,
      sub_aktivitas_id: formData.sub_aktivitas_id ? Number(formData.sub_aktivitas_id) : null,
      manajemen_operasi_id: formData.manajemen_operasi_id ? Number(formData.manajemen_operasi_id) : null,
      bahaya_kesehatan: formData.bahaya_kesehatan,
      risiko_kesehatan: formData.risiko_kesehatan,
      likelihood_tanpa_pengendalian: Number(formData.likelihood_tanpa_pengendalian),
      severity_tanpa_pengendalian: Number(formData.severity_tanpa_pengendalian),
      risk_tanpa_pengendalian: formData.risk_tanpa_pengendalian,
      kode_tingkat_bahaya_tanpa_pengendalian: formData.kode_tingkat_bahaya_tanpa_pengendalian,
      tingkat_bahaya_tanpa_pengendalian: formData.tingkat_bahaya_tanpa_pengendalian,
      likelihood_dengan_pengendalian: Number(formData.likelihood_dengan_pengendalian),
      severity_dengan_pengendalian: Number(formData.severity_dengan_pengendalian),
      risk_dengan_pengendalian: formData.risk_dengan_pengendalian,
      kode_tingkat_bahaya_dengan_pengendalian: formData.kode_tingkat_bahaya_dengan_pengendalian,
      tingkat_bahaya_dengan_pengendalian: formData.tingkat_bahaya_dengan_pengendalian,
      pengendalian_preventive: formData.pengendalian_preventive,
      pengendalian_detective: formData.pengendalian_detective,
      pengendalian_mitigative: formData.pengendalian_mitigative,
      foto_bahaya_kesehatan: formData.foto_bahaya_kesehatan,
      foto_risiko_kesehatan: formData.foto_risiko_kesehatan,
    };

    console.log("📦 payload yang dikirim:", payload); // ← Tambahkan ini!

    let result;
    let id;
    if (editId) {
      result = await supabase.from("InputHRA").update(payload).eq("id", editId).select();
      id = editId;
      await supabase.from("inputhra_hierarki").delete().eq("inputhra_id", id); // hapus dulu
    } else {
      const insert = await supabase.from("InputHRA").insert(payload).select();
      if (insert.error) return toast.error("Gagal menyimpan data utama");
      id = insert.data[0].id;
    }

    // Simpan hierarki_id ke tabel relasi
    const hierarkiData = formData.hierarki_id.map(hid => ({
      inputhra_id: id,
      hierarki_id: hid,
    }));

    const relasiResult = await supabase.from("inputhra_hierarki").insert(hierarkiData);

    if (relasiResult.error) {
      console.error("Gagal simpan Hierarki relasi", relasiResult.error);
      toast.error("Gagal menyimpan data");
    } else {
      toast.success("Data berhasil disimpan");
      setShowFormModal(false);
      fetchData();
    }

  };

  const fields = [
    "bahaya_kesehatan", "risiko_kesehatan",
    "likelihood_tanpa_pengendalian", "severity_tanpa_pengendalian",
    "risk_tanpa_pengendalian", "kode_tingkat_bahaya_tanpa_pengendalian", "tingkat_bahaya_tanpa_pengendalian",
    "likelihood_dengan_pengendalian", "severity_dengan_pengendalian",
    "risk_dengan_pengendalian", "kode_tingkat_bahaya_dengan_pengendalian", "tingkat_bahaya_dengan_pengendalian",
    "pengendalian_preventive", "pengendalian_detective", "pengendalian_mitigative"
  ];

  const toTitleCase = (str) =>
    str
      .replace(/_/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1));

  const resetForm = () => {
    setFormData({
      proses_id: "",
      proses: "",
      sub_proses_id: "",
      sub_proses: "",
      aktivitas_id: "",
      aktivitas: "",
      sub_aktivitas_id: "",
      sub_aktivitas: "",
      hierarki_id: [],
      hierarki: [],
      manajemen_operasi_id: "",
      manajemen_operasi: "",
      bahaya_kesehatan: "",
      risiko_kesehatan: "",
      likelihood_tanpa_pengendalian: "",
      severity_tanpa_pengendalian: "",
      risk_tanpa_pengendalian: "",
      kode_tingkat_bahaya_tanpa_pengendalian: "",
      tingkat_bahaya_tanpa_pengendalian: "",
      likelihood_dengan_pengendalian: "",
      severity_dengan_pengendalian: "",
      risk_dengan_pengendalian: "",
      kode_tingkat_bahaya_dengan_pengendalian: "",
      tingkat_bahaya_dengan_pengendalian: "",
      pengendalian_preventive: "",
      pengendalian_detective: "",
      pengendalian_mitigative: "",
      foto_bahaya_kesehatan: "",
      foto_risiko_kesehatan: "",
    });
    setEditId(null);
  };
  const handleCancel = () => {
    console.log("Cancel clicked");
    resetForm();
    setShowFormModal(false);
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      proses: item.Proses?.proses || "",
      sub_proses: item.SubProses?.sub_proses || "",
      aktivitas: item.Aktivitas?.aktivitas || "",
      sub_aktivitas: item.SubAktivitas?.sub_aktivitas || "",
      hierarki_id: item.inputhra_hierarki?.map(h => h.hierarki_id) || [],
      hierarki: item.inputhra_hierarki?.map(h => h.Hierarki?.hierarki) || [],
      foto_bahaya_kesehatan: item.foto_bahaya_kesehatan || "",
      foto_risiko_kesehatan: item.foto_risiko_kesehatan || "",
    });
    setEditId(item.id);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Apakah anda yakin ingin menghapus?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("InputHRA").delete().eq("id", id);

    if (error) {
      console.error("Gagal hapus:", error);
      toast.error("Gagal menghapus data.");
    } else {
      toast.success("Data berhasil dihapus.");
      fetchData(); // Refresh data setelah delete
    }
  };

  const handleImageUpload = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    const folder = fieldName === "foto_bahaya_kesehatan" ? "foto_bahaya_kesehatan" : "foto_risiko_kesehatan";
    const filename = `${Date.now()}_${file.name}`;
    const path = `${folder}/${filename}`;

    const { error } = await supabase.storage
      .from("dokumen-hra")
      .upload(path, file);

    if (error) {
      console.error("Upload gagal", error.message);
      toast.error("Upload gambar gagal!");
      return;
    }

    const publicUrl = `https://cghmehqpyvjeghukblxm.supabase.co/storage/v1/object/public/dokumen-hra/${path}`;

    setFormData((prev) => ({
      ...prev,
      [fieldName]: publicUrl,
    }));

    toast.success("Gambar berhasil diunggah!");
  };


  return (
    <>
      <div className="w-full flex">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-indigo-700 mb-4">Input HRA</h1>
          <button
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            + Tambah Data
          </button>


          <div className="bg-white rounded shadow max-w-full overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-sm table-auto border">
                <thead className="bg-green-100 text-center text-xs sticky top-0 z-10">
                  <tr>
                    <th rowSpan="3" className="border px-2 py-1">Kode</th>
                    <th rowSpan="3" className="border px-2 py-1">Proses</th>
                    <th rowSpan="3" className="border px-2 py-1">Kode</th>
                    <th rowSpan="3" className="border px-2 py-1">Sub-Proses</th>
                    <th rowSpan="3" className="border px-2 py-1">Kode</th>
                    <th rowSpan="3" className="border px-2 py-1">Aktivitas</th>
                    <th rowSpan="3" className="border px-2 py-1">Kode</th>
                    <th rowSpan="3" className="border px-2 py-1">Sub-Aktivitas</th>
                    <th rowSpan="3" className="border px-2 py-1">Manajemen Operasi</th>
                    <th rowSpan="3" className="border px-2 py-1">Bahaya Kesehatan</th>
                    <th rowSpan="3" className="border px-2 py-1">Risiko Kesehatan</th>
                    <th colSpan="5" className="border">Tanpa Pengendalian</th>
                    <th colSpan="5" className="border">Dengan Pengendalian</th>
                    <th rowSpan="3" className="border px-2 py-1">Kode Hirarki</th>
                    <th rowSpan="3" className="border px-2 py-1">Hierarki</th>
                    <th colSpan="3" className="border">Pengendalian (Hierarki Kontrol)</th>
                    <th rowSpan="3" className="border px-2 py-1">Aksi</th>
                  </tr>
                  <tr>
                    <th className="border">L</th>
                    <th className="border">S</th>
                    <th className="border">R</th>
                    <th className="border">Kode Bahaya</th>
                    <th className="border">Tingkat Bahaya</th>

                    <th className="border">L</th>
                    <th className="border">S</th>
                    <th className="border">R</th>
                    <th className="border">Kode Bahaya</th>
                    <th className="border">Tingkat Bahaya</th>

                    <th rowSpan="2" className="border">Preventive</th>
                    <th rowSpan="2" className="border">Detective</th>
                    <th rowSpan="2" className="border">Mitigative</th>
                  </tr>
                </thead>


                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={27} className="text-center py-4 text-gray-500">Tidak ada data.</td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="text-center border-t">
                        <td className="border px-2 py-1">{item.Proses?.kode}</td>
                        <td className="border px-2 py-1">{item.Proses?.proses}</td>
                        <td className="border px-2 py-1">{item.SubAktivitas?.kode}</td>
                        <td className="border px-2 py-1">{item.SubProses?.sub_proses}</td>
                        <td className="border px-2 py-1">{item.Aktivitas?.kode}</td>
                        <td className="border px-2 py-1">{item.Aktivitas?.aktivitas}</td>
                        <td className="border px-2 py-1">{item.SubAktivitas?.kode}</td>
                        <td className="border px-2 py-1">{item.SubAktivitas?.sub_aktivitas}</td>
                        <td className="border px-2 py-1">{item.ManajemenOperasi?.manajemen_operasi}</td>
                        <td className="border px-2 py-1">{item.bahaya_kesehatan}</td>
                        <td className="border px-2 py-1">{item.risiko_kesehatan}</td>

                        {/* Tanpa Pengendalian */}
                        <td className="border px-2 py-1">{item.likelihood_tanpa_pengendalian}</td>
                        <td className="border px-2 py-1">{item.severity_tanpa_pengendalian}</td>
                        <td className="border px-2 py-1">{item.risk_tanpa_pengendalian}</td>
                        <td className="border px-2 py-1">{item.kode_tingkat_bahaya_tanpa_pengendalian}</td>
                        <td className="border px-2 py-1">{item.tingkat_bahaya_tanpa_pengendalian}</td>

                        {/* Dengan Pengendalian */}
                        <td className="border px-2 py-1">{item.likelihood_dengan_pengendalian}</td>
                        <td className="border px-2 py-1">{item.severity_dengan_pengendalian}</td>
                        <td className="border px-2 py-1">{item.risk_dengan_pengendalian}</td>
                        <td className="border px-2 py-1">{item.kode_tingkat_bahaya_dengan_pengendalian}</td>
                        <td className="border px-2 py-1">{item.tingkat_bahaya_dengan_pengendalian}</td>

                        {/* Hirarki */}
                        <td className="border px-2 py-1">
                          {item.inputhra_hierarki?.map(h => h.Hierarki?.kode).join(", ")}
                        </td>

                        <td className="border px-2 py-1">
                          {item.inputhra_hierarki?.map(h => h.Hierarki?.hierarki).join(", ")}
                        </td>

                        {/* Pengendalian */}
                        <td className="border px-2 py-1">{item.pengendalian_preventive}</td>
                        <td className="border px-2 py-1">{item.pengendalian_detective}</td>
                        <td className="border px-2 py-1">{item.pengendalian_mitigative}</td>

                        {/* Aksi */}
                        <td className="border px-2 py-1">
                          <div className="flex justify-center gap-2">
                            <button
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
                                  handleDelete(item.id);
                                }
                              }}
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-5xl max-h-screen overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Tambah Data HRA</h2>
            <form onSubmit={handleSubmit} className="space-y-6 text-sm">

              {/* === PROSES === */}
              <div>
                <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Proses</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label>Kode</label>
                    <select name="proses_id" value={formData.proses_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                      <option value="">Pilih Kode</option>
                      {dropdowns.proses.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Proses</label>
                    <input type="text" value={formData.proses} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
                  </div>
                </div>
              </div>

              {/* === SUB PROSES === */}
              <div>
                <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Sub-Proses</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label>Kode</label>
                    <select name="sub_proses_id" value={formData.sub_proses_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                      <option value="">Pilih Kode</option>
                      {dropdowns.sub_proses.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Sub-Proses</label>
                    <input type="text" value={formData.sub_proses} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
                  </div>
                </div>
              </div>

              {/* === AKTIVITAS === */}
              <div>
                <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Aktivitas</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label>Kode</label>
                    <select name="aktivitas_id" value={formData.aktivitas_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                      <option value="">Pilih Kode</option>
                      {dropdowns.aktivitas.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Aktivitas</label>
                    <input type="text" value={formData.aktivitas} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
                  </div>
                </div>
              </div>

              {/* === SUB AKTIVITAS === */}
              <div>
                <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Sub-Aktivitas</h3>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <label>Kode</label>
                    <select name="sub_aktivitas_id" value={formData.sub_aktivitas_id} onChange={handleChange} className="w-full border px-3 py-2 rounded">
                      <option value="">Pilih Kode</option>
                      {dropdowns.sub_aktivitas.map(p => <option key={p.id} value={p.id}>{p.kode}</option>)}
                    </select>
                  </div>
                  <div>
                    <label>Sub-Aktivitas</label>
                    <input type="text" value={formData.sub_aktivitas} readOnly className="w-full border px-3 py-2 rounded bg-gray-100" />
                  </div>
                </div>
              </div>

              {/* === MANAJEMEN OPERASI === */}
              <div>
                <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Manajemen Operasi</h3>
                <div className="gap-4 mt-2">
                  <div>
                    <label>Manajemen Operasi</label>
                    <select
                      name="manajemen_operasi_id"
                      value={formData.manajemen_operasi_id || ""}
                      onChange={handleChange}
                      className="w-full border px-3 py-2 rounded"
                    >
                      <option value="">Pilih Manajemen Operasi</option>
                      {dropdowns.manajemen_operasi.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.manajemen_operasi}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* === BAHAYA KESEHATAN === */}
                <div className="mt-4 ">
                  <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Bahaya Kesehatan</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <label>Bahaya Kesehatan</label>
                      <textarea name="bahaya_kesehatan" value={formData.bahaya_kesehatan} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
                    </div>
                    <div>
                      <label className="font-medium">Upload Gambar untuk Bahaya Kesehatan</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "foto_bahaya_kesehatan")}
                        className="w-full border px-3 py-2 rounded"
                      />
                      {formData.foto_bahaya_kesehatan && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Foto sebelumnya:</p>
                          <img
                            src={formData.foto_bahaya_kesehatan}
                            alt="Preview Bahaya Kesehatan"
                            className="max-w-[200px] mt-2 border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* === RISIKO KESEHATAN === */}
                <div className="mt-4 ">
                  <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Risiko Kesehatan</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <label>Risiko Kesehatan</label>
                      <textarea name="risiko_kesehatan" value={formData.risiko_kesehatan} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
                    </div>
                    <div>
                      <label className="font-medium">Upload Gambar untuk Risiko Kesehatan</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "foto_risiko_kesehatan")}
                        className="w-full border px-3 py-2 rounded"
                      />
                      {formData.foto_risiko_kesehatan && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500">Foto sebelumnya:</p>
                          <img
                            src={formData.foto_risiko_kesehatan}
                            alt="Preview Risiko Kesehatan"
                            className="max-w-[200px] mt-2 border rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* === RISIKO TANPA & DENGAN PENGENDALIAN === */}
              {["tanpa_pengendalian", "dengan_pengendalian"].map((tipe) => (
                <div key={tipe}>
                  <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Nilai Risiko {tipe.replace("_", " ")}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label>Likelihood</label>
                      {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} className="flex gap-2 text-sm">
                          <input
                            type="radio"
                            name={`likelihood_${tipe}`}
                            value={val}
                            checked={formData[`likelihood_${tipe}`] == val}
                            onChange={handleChange}
                          />
                          {val === 1 ? "> 5 Tahun" :
                            val === 2 ? "2 – 5 Tahun" :
                              val === 3 ? "6 Bulan – 2 Tahun" :
                                val === 4 ? "Sekali / 6 Bulan" : "Berulang kali / 6 Bulan"}
                        </label>
                      ))}
                    </div>
                    <div>
                      <label>Severity</label>
                      {[1, 2, 3, 4, 5].map(val => (
                        <label key={val} className="flex gap-2 text-sm">
                          <input
                            type="radio"
                            name={`severity_${tipe}`}
                            value={val}
                            checked={formData[`severity_${tipe}`] == val}
                            onChange={handleChange}
                          />
                          {
                            val === 1 ? "Tidak Signifikan" :
                              val === 2 ? "Minor" :
                                val === 3 ? "Sedang" :
                                  val === 4 ? "Major" : "Bencana"
                          }
                        </label>
                      ))}
                    </div>
                    <div>
                      <label>Risk</label>
                      <input type="text" value={formData[`risk_${tipe}`]} readOnly className="w-full bg-gray-100 border px-3 py-2 rounded" />
                      <label className="mt-2 block">Kode Bahaya</label>
                      <input type="text" value={formData[`kode_tingkat_bahaya_${tipe}`]} readOnly className="w-full bg-gray-100 border px-3 py-2 rounded" />
                      <label className="mt-2 block">Tingkat Bahaya</label>
                      <input type="text" value={formData[`tingkat_bahaya_${tipe}`]} readOnly className="w-full bg-gray-100 border px-3 py-2 rounded" />
                    </div>
                  </div>
                </div>
              ))}

              {/* === PENGENDALIAN === */}
              <div>
                <h3 className="bg-gray-200 font-bold px-3 py-1 uppercase">Pengendalian</h3>
                <div className="gap-4 mt-2">
                  <div>
                    <label>Kode Hierarki</label>
                    <div className="grid grid-cols-4 gap-4">
                      {dropdowns.hierarki.map((h) => (
                        <label key={h.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            value={h.id}
                            checked={formData.hierarki_id.includes(h.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setFormData((prev) => {
                                const ids = checked
                                  ? [...prev.hierarki_id, h.id]
                                  : prev.hierarki_id.filter((id) => id !== h.id);
                                const names = dropdowns.hierarki
                                  .filter((x) => ids.includes(x.id))
                                  .map((x) => x.hierarki);
                                return { ...prev, hierarki_id: ids, hierarki: names };
                              });
                            }}
                          />
                          {h.kode} - {h.hierarki}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  {["preventive", "detective", "mitigative"].map((t) => (
                    <div key={t}>
                      <label>{t.charAt(0).toUpperCase() + t.slice(1)}</label>
                      <textarea name={`pengendalian_${t}`} value={formData[`pengendalian_${t}`] || ""} onChange={handleChange} className="w-full border px-3 py-2 rounded" />
                    </div>
                  ))}
                </div>
              </div>

              {/* === BUTTONS === */}
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Batal
                </button>
                <button type="submit" onClick={handleSubmit} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}