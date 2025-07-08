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
  const [dropdowns, setDropdowns] = useState({
    proses: [],
    sub_proses: [],
    aktivitas: [],
    sub_aktivitas: [],
    manajemen_operasi: []
  });

  const fields = [
    "kode_proses", "proses",
    "kode_sub_proses", "sub_proses",
    "kode_aktivitas", "aktivitas",
    "kode_sub_aktivitas", "sub_aktivitas",
    "manajemen_operasi", 
    "bahaya_kesehatan",
    "risiko_kesehatan", 
    "likelihood_tanpa_pengendalian", "severity_tanpa_pengendalian", "nilai_likelihood_tanpa_pengendalian", "nilai_severity_tanpa_pengendalian", "risk_tanpa_pengendalian", "kode_tingkat_bahaya_tanpa_pengendalian", "tingkat_bahaya_tanpa_pengendalian",
    "likelihood_dengan_pengendalian", "severity_dengan_pengendalian", "nilai_likelihood_dengan_pengendalian", "nilai_severity_dengan_pengendalian", "risk_dengan_pengendalian", "kode_tingkat_bahaya_dengan_pengendalian", "tingkat_bahaya_dengan_pengendalian",
    "kode_hierarki", "hierarki",
    "pengendalian_preventive", "pengendalian_detective", "pengendalian_mitigative"
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
      sub_aktivitas: (await getOptions("SubAktivitas")).map((s) => ({
        kode: s.kode_sub_aktivitas || s.kode,
        sub_aktivitas: s.sub_aktivitas
      })),
      manajemen_operasi: await getOptions("ManajemenOperasi"),
      hierarki: await getOptions("Hierarki")
    });
  };

  useEffect(() => {
    fetchData();
    fetchDropdowns();
  }, []);

  const getRiskLevel = (likelihood, severity) => {
    const matrix = [
      ["C", "C", "C", "C", "B"],
      ["C", "C", "C", "B", "B"],
      ["C", "B", "A", "A", "AA"],
      ["B", "A", "A", "AA", "AA"],
      ["B", "A", "A", "AA", "AA"]
    ];
    if (!likelihood || !severity) return "";
    const kode = matrix[likelihood - 1][severity - 1];
    const tingkatMap = { C: "Low", B: "Medium", A: "High", AA: "Extreme" };
    return { kode, tingkat: tingkatMap[kode] };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...formData, [name]: value };

    if (name === "kode_proses") {
      const selected = dropdowns.proses.find((p) => p.kode === value);
      updated.proses = selected?.proses || "";
    } else if (name === "proses") {
      const selected = dropdowns.proses.find((p) => p.proses === value);
      updated.kode_proses = selected?.kode || "";
    } else if (name === "kode_sub_proses") {
      const selected = dropdowns.sub_proses.find((s) => s.kode === value);
      updated.sub_proses = selected?.sub_proses || "";
    } else if (name === "sub_proses") {
      const selected = dropdowns.sub_proses.find((s) => s.sub_proses === value);
      updated.kode_sub_proses = selected?.kode || "";
    } else if (name === "kode_aktivitas") {
      const selected = dropdowns.aktivitas.find((a) => a.kode === value);
      updated.aktivitas = selected?.aktivitas || "";
    } else if (name === "aktivitas") {
      const selected = dropdowns.aktivitas.find((a) => a.aktivitas === value);
      updated.kode_aktivitas = selected?.kode || "";
    } else if (name === "kode_sub_aktivitas") {
      const selected = dropdowns.sub_aktivitas.find((s) => s.kode === value);
      updated.sub_aktivitas = selected?.sub_aktivitas || "";
    } else if (name === "sub_aktivitas") {
      const selected = dropdowns.sub_aktivitas.find((s) => s.sub_aktivitas === value);
      updated.kode_sub_aktivitas = selected?.kode || "";
    } else if (name === "kode_hierarki") {
      const selected = dropdowns.hierarki.find((s) => s.kode === value);
      updated.hierarki = selected?.hierarki || "";
    } else if (name === "hierarki") {
      const selected = dropdowns.hierarki.find((s) => s.hierarki === value);
      updated.kode_hierarki = selected?.kode || "";
    }

    // Risk tanpa pengendalian
    if (name.includes("tanpa_pengendalian")) {
      const likelihood = parseInt(name === "likelihood_tanpa_pengendalian" ? value : updated.likelihood_tanpa_pengendalian);
      const severity = parseInt(name === "severity_tanpa_pengendalian" ? value : updated.severity_tanpa_pengendalian);
      const result = getRiskLevel(likelihood, severity);
      updated.risk_tanpa_pengendalian = likelihood && severity ? likelihood * severity : "";
      updated.kode_tingkat_bahaya_tanpa_pengendalian = result.kode;
      updated.tingkat_bahaya_tanpa_pengendalian = result.tingkat;
      updated.nilai_likelihood_tanpa_pengendalian = likelihood;
      updated.nilai_severity_tanpa_pengendalian = severity;
    }

    // Risk dengan pengendalian
    if (name.includes("dengan_pengendalian")) {
      const likelihood = parseInt(name === "likelihood_dengan_pengendalian" ? value : updated.likelihood_dengan_pengendalian);
      const severity = parseInt(name === "severity_dengan_pengendalian" ? value : updated.severity_dengan_pengendalian);
      const result = getRiskLevel(likelihood, severity);
      updated.risk_dengan_pengendalian = likelihood && severity ? likelihood * severity : "";
      updated.kode_tingkat_bahaya_dengan_pengendalian = result.kode;
      updated.tingkat_bahaya_dengan_pengendalian = result.tingkat;
      updated.nilai_likelihood_dengan_pengendalian = likelihood;
      updated.nilai_severity_dengan_pengendalian = severity;
    }

    setFormData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...formData };

    payload.kode_sub_aktivitas = payload.kode_sub_aktivitas || null;
    payload.sub_aktivitas = payload.sub_aktivitas || null;

    const requiredFields = [
      "kode_proses", "proses",
      "kode_sub_proses", "sub_proses",
      "kode_aktivitas", "aktivitas",
      "likelihood", "severity",
      "kode_hierarki", "hierarki"
    ];

    for (let field of requiredFields) {
      if (!payload[field]) {
        toast.error("Mohon lengkapi semua kolom wajib.");
        return;
      }
    }

    if (editId) {
      const { error } = await supabase.from("InputHRA").update(payload).eq("id", editId);
      if (error) toast.error("Gagal update data");
      else toast.success("Data diperbarui");
    } else {
      const { error } = await supabase.from("InputHRA").insert([payload]);
      if (error) toast.error("Gagal menambah data");
      else toast.success("Data ditambahkan");
    }

    setShowFormModal(false);
    fetchData();
  };

  const getDropdownOptions = (field) => {
    if (field === "kode_proses") return dropdowns.proses.map((p) => ({ value: p.kode, label: p.kode }));
    if (field === "proses") return dropdowns.proses.map((p) => ({ value: p.proses, label: p.proses }));
    if (field === "kode_sub_proses") return dropdowns.sub_proses.map((s) => ({ value: s.kode, label: s.kode }));
    if (field === "sub_proses") return dropdowns.sub_proses.map((s) => ({ value: s.sub_proses, label: s.sub_proses }));
    if (field === "kode_aktivitas") return dropdowns.aktivitas.map((a) => ({ value: a.kode, label: a.kode }));
    if (field === "aktivitas") return dropdowns.aktivitas.map((a) => ({ value: a.aktivitas, label: a.aktivitas }));
    if (field === "kode_sub_aktivitas") return dropdowns.sub_aktivitas.map((s) => ({ value: s.kode, label: s.kode }));
    if (field === "sub_aktivitas") return dropdowns.sub_aktivitas.map((s) => ({ value: s.sub_aktivitas, label: s.sub_aktivitas }));
    if (field === "manajemen_operasi") return dropdowns.manajemen_operasi.map((m) => ({ value: m.manajemen_operasi, label: m.manajemen_operasi }));
    if (field === "kode_hierarki") return dropdowns.hierarki.map((s) => ({ value: s.kode, label: s.kode }));
    if (field === "hierarki") return dropdowns.hierarki.map((s) => ({ value: s.hierarki, label: s.hierarki }));
    return [];
  };

  const toTitleCase = (str) =>
    str.replace(/_/g, " ")
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

  return (
    <>
      <div className="w-full flex">
        <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-indigo-700 mb-4">Input HRA</h1>
          <button onClick={() => setShowFormModal(true)} className="mb-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
            + Tambah Data
          </button>

          <div className="bg-white rounded shadow max-w-full overflow-x-auto">
            <div className="min-w-[800px]">
              <table className="w-full text-sm table-auto border">
                <thead className="bg-gray-100 text-center sticky top-0 z-10">
                  <tr>
                    {fields.map((f) => (
                      <th key={f} className="px-2 py-1 border bg-gray-100">{f.replaceAll("_", " ").toUpperCase()}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={fields.length} className="text-center py-4 text-gray-500">Tidak ada data.</td>
                    </tr>
                  ) : (
                    data.map((item) => (
                      <tr key={item.id} className="text-center border-t">
                        {fields.map((f) => (
                          <td key={f} className="border px-1 py-1">{item[f]}</td>
                        ))}
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
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <div key={f}>
                <label className="block text-sm font-medium mb-1">{toTitleCase(f)}</label>
                {["risk_tanpa_pengendalian", "kode_tingkat_bahaya_tanpa_pengendalian", "tingkat_bahaya_tanpa_pengendalian",
                  "risk_dengan_pengendalian", "kode_tingkat_bahaya_dengan_pengendalian", "tingkat_bahaya_dengan_pengendalian", 
                  "nilai_likelihood_tanpa_pengendalian", "nilai_severity_tanpa_pengendalian",
                  "nilai_likelihood_dengan_pengendalian", "nilai_severity_dengan_pengendalian"].includes(f) ? (
                  <input
                    type="text"
                    name={f}
                    value={formData[f] || ""}
                    readOnly
                    className="w-full border border-gray-300 bg-gray-100 rounded px-3 py-2"
                  />
                ) : ["likelihood_tanpa_pengendalian", "likelihood_dengan_pengendalian"].includes(f) ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const labelMap = {
                        1: "> 5 Tahun",
                        2: "2 – 5 Tahun",
                        3: "6 Bulan – 2 Tahun",
                        4: "Sekali / 6 Bulan",
                        5: "Berulang kali / 6 Bulan"
                      };
                      return (
                        <label key={val} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={f}
                            value={val}
                            checked={formData[f] == val}
                            onChange={handleChange}
                          />
                          <span>{labelMap[val]}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : ["severity_tanpa_pengendalian", "severity_dengan_pengendalian"].includes(f) ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((val) => {
                      const labelMap = {
                        1: "Tidak Signifikan – Tidak menimbulkan cedera / <1% EBITDA",
                        2: "Minor – First aid / 1-3% EBITDA",
                        3: "Sedang – Cidera ringan / 3-5% EBITDA",
                        4: "Major – Loss time accident / 5-10% EBITDA",
                        5: "Bencana – Kematian, kerusakan lingkungan besar / >10% EBITDA"
                      };
                      return (
                        <label key={val} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={f}
                            value={val}
                            checked={formData[f] == val}
                            onChange={handleChange}
                          />
                          <span>{labelMap[val]}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : ["bahaya_kesehatan", "risiko_kesehatan", "pengendalian_preventive", "pengendalian_detective", "pengendalian_mitigative"].includes(f) ? (
                  <input
                    type="text"
                    name={f}
                    value={formData[f] || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder={`Masukkan ${toTitleCase(f)}`}
                  />
                ) : (
                  <select
                    name={f}
                    value={formData[f] || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required={["kode_proses", "proses", "kode_sub_proses", "sub_proses", "kode_aktivitas", "aktivitas", "kode_hierarki", "hierarki"].includes(f)}
                  >
                    <option value="">Pilih {toTitleCase(f)}</option>
                    {getDropdownOptions(f).map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
            <div className="col-span-2 flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Batal</button>
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Simpan</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}