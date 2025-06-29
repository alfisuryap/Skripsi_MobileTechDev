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
    const isMasterPath = (subpaths) =>
        subpaths.some((p) => location.pathname.includes(p));

    const getMenuItemClass = (path) =>
        `flex items-center gap-3 px-4 py-2 rounded hover:bg-indigo-50 ${isActive(path)
            ? "bg-indigo-100 text-indigo-700 font-semibold"
            : "text-gray-700"
        }`;

    const getSubMenuClass = (path) =>
        `flex items-center gap-2 px-2 py-1 rounded ${isActive(path)
            ? "bg-indigo-100 text-indigo-700 font-semibold"
            : "text-gray-700 hover:bg-indigo-50"
        }`;

    return (
        <div className="w-64 min-h-screen bg-white shadow-md flex flex-col justify-between">
            {/* Header logo */}
            <div className="p-6 border-b border-gray-200 text-xl font-bold text-indigo-600">
                <span className="flex items-center gap-2">
                    <img
                        src="/Logo2.jpg"
                        alt="Logo Admin"
                        className="w-full h-auto object-contain rounded-lg"
                    />
                </span>
            </div>

            {/* Navigasi */}
            <div className="flex-1 flex flex-col justify-between">
                <nav className="flex-1 p-4 space-y-1 text-sm">
                    <Link to="/dashboard" className={getMenuItemClass("/dashboard")}>
                        <Home className="w-4 h-4" /> Dashboard
                    </Link>

                    <Link to="/input-hra" className={getMenuItemClass("/input-hra")}>
                        <FileText className="w-4 h-4" /> Input HRA
                    </Link>

                    {/* Master Data Dropdown */}
                    <button
                        onClick={() => setOpenMasterData(!openMasterData)}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded transition-colors ${isMasterPath([
                            "/master-data/proses",
                            "/master-data/sub-proses",
                            "/master-data/aktivitas",
                            "/master-data/sub-aktivitas",
                            "/master-data/manajemen-operasi",
                            "/master-data/bahaya-kesehatan",
                            "/master-data/risiko-kesehatan",
                            "/master-data/tingkat-bahaya",
                            "/master-data/hierarki",
                        ])
                            ? "bg-indigo-100 text-indigo-700 font-semibold"
                            : "bg-transparent text-gray-700 hover:bg-indigo-50"
                            }`}
                    >
                        <span className="flex items-center gap-3">
                            <Layers className="w-4 h-4" /> Master Data
                        </span>
                        {openMasterData ? <ChevronDown /> : <ChevronRight />}
                    </button>

                    {openMasterData && (
                        <div className="pl-10 space-y-1">
                            <Link to="/master-data/proses" className={getSubMenuClass("/master-data/proses")}>
                                <Settings className="w-4 h-4" /> Proses
                            </Link>
                            <Link to="/master-data/sub-proses" className={getSubMenuClass("/master-data/sub-proses")}>
                                <AlignLeft className="w-4 h-4" /> Sub-Proses
                            </Link>
                            <Link to="/master-data/aktivitas" className={getSubMenuClass("/master-data/aktivitas")}>
                                <Activity className="w-4 h-4" /> Aktivitas
                            </Link>
                            <Link to="/master-data/sub-aktivitas" className={getSubMenuClass("/master-data/sub-aktivitas")}>
                                <Activity className="w-4 h-4" /> Sub-Aktivitas
                            </Link>
                            <Link to="/master-data/manajemen-operasi" className={getSubMenuClass("/master-data/manajemen-operasi")}>
                                <Settings className="w-4 h-4" /> Manajemen Operasi
                            </Link>
                            <Link to="/master-data/bahaya-kesehatan" className={getSubMenuClass("/master-data/bahaya-kesehatan")}>
                                <AlertTriangle className="w-4 h-4" /> Bahaya Kesehatan
                            </Link>
                            <Link to="/master-data/risiko-kesehatan" className={getSubMenuClass("/master-data/risiko-kesehatan")}>
                                <Shield className="w-4 h-4" /> Risiko Kesehatan
                            </Link>
                            <Link to="/master-data/tingkat-bahaya" className={getSubMenuClass("/master-data/tingkat-bahaya")}>
                                <TrendingUp className="w-4 h-4" /> Tingkat Bahaya
                            </Link>
                            <Link to="/master-data/hierarki" className={getSubMenuClass("/master-data/hierarki")}>
                                <Layers className="w-4 h-4" /> Hierarki
                            </Link>
                        </div>
                    )}
                </nav>
                {/* Logout Button */}
                <div className="w-full border-t border-gray-200 p-4">
                    <button
                        onClick={() => {
                            console.log("Clicked Logout");
                            onLogoutClick();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 rounded text-red-600 transition-colors bg-transparent hover:bg-red-100"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </div>
        </div >
    );
}