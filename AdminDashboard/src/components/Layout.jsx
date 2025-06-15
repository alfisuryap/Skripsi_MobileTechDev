import { Link, useLocation } from "react-router-dom";

export default function Layout({ children, logout }) {
  const { pathname } = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/" },
  ];

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-gray-800 text-white p-5">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        <nav className="flex flex-col space-y-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded ${
                pathname === item.path ? "bg-gray-700" : "hover:bg-gray-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="mt-6 px-3 py-2 rounded bg-red-500 hover:bg-red-600"
          >
            Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 bg-gray-100 p-6 overflow-auto">{children}</main>
    </div>
  );
}
