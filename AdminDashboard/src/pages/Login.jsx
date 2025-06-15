import { useState } from "react";

export default function Login({ login }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      login();
    }
  };

return (
  <div className="flex items-center justify-center h-screen bg-gray-100">
    <form
      onSubmit={handleSubmit}
      className="flex items-center justify-center h-screen bg-red-500"
    >
      <h1 className="text-2xl mb-4 text-center">Login Admin</h1>
      <input
        type="text"
        placeholder="Username"
        className="border p-2 w-full mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        type="submit"
      >
        Login
      </button>
    </form>
  </div>
);

}
