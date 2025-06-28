import { useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout({ children, logout }) {
  const { pathname } = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/" },
  ];

  return (
    <div className="flex h-screen">
      <Sidebar logout={logout} />
      <main className="flex-1">
        <Outlet /> {/* Ini buat render semua isi halaman */}
      </main>
    </div>
  );
}
