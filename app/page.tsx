"use client"

import { useState } from "react"
import { useAuth } from "./hook/useAuth"
import { useRouter } from "next/navigation"
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { login, loading } = useAuth()
  const router = useRouter()



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await login(email, password)
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during login.")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-300 via-teal-400 to-green-500">
      <div className="relative bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-teal-400 to-green-300 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-gradient-to-br from-lime-400 to-green-500 rounded-full blur-3xl opacity-50"></div>

        <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-br from-green-600 to-teal-600">
          Welcome to WasteMate
        </h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="relative">
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
              <div className="p-3 bg-gray-100">
                <FaEnvelope className="text-gray-500" />
              </div>
              <input
                type="email"
                id="email"
                className="w-full px-4 py-2 text-gray-700 focus:outline-none"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="relative">
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-green-500">
              <div className="p-3 bg-gray-100">
                <FaLock className="text-gray-500" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full px-4 py-2 text-gray-700 focus:outline-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="p-3 bg-gray-100 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-red-600 text-sm text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className={`w-full py-3 px-6 font-semibold rounded-lg shadow-md transition-all duration-200 text-white text-lg ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-br from-green-500 to-teal-500 hover:scale-105 hover:shadow-lg"}`}
            disabled={loading}
          >
            <span className="flex items-center justify-center">{loading ? "Logging in..." : "Login"}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

