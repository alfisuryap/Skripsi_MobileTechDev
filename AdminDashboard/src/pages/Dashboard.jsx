export default function Dashboard({ logout }) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-1 rounded">
          Logout
        </button>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 bg-green-100 rounded shadow">Total Users: 100</div>
        <div className="p-4 bg-yellow-100 rounded shadow">Reports: 5</div>
      </div>
    </div>
  );
}
