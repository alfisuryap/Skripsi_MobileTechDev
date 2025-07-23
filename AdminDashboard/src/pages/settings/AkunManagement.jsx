import { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import { supabase } from "../../../database/supabaseClient";
import { toast } from "react-toastify";
import bcrypt from "bcryptjs";

export default function AkunManagement({ logout }) {
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [akunList, setAkunList] = useState([]);
    const [formData, setFormData] = useState({
        nama_lengkap: "",
        email: "",
        role: "Karyawan",
        password: "",
    });
    const [editId, setEditId] = useState(null);

    const fetchAkun = async () => {
        const { data, error } = await supabase.from("AkunManagement").select();
        if (error) {
            toast.error("Gagal memuat akun");
        } else {
            setAkunList(data);
        }
    };

    useEffect(() => {
        fetchAkun();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { nama_lengkap, email, password, role } = formData;

        if (!email || !role || (!editId && !password)) {
            toast.warning("Mohon lengkapi semua field");
            return;
        }

        if (editId) {
            const { error } = await supabase
                .from("AkunManagement")
                .update({ nama_lengkap, email, role })
                .eq("id", editId);

            if (error) {
                toast.error("Gagal mengupdate akun");
            } else {
                toast.success("Akun berhasil diupdate");
                resetForm();
                fetchAkun();
            }
        } else {
            // 1. Register ke Supabase Auth
            const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
                email,
                password,
                email_confirm: true, // langsung aktif
            });

            if (signUpError) {
                toast.error("Gagal membuat akun di Auth: " + signUpError.message);
                return;
            }

            const userId = signUpData.user.id;

            const { error } = await supabase
                .from("AkunManagement")
                .upsert(
                    {
                        nama_lengkap,
                        email,
                        role,
                        password,
                        user_id: userId,
                    },
                );


            if (error) {
                toast.error("Gagal menyimpan akun ke database: " + error.message);
                await supabase.auth.admin.deleteUser(userId);
            } else {
                toast.success("Akun berhasil ditambahkan");
                resetForm();
                fetchAkun();
            }
        }
    };

    const resetForm = () => {
        setFormData({ nama_lengkap: "", email: "", role: "Karyawan", password: "" });
        setEditId(null);
    };

    const handleEditClick = (akun) => {
        setEditId(akun.id);
        setFormData({
            nama_lengkap: akun.nama_lengkap,
            email: akun.email,
            role: akun.role,
            password: "",
        });
    };

    const handleResetPassword = async (id) => {
        const defaultPass = "123456";
        const hashed = await bcrypt.hash(defaultPass, 10);
        const { error } = await supabase
            .from("AkunManagement")
            .update({ password: hashed })
            .eq("id", id);
        if (error) {
            toast.error("Reset password gagal");
        } else {
            toast.success("Password berhasil direset ke '123456'");
        }
    };

    const handleDelete = async (user) => {
        if (!confirm(`Hapus akun ${user.nama_lengkap}?`)) return;

        try {
            // Hapus dari Supabase Auth
            const { error: authError } = await supabase.auth.admin.deleteUser(user.user_id);
            if (authError) throw authError;

            // Hapus dari tabel AkunManagement (optional karena FK bisa auto delete)
            const { error: dbError } = await supabase
                .from("AkunManagement")
                .delete()
                .eq("user_id", user.user_id);

            if (dbError) throw dbError;

            toast.success("Akun berhasil dihapus");
            fetchAkun(); // refresh data
        } catch (err) {
            toast.error("Gagal menghapus akun: " + err.message);
        }
    };

    return (
        <>
            <div className="flex w-full min-h-screen">
                <Sidebar onLogoutClick={() => setShowLogoutModal(true)} />

                <div className="flex-1 p-6 max-w-6xl mx-auto">
                    <h1 className="text-2xl font-bold mb-6">Akun Management</h1>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <label className="block font-medium mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                name="nama_lengkap"
                                placeholder="Nama Lengkap"
                                value={formData.nama_lengkap}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full border border-gray-300 rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block font-medium mb-1">Role</label>
                            <input
                                type="text"
                                name="role"
                                value={formData.role}
                                readOnly
                                disabled
                                className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-gray-500"
                            />
                        </div>
                        {!editId && (
                            <div>
                                <label className="block font-medium mb-1">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    required
                                />
                            </div>
                        )}
                        <div className="col-span-1 md:col-span-2 flex gap-3 mt-2">
                            <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded text-sm">
                                {editId ? "Update Akun" : "Tambah Akun"}
                            </button>
                            <button type="button" onClick={resetForm} className="text-gray-500 px-4 py-2 text-sm">
                                Batal
                            </button>
                        </div>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border border-gray-200 rounded-lg">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-3 text-left">Nama Lengkap</th>
                                    <th className="p-3 text-left">Email</th>
                                    <th className="p-3 text-left">Role</th>
                                    <th className="p-3 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {akunList.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center p-4 text-gray-500">
                                            Belum ada akun.
                                        </td>
                                    </tr>
                                ) : (
                                    akunList.map((akun) => (
                                        <tr key={akun.id} className="border-t hover:bg-gray-50">
                                            <td className="p-3">{akun.nama_lengkap}</td>
                                            <td className="p-3">{akun.email}</td>
                                            <td className="p-3">{akun.role}</td>
                                            <td className="p-3 text-center space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(akun)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleResetPassword(akun.id)}
                                                    className="text-yellow-600 hover:underline"
                                                >
                                                    Reset Password
                                                </button>
                                                <button
                                                    variant="destructive"
                                                    onClick={() => handleDelete(user)}
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
