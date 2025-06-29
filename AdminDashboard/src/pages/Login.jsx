import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';

export default function Login({ login }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Cek input valid (tanpa spasi kosong)
    if (trimmedUsername === '' || trimmedPassword === '') {
      toast.error("Username dan password tidak boleh kosong!");
      return;
    }

    // Cek kredensial
    if (username === "admin123" && password === "P@ssw0rd123") {
      toast.success("Login berhasil! Mengarahkan ke dashboard...");
      setTimeout(() => {
        login(); // aktifin auth
        navigate("/dashboard"); // redirect setelah login
      }, 1500);
    } else {
      toast.error("Username atau password salah");
    }

  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-white to-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white/90 backdrop-blur p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <img
                        src="/Logo2.jpg"
                        alt="Logo Admin"
                        className="w-full h-auto object-contain rounded-lg"
                    />
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Login Admin</h1>

        <div className="space-y-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            placeholder="masukkan Username"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="masukkan Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition duration-200"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
