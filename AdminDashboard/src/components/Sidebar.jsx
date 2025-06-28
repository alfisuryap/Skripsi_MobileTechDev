// components/Sidebar.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Home,
    LogOut,
    Layers,
    FileText,
    ChevronDown,
    ChevronRight,
    Settings,
    Activity,
    Shield,
    AlertTriangle,
    TrendingUp,
    AlignLeft,
} from "lucide-react";

export default function Sidebar({ onLogoutClick }) {
    const [openMasterData, setOpenMasterData] = useState(false);
    const location = useLocation();

    const isActive = (path) => location.pathname === path;
    const isMasterPath = (subpaths) => subpaths.some((p) => location.pathname.includes(p));

    return (
        <div className="w-64 min-h-screen bg-white shadow-md flex flex-col">
            <div className="p-6 border-b border-gray-200 text-xl font-bold text-indigo-600">
                <span className="flex items-center gap-2">
                    <Settings className="w-6 h-6" /> Admin Website
                </span>
            </div>

            <nav className="flex-1 p-4 space-y-1 text-sm">
                <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 px-4 py-2 rounded hover:bg-indigo-50 ${isActive("/dashboard") ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-gray-700"
                        }`}
                >
                    <Home className="w-4 h-4" /> Dashboard
                </Link>

                <Link
                    to="/input-hra"
                    className={`flex items-center gap-3 px-4 py-2 rounded hover:bg-indigo-50 ${isActive("/input-hra") ? "bg-indigo-100 text-indigo-700 font-semibold" : "text-gray-700"
                        }`}
                >
                    <FileText className="w-4 h-4" /> Input HRA
                </Link>

                {/* Master Data Dropdown */}
                <button
                    onClick={() => setOpenMasterData(!openMasterData)}
                    className={`w-full flex items-center justify-between px-4 py-2 rounded hover:bg-indigo-50 ${isMasterPath([
                        "/master-data/proses",
                        "/master-data/sub-proses",
                        "/master-data/aktivitas",
                        "/master-data/sub-aktivitas",
                        "/master-data/manajemen-operasi",
                        "/master-data/bahaya-kesehatan",
                        "/master-data/risiko-kesehatan",
                        "/master-data/tingkat-bahaya",
                        "/master-data/hierarki"
                    ])
                        ? "bg-indigo-100 text-indigo-700 font-semibold"
                        : "text-gray-700"
                        }`}
                >
                    <span className="flex items-center gap-3">
                        <Layers className="w-4 h-4" /> Master Data
                    </span>
                    {openMasterData ? <ChevronDown /> : <ChevronRight />}
                </button>

                {openMasterData && (
                    <div className="pl-10 space-y-1">
                        <Link to="/master-data/proses" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/proses") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <Settings className="w-4 h-4" /> Proses
                        </Link>
                        <Link to="/master-data/sub-proses" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/sub-proses") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <AlignLeft className="w-4 h-4" /> Sub-Proses
                        </Link>
                        <Link to="/master-data/aktivitas" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/aktivitas") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <Activity className="w-4 h-4" /> Aktivitas
                        </Link>
                        <Link to="/master-data/sub-aktivitas" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/sub-aktivitas") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <Activity className="w-4 h-4" /> Sub-Aktivitas
                        </Link>
                        <Link to="/master-data/manajemen-operasi" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/manajemen-operasi") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <Settings className="w-4 h-4" /> Manajemen Operasi
                        </Link>
                        <Link to="/master-data/bahaya-kesehatan" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/bahaya-kesehatan") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <AlertTriangle className="w-4 h-4" /> Bahaya Kesehatan
                        </Link>
                        <Link to="/master-data/risiko-kesehatan" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/risiko-kesehatan") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <Shield className="w-4 h-4" /> Risiko Kesehatan
                        </Link>
                        <Link to="/master-data/tingkat-bahaya" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/tingkat-bahaya") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <TrendingUp className="w-4 h-4" /> Tingkat Bahaya
                        </Link>
                        <Link to="/master-data/hierarki" className={`flex items-center gap-2 px-2 py-1 rounded ${isActive("/master-data/hierarki") ? "bg-indigo-100 text-indigo-700 font-medium" : "hover:text-indigo-600"
                            }`}>
                            <Layers className="w-4 h-4" /> Hierarki
                        </Link>
                    </div>
                )}

                {/* Logout */}
                <button
                    onClick={() => {
                        console.log("Clicked Logout");
                        onLogoutClick();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 rounded hover:bg-red-100 text-red-600 mt-6"
                >
                    <LogOut className="w-4 h-4" /> Logout
                </button>
            </nav>
        </div>
    );
}