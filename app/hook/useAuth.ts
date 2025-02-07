"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Cookies from "js-cookie"

interface User {
  id: string
  email: string
  name: string
  desaId: string
  role: "SUPERADMIN" | "ADMIN" | "WARGA"
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Ambil data user dari cookies atau localStorage
    const storedUser = Cookies.get("user") || localStorage.getItem("user")
    
    if (storedUser) {
      // Jika data user ditemukan, simpan di state
      setUser(JSON.parse(storedUser))
    }

    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/auth/login`, { email, password })

      // Simpan data user di cookies & localStorage
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        desaId: data.user.desaId
      }

      Cookies.set("user", JSON.stringify(userData), { expires: 7 }) // Simpan di cookies
      localStorage.setItem("user", JSON.stringify(userData)) // Simpan di localStorage

      setUser(userData)

      router.push("/dashboard")
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const logout = () => {
    // Hapus data user dari cookies dan localStorage
    Cookies.remove("user")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/")
  }

  return { user, loading, login, logout }
}
