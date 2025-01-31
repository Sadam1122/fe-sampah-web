"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FaEnvelope, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("STAFF"); // Default role is STAFF
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();


  
  // Assuming you get the logged-in user's ID dynamically, here we'll use a placeholder
  const createdById = "currentUserId"; // Replace with logic to get the logged-in user's ID

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Prepare form data to send
    const formData = {
      email,
      username,
      password,
      role,
      createdById, // Add the logged-in user's ID here
    };

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, formData, {
        headers: { "Content-Type": "application/json" },
      });
      // Assuming successful registration, navigate to login page
      router.push("/login");
    } catch (err: any) {
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-300 via-teal-400 to-green-500">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
        <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-teal-600">
          Create Account
        </h1>
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-100"><FaEnvelope className="text-gray-500" /></div>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-100"><FaUser className="text-gray-500" /></div>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-2 focus:outline-none"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-100"><FaLock className="text-gray-500" /></div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full px-4 py-2 focus:outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="p-3 bg-gray-100 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="relative">
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <div className="p-3 bg-gray-100"><FaUser className="text-gray-500" /></div>
              <select
                id="role"
                className="w-full px-4 py-2 focus:outline-none"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 px-6 font-semibold rounded-lg shadow-md bg-gradient-to-br from-green-500 to-teal-500 text-white hover:scale-105"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
}
