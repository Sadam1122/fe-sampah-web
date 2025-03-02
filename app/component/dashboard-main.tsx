"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FaTrash, FaRecycle, FaMapMarkerAlt, FaCalendarAlt, FaSearch } from "react-icons/fa"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LineChart, BarChart, PieChart } from "@/components/ui/charts"
import { IncidentForm } from "./IncidentForm"
import { SimplifiedMap } from "./SimplifiedMap"
import WawasanAI from "./WawasanAI"
import EditModal from "./EditModal"
import { useAuth } from "../hook/useAuth"
import { NewsSection } from "./NewsSection"
import axios from "axios"
import type React from "react"
import LeaderboardCard from "./LeaderboardCard"
import AchievementsCard from "./AchievementsCard"
import UserStatisticsCard from "./UserStatisticsCard"

// Tambahkan import untuk Search icon
import { Search } from "lucide-react"

function LoadingAnimation() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white p-8 rounded-lg shadow-lg flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
        >
          <FaRecycle className="w-16 h-16 text-green-500" />
        </motion.div>
        <motion.h2
          className="mt-4 text-2xl font-bold text-green-700"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          Memuat Dashboard...
        </motion.h2>
      </motion.div>
    </div>
  )
}

// Type definitions
interface GarbageRecord {
  id: string
  desaId: string
  userId: string
  berat: number
  jenisSampah: string
  poin: number
  waktu: string
  rt: string
  rw: string
}

interface LeaderboardEntry {
  id: string
  userId: string
  totalPoin: number
  jumlahPengumpulan: number
  available: boolean
  poinSaatIni: number
  user: {
    username: string
    role: string
  }
}

interface Incident {
  id: string
  type: string
  location: string
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED"
  time: string
  description: string
  reporterId: string
  handled_By: string | null
  time_handled: string | null
}

interface JadwalPengumpulan {
  id: string
  desaId: string
  hari: string
  waktuMulai: string
  waktuSelesai: string
}

interface Desa {
  id: string
  nama: string
  kecamatan: string
  kabupaten: string
  provinsi: string
}

interface User {
  id: string
  username: string
  name: string
  role: string
  desaId: string
}

const wasteTypes = ["Plastik", "Kertas", "Kaca", "Organik", "B3"]
const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function DashboardMain() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, loading, logout } = useAuth()
  const [garbageData, setGarbageData] = useState<GarbageRecord[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [totalWeight, setTotalWeight] = useState(0)
  const [uniqueLocations, setUniqueLocations] = useState(0)
  const [recyclingRate, setRecyclingRate] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<GarbageRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [newRecord, setNewRecord] = useState({
    berat: "",
    userId: "",
    rt: "",
    rw: "",
    jenisSampah: "",
  })
  const [desaInfo, setDesaInfo] = useState<Desa | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const recordsPerPage = 15
  const [userSearchTerm, setUserSearchTerm] = useState("")
  // Tambahkan state untuk loading pencarian
  const [isSearchingUser, setIsSearchingUser] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      fetchDesaInfo(user.desaId)
      fetchData()
    }
  }, [user, loading, router])

  // Ubah URL fetch users
  // Tambahkan debugging untuk fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return

      setIsLoadingUsers(true)
      try {
        console.log("Fetching users...") // Debug log
        const response = await axios.get(`${API_URL}/api/users/${user.desaId}`, {
          headers: {
            "x-user-role": user.role,
          },
        })

        if (response.status === 200) {
          console.log("Users fetched successfully:", response.data) // Debug log
          const filteredUsers = response.data.filter((u: User) => u.role === "WARGA")
          setUsers(filteredUsers)
        } else {
          throw new Error("Failed to fetch users")
        }
      } catch (error) {
        console.error("Error fetching users:", error)
        toast({
          title: "Error",
          description: "Gagal mengambil daftar pengguna. Silakan coba lagi.",
          variant: "destructive",
        })
        setUsers([])
      } finally {
        setIsLoadingUsers(false)
      }
    }

    if (user) {
      fetchUsers()
    }
  }, [user, toast])

  const fetchDesaInfo = async (desaId: string) => {
    if (!user || user.role === "SUPERADMIN") return

    try {
      const response = await axios.get(`${API_URL}/api/desa?id=${desaId}`)
      setDesaInfo(response.data)
    } catch (error) {
      console.error("Error fetching desa info:", error)
      toast({
        title: "Error",
        description: "Gagal mengambil informasi desa.",
        variant: "destructive",
      })
    }
  }

  const fetchData = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    try {
      const requests = [
        axios.get(`${API_URL}/api/pengumpulan-sampah?desaId=${user.desaId}`, {
          headers: { "x-user-role": user.role },
        }),
        axios.get(`${API_URL}/api/leaderboard?desaId=${user.desaId}`, {
          headers: { "x-user-role": user.role },
        }),
      ]

      // Perbaikan perbandingan role
      if (user.role !== "WARGA") {
        requests.push(
          axios.get(`${API_URL}/api/insiden?desaId=${user.desaId}`, {
            headers: { "x-user-role": user.role },
          }),
        )
      }

      const responses = await Promise.all(requests)

      const [garbageResponse, leaderboardResponse, incidentResponse] = responses

      setGarbageData(garbageResponse.data || [])
      const total = garbageResponse.data.reduce(
        (sum: number, record: GarbageRecord) => sum + (Number(record.berat) || 0),
        0,
      )
      setTotalWeight(total)

      const locations = new Set(garbageResponse.data.map((record: GarbageRecord) => `${record.rt}-${record.rw}`))
      setUniqueLocations(locations.size)

      const recyclableWaste = garbageResponse.data.filter((record: GarbageRecord) =>
        ["Plastik", "Kertas", "Kaca"].includes(record.jenisSampah),
      )
      const recyclableWeight = recyclableWaste.reduce(
        (sum: number, record: GarbageRecord) => sum + (Number(record.berat) || 0),
        0,
      )

      const recyclingRate = total > 0 ? (recyclableWeight / total) * 100 : 0
      setRecyclingRate(recyclingRate)

      setLeaderboard(leaderboardResponse.data || [])

      if (user.role !== "WARGA" && incidentResponse) {
        setIncidents(incidentResponse.data || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Gagal mengambil data. Silakan coba lagi nanti.")
      toast({
        title: "Error",
        description: "Gagal mengambil data. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewRecord((prev) => ({ ...prev, [name]: value }))
  }

  const calculatePoints = (weight: number, wasteType: string): number => {
    const basePoints = weight * 10
    const multiplier = wasteType === "Organik" ? 1 : 1.5
    return Math.round(basePoints * multiplier)
  }

  // Modifikasi fungsi handleSubmit untuk mengirim userId
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      toast({
        title: "Error",
        description: "Anda tidak memiliki izin untuk menambahkan data.",
        variant: "destructive",
      })
      return
    }

    // Validate required fields
    if (!newRecord.userId || !newRecord.berat || !newRecord.rt || !newRecord.rw || !newRecord.jenisSampah) {
      toast({
        title: "Error",
        description: "Semua field harus diisi.",
        variant: "destructive",
      })
      return
    }

    try {
      const weight = Number.parseFloat(newRecord.berat)
      if (isNaN(weight) || weight <= 0) {
        toast({
          title: "Error",
          description: "Berat harus berupa angka positif.",
          variant: "destructive",
        })
        return
      }

      const points = calculatePoints(weight, newRecord.jenisSampah)

      // Find the selected user to get their username
      const selectedUser = users.find((u) => u.id === newRecord.userId)
      if (!selectedUser) {
        toast({
          title: "Error",
          description: "User tidak ditemukan.",
          variant: "destructive",
        })
        return
      }

      // Format the request body according to the new structure
      const requestBody = {
        username: selectedUser.username,
        berat: weight,
        rt: newRecord.rt,
        rw: newRecord.rw,
        jenisSampah: newRecord.jenisSampah,
        poin: points,
      }

      // Post to pengumpulan-sampah with the new format
      const garbageResponse = await axios.post(`${API_URL}/api/pengumpulan-sampah`, requestBody, {
        headers: { "x-user-role": user.role },
      })

      if (garbageResponse.status === 201) {
        // Update leaderboard data
        const leaderboardResponse = await axios.post(
          `${API_URL}/api/leaderboard`,
          {
            desaId: user.desaId,
            userId: selectedUser.id,
            totalPoin: points,
            poinSaatIni: points,
            jumlahPengumpulan: 1,
          },
          {
            headers: { "x-user-role": user.role },
          },
        )

        if (leaderboardResponse.status === 201) {
          toast({
            title: "Sukses",
            description: "Data berhasil ditambahkan dan leaderboard diperbarui.",
          })
          setNewRecord({ berat: "", userId: "", rt: "", rw: "", jenisSampah: "" })
          // Fetch updated data to refresh the table and leaderboard
          fetchData()
        } else {
          throw new Error("Failed to update leaderboard")
        }
      } else {
        throw new Error("Failed to add garbage collection data")
      }
    } catch (error) {
      console.error("Error submitting new record:", error)
      toast({
        title: "Error",
        description: "Gagal menambahkan data. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const deleteData = async (id: string) => {
    if (!user) return

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      toast({
        title: "Error",
        description: "Anda tidak memiliki izin untuk menghapus data.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/api/pengumpulan-sampah/${id}`, {
        headers: { "x-user-role": user.role },
      })

      if (response.status === 200) {
        toast({
          title: "Sukses",
          description: "Data berhasil dihapus.",
        })

        // Hapus data dari state
        setGarbageData((prevRecords) => prevRecords.filter((record) => record.id !== id))
      } else {
        throw new Error("Gagal menghapus data")
      }
    } catch (error) {
      console.error("Error deleting data:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus data.",
        variant: "destructive",
      })
    }
  }

  const handleRowDoubleClick = (record: GarbageRecord) => {
    setSelectedRecord(record)
    setIsModalOpen(true)
  }

  const updateData = async (id: string, weight: number, type: string) => {
    if (!user) return

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      toast({
        title: "Error",
        description: "Anda tidak memiliki izin untuk memperbarui data.",
        variant: "destructive",
      })
      return
    }

    try {
      const points = calculatePoints(weight, type)
      const response = await axios.put(`${API_URL}/api/pengumpulan-sampah/${id}`, {
        berat: weight,
        jenisSampah: type,
        poin: points,
      })

      if (response.status === 200) {
        toast({
          title: "Sukses",
          description: "Data berhasil diperbarui.",
        })
        fetchData()
      } else {
        throw new Error("Failed to update data")
      }
    } catch (error) {
      console.error("Error updating data:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui data.",
        variant: "destructive",
      })
    }
  }

  const updateIncidentStatus = async (id: string, newStatus: "PENDING" | "IN_PROGRESS" | "RESOLVED") => {
    if (!user) {
      toast({
        title: "Error",
        description: "Anda harus login untuk memperbarui status insiden.",
        variant: "destructive",
      })
      return
    }

    const isSuperAdmin = user.role === "SUPERADMIN"
    const isAdmin = user.role === "ADMIN"

    // Cek izin perubahan status
    if (
      (!isSuperAdmin && !isAdmin) || // Jika bukan ADMIN/SUPERADMIN
      (isAdmin && newStatus !== "RESOLVED") // ADMIN hanya bisa ubah ke RESOLVED
    ) {
      toast({
        title: "Error",
        description: "Anda tidak memiliki izin untuk memperbarui status insiden ini.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await axios.put(
        `${API_URL}/api/insiden`, // PUT ke endpoint utama tanpa ID di URL
        { id, status: newStatus }, // Body request sesuai format
        { headers: { "x-user-role": user.role } }, // Tambahkan header otorisasi
      )

      if (response.status === 200) {
        toast({
          title: "Sukses",
          description: `Status insiden berhasil diperbarui menjadi ${newStatus}.`,
        })
        fetchData() // Refresh data setelah update
      } else {
        throw new Error("Failed to update incident status")
      }
    } catch (error) {
      console.error("Error updating incident status:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui status insiden.",
        variant: "destructive",
      })
    }
  }

  // Ubah implementasi filteredData untuk memastikan konsistensi pencarian
  const filteredData = garbageData.filter((record) => {
    const recordUser = users.find((u) => u.id === record.userId)
    return (
      recordUser?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `RT ${record.rt} RW ${record.rw}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.jenisSampah.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  const totalPages = Math.ceil(filteredData.length / recordsPerPage)
  const currentRecords = filteredData.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const chartData = garbageData
    .map((record) => ({
      date: new Date(record.waktu).toISOString().split("T")[0],
      weight: Number(record.berat),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Urutkan data

  const wasteComposition = wasteTypes
    .map((type) => ({
      name: type,
      value: garbageData
        .filter((record) => record.jenisSampah === type)
        .reduce((sum, record) => sum + (isNaN(record.berat) ? 0 : Number(record.berat)), 0),
    }))
    .filter((item) => item.value > 0) // Only include categories with data

  const locationPerformance = Array.from(new Set(garbageData.map((record) => `RT ${record.rt} RW ${record.rw}`)))
    .map((location) => ({
      name: location,
      "Total Sampah": garbageData
        .filter((record) => `RT ${record.rt} RW ${record.rw}` === location)
        .reduce((sum, record) => sum + Number(record.berat), 0), // Pastikan berat adalah number
    }))
    .sort((a, b) => b["Total Sampah"] - a["Total Sampah"]) // Urutkan dari terbesar ke terkecil

  if (loading || isLoadingUsers) {
    return <LoadingAnimation />
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {user && (
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-green-800">
            Selamat datang, {user.name} ({user.role})
          </h1>
        </div>
      )}
      {desaInfo && (
        <h2 className="text-2xl font-semibold text-green-600 mb-8">
          Desa {desaInfo.nama}, Kecamatan {desaInfo.kecamatan}, {desaInfo.kabupaten}, {desaInfo.provinsi}
        </h2>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          icon={<FaTrash />}
          title="Total Sampah Terkumpul"
          value={`${(Number.parseFloat(totalWeight as unknown as string) || 0).toFixed(2)} kg`}
          color="bg-gradient-to-r from-green-500 to-green-700 shadow-lg"
        />
        <DashboardCard
          icon={<FaRecycle />}
          title="Tingkat Daur Ulang"
          value={`${(Number(recyclingRate) || 0).toFixed(2)}%`}
          color="bg-gradient-to-r from-teal-500 to-teal-700 shadow-lg"
        />
        <DashboardCard
          icon={<FaMapMarkerAlt />}
          title="Titik Pengumpulan Unik"
          value={uniqueLocations.toString()}
          color="bg-gradient-to-r from-emerald-500 to-emerald-700 shadow-lg"
        />
      </div>

      <Tabs defaultValue="collection" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collection">Pengumpulan Sampah</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="gamification">Gamifikasi</TabsTrigger>
          {user?.role === "WARGA" ? (
            <TabsTrigger value="news">Berita</TabsTrigger>
          ) : (
            <TabsTrigger value="incidents">Insiden</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="collection">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengumpulan Sampah</CardTitle>
            </CardHeader>
            <CardContent>
              {user?.role === "ADMIN" && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="berat" className="block text-sm font-medium text-gray-700">
                        Berat (kg)
                      </label>
                      <Input
                        type="number"
                        id="berat"
                        name="berat"
                        value={newRecord.berat}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    {/* Perbaiki implementasi user selection dropdown */}
                    {/* Update bagian Select User dengan debugging */}
                    <div>
                      <label htmlFor="userId" className="block text-sm font-medium text-gray-700">
                        Pilih User
                      </label>
                      <div className="relative">
                        <Select
                          name="userId"
                          value={newRecord.userId}
                          onValueChange={(value) => {
                            console.log("Selected user:", value) // Debug log
                            setNewRecord((prev) => ({
                              ...prev,
                              userId: value,
                            }))
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Cari username..." />
                          </SelectTrigger>
                          <SelectContent>
                            <div className="p-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder="Ketik username..."
                                  value={userSearchTerm}
                                  onChange={(e) => {
                                    const searchValue = e.target.value
                                    console.log("Search term:", searchValue) // Debug log
                                    setUserSearchTerm(searchValue)
                                    setIsSearchingUser(true)
                                    setTimeout(() => setIsSearchingUser(false), 300)
                                  }}
                                  className="pl-8 mb-2"
                                />
                              </div>
                            </div>
                            <div className="max-h-[200px] overflow-y-auto">
                              {isSearchingUser ? (
                                <div className="p-4 text-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                                  <p className="text-sm text-gray-500 mt-2">Mencari user...</p>
                                </div>
                              ) : (
                                <>
                                  {(() => {
                                    const filteredUsers = users.filter((u) => {
                                      const searchCheck = u.username
                                        .toLowerCase()
                                        .includes(userSearchTerm.toLowerCase())
                                      return u.role === "WARGA" && searchCheck && u.id
                                    })

                                    console.log("Filtered users:", filteredUsers) // Debug log

                                    return filteredUsers.length > 0 ? (
                                      filteredUsers.map((u) => (
                                        <SelectItem
                                          key={u.id}
                                          value={u.id || "default-id"} // Pastikan selalu ada value yang valid
                                          className="cursor-pointer hover:bg-gray-100"
                                        >
                                          <div className="flex items-center gap-2">
                                            <div className="flex-1">{u.username || "Unnamed User"}</div>
                                            {user?.role === "SUPERADMIN" && (
                                              <span className="text-xs text-muted-foreground">
                                                {u.desaId || "No Desa"}
                                              </span>
                                            )}
                                          </div>
                                        </SelectItem>
                                      ))
                                    ) : (
                                      <div className="p-2 text-sm text-gray-500 text-center">
                                        Tidak ada user ditemukan
                                      </div>
                                    )
                                  })()}
                                </>
                              )}
                            </div>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="rt" className="block text-sm font-medium text-gray-700">
                        RT
                      </label>
                      <Input type="text" id="rt" name="rt" value={newRecord.rt} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <label htmlFor="rw" className="block text-sm font-medium text-gray-700">
                        RW
                      </label>
                      <Input type="text" id="rw" name="rw" value={newRecord.rw} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <label htmlFor="jenisSampah" className="block text-sm font-medium text-gray-700">
                        Jenis Sampah
                      </label>
                      <Select
                        name="jenisSampah"
                        value={newRecord.jenisSampah}
                        onValueChange={(value) => setNewRecord((prev) => ({ ...prev, jenisSampah: value }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih Jenis Sampah" />
                        </SelectTrigger>
                        <SelectContent>
                          {wasteTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" onClick={handleSubmit}>
                    Kirim Data Pengumpulan
                  </Button>
                </form>
              )}

              <div className="mt-8">
                <div className="flex items-center border border-gray-300 rounded-lg mb-4 p-2">
                  <FaSearch className="text-gray-500 mr-2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Cari data berdasarkan username, alamat, atau jenis sampah..."
                    className="w-full p-2 border-0 outline-none"
                  />
                </div>

                <div className="overflow-x-auto shadow-lg rounded-lg">
                  <table className="min-w-full table-auto border-separate border-spacing-0">
                    <thead className="bg-gradient-to-r from-green-400 to-green-600 text-white">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Berat</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Nama Pemilik</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Alamat</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Jenis Sampah</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Poin</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {currentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-gray-600">
                            Tidak ada data
                          </td>
                        </tr>
                      ) : (
                        currentRecords.map((record) => {
                          const recordUser = users.find((u) => u.id === record.userId)
                          return (
                            <tr
                              key={record.id}
                              onDoubleClick={() => handleRowDoubleClick(record)}
                              className="cursor-pointer hover:bg-green-100 transition-colors duration-300"
                            >
                              <td className="px-6 py-4 border-t border-b border-gray-300">{record.berat}</td>
                              <td className="px-6 py-4 border-t border-b border-gray-300">
                                {users.find((u) => u.id === record.userId)?.username || "User tidak ditemukan"}
                              </td>
                              <td className="px-6 py-4 border-t border-b border-gray-300">{`RT ${record.rt} RW ${record.rw}`}</td>
                              <td className="px-6 py-4 border-t border-b border-gray-300">{record.jenisSampah}</td>
                              <td className="px-6 py-4 border-t border-b border-gray-300">{record.poin}</td>
                              <td className="px-6 py-4 border-t border-b border-gray-300">
                                {new Date(record.waktu).toLocaleString("id-ID")}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-green-500 text-white rounded-l"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-green-500 text-white rounded-r"
                  >
                    Next
                  </button>
                </div>
              </div>

              {selectedRecord && isModalOpen && (
                <EditModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  currentData={selectedRecord}
                  updateData={updateData}
                  deleteData={deleteData} // Tambahkan ini
                />
              )}
            </CardContent>
          </Card>

          {user?.role === "ADMIN" && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Input Jadwal Pengumpulan</CardTitle>
              </CardHeader>
              <CardContent>
                <CollectionScheduleForm user={user} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tren Pengumpulan Sampah</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <LineChart
                    data={chartData}
                    index="date"
                    categories={["weight"]}
                    colors={["#10B981"]}
                    valueFormatter={(value) => `${value} kg`}
                    yAxisWidth={40}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Komposisi Sampah</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <PieChart
                    data={wasteComposition}
                    category="value"
                    index="name"
                    valueFormatter={(value) => `${value.toFixed(2)} kg`}
                    colors={["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {wasteComposition.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index] }}
                      ></div>
                      <span>
                        {item.name}: {typeof item.value === "number" ? item.value.toFixed(2) : "-"} kg
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performa Pengumpulan per Lokasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <BarChart
                    data={locationPerformance}
                    index="name"
                    categories={["Total Sampah"]}
                    colors={["teal"]}
                    valueFormatter={(value) => `${(Number(value) || 0).toFixed(2)} kg`}
                    yAxisWidth={48}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wawasan AI</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <WawasanAI garbageData={garbageData} users={leaderboard} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gamification">
          <div className="grid grid-cols-1 gap-6">
            <LeaderboardCard />
            <AchievementsCard />
            <UserStatisticsCard />
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          {user?.role !== "WARGA" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Laporan Insiden</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Lokasi</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dilaporkan Pada</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell>{incident.type}</TableCell>
                          <TableCell>{incident.location}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                incident.status === "PENDING"
                                  ? "destructive"
                                  : incident.status === "IN_PROGRESS"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {incident.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(incident.time).toLocaleString("id-ID")}</TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Lihat Detail
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Detail Insiden</DialogTitle>
                                  <DialogDescription>
                                    Informasi lengkap mengenai insiden yang dilaporkan.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right font-medium">Jenis</label>
                                    <div className="col-span-3">{incident.type}</div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right font-medium">Lokasi</label>
                                    <div className="col-span-3">{incident.location}</div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right font-medium">Status</label>
                                    <div className="col-span-3">
                                      <Badge
                                        variant={
                                          incident.status === "PENDING"
                                            ? "destructive"
                                            : incident.status === "IN_PROGRESS"
                                              ? "secondary"
                                              : "outline"
                                        }
                                      >
                                        {incident.status}
                                      </Badge>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right font-medium">Deskripsi</label>
                                    <div className="col-span-3">{incident.description}</div>
                                  </div>
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right font-medium">Pelapor</label>
                                    <div className="col-span-3">{incident.reporterId}</div>
                                  </div>
                                  {incident.handled_By && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <label className="text-right font-medium">Ditangani Oleh</label>
                                      <div className="col-span-3">{incident.handled_By}</div>
                                    </div>
                                  )}
                                  {incident.time_handled && (
                                    <div className="grid grid-cols-4 items-center gap-4">
                                      <label className="text-right font-medium">Waktu Penanganan</label>
                                      <div className="col-span-3">
                                        {new Date(incident.time_handled).toLocaleString("id-ID")}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <DialogFooter>
                                  {user?.role === "ADMIN" && incident.status === "IN_PROGRESS" && (
                                    <Button onClick={() => updateIncidentStatus(incident.id, "RESOLVED")}>
                                      Tandai Selesai
                                    </Button>
                                  )}
                                  {user?.role === "SUPERADMIN" && (
                                    <Select
                                      onValueChange={(value) =>
                                        updateIncidentStatus(
                                          incident.id,
                                          value as "PENDING" | "IN_PROGRESS" | "RESOLVED",
                                        )
                                      }
                                      defaultValue={incident.status}
                                    >
                                      <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Pilih status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="PENDING">Menunggu</SelectItem>
                                        <SelectItem value="IN_PROGRESS">Sedang Ditangani</SelectItem>
                                        <SelectItem value="RESOLVED">Selesai</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <IncidentForm onSubmit={fetchData} />

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Ringkasan Insiden</CardTitle>
                </CardHeader>
                <CardContent>
                  <SimplifiedMap incidents={incidents} />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="news">
          <NewsSection />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <CollectionSchedule />
        <CollectionSummary garbageData={garbageData} />
      </div>
    </main>
  )
}

function DashboardCard({
  icon,
  title,
  value,
  color,
}: {
  icon: React.ReactNode
  title: string
  value: string
  color: string
}) {
  return (
    <motion.div
      className={`bggradient-to-r ${color} rounded-lg shadow-md p-6 text-white`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex items-center space-x-4">
        <div className="text-4xl">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </motion.div>
  )
}

function CollectionSchedule() {
  const [schedules, setSchedules] = useState<JadwalPengumpulan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchSchedules = async () => {
      if (!user) return

      try {
        // Periksa apakah user adalah SUPERADMIN
        const isSuperAdmin = user.role?.toUpperCase() === "SUPERADMIN"

        // SUPERADMIN langsung panggil API utama tanpa desaId
        const url = isSuperAdmin
          ? `${API_URL}/api/jadwal-pengumpulan`
          : `${API_URL}/api/jadwal-pengumpulan?desaId=${user.desaId}`

        // Panggil API
        const response = await axios.get(url, {
          headers: { "x-user-role": user.role },
        })

        setSchedules(response.data)
      } catch (err) {
        setError("Error fetching schedules")
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSchedules()
  }, [user])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jadwal Pengumpulan</CardTitle>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <div>No schedules available</div>
        ) : (
          <ul className="space-y-2">
            {schedules.map((schedule) => (
              <ScheduleItem
                key={schedule.id}
                day={schedule.hari}
                startTime={schedule.waktuMulai}
                endTime={schedule.waktuSelesai}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ScheduleItem({ day, startTime, endTime }: { day: string; startTime: string; endTime: string }) {
  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <li className="flex items-center space-x-2 text-gray-700">
      <FaCalendarAlt className="text-green-600" />
      <span className="font-medium">{day}:</span>
      <span>
        {formatTime(startTime)} - {formatTime(endTime)}
      </span>
    </li>
  )
}

function CollectionSummary({ garbageData }: { garbageData: GarbageRecord[] }) {
  const totalCollections = garbageData.length
  const totalWeight = garbageData.reduce((sum, record) => sum + (Number(record.berat) || 0), 0)
  const averageWeight = totalWeight / totalCollections || 0
  const percentageCollected = (totalCollections / (totalCollections + 100)) * 100 // Assuming 100 as a baseline for total possible collections

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ringkasan Pengumpulan</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Pengumpulan</p>
            <p className="text-2xl font-bold">{totalCollections}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Berat</p>
            <p className="text-2xl font-bold">{(Number(totalWeight) || 0).toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rata-rata Berat per Pengumpulan</p>
            <p className="text-2xl font-bold">{averageWeight.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Persentase Pengumpulan</p>
            <p className="text-2xl font-bold">{percentageCollected.toFixed(2)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Achievement({
  title,
  description,
  icon,
  progress,
}: {
  title: string
  description: string
  icon: React.ReactNode
  progress: number
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center space-x-2 mb-2">
        <div className="text-2xl text-green-600">{icon}</div>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-2">{description}</p>
      <Progress value={progress} className="w-full" />
    </div>
  )
}

function CollectionScheduleForm({ user }: { user: { desaId: string; role: string } }) {
  const [newSchedule, setNewSchedule] = useState({
    hari: "",
    waktuMulai: "",
    waktuSelesai: "",
  })
  const { toast } = useToast()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewSchedule((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
      toast({
        title: "Error",
        description: "Anda tidak memiliki izin untuk menambahkan jadwal.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await axios.post(
        `${API_URL}/api/jadwal-pengumpulan`,
        {
          desaId: user.desaId,
          hari: newSchedule.hari.toUpperCase(),
          waktuMulai: newSchedule.waktuMulai,
          waktuSelesai: newSchedule.waktuSelesai,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-user-role": user.role,
          },
        },
      )

      if (response.status === 201) {
        toast({
          title: "Sukses",
          description: "Jadwal berhasil ditambahkan.",
        })
        setNewSchedule({ hari: "", waktuMulai: "", waktuSelesai: "" })
      } else {
        throw new Error("Failed to add schedule")
      }
    } catch (error) {
      console.error("Error submitting new schedule:", error)
      toast({
        title: "Error",
        description: "Gagal menambahkan jadwal. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="hari" className="block text-sm font-medium text-gray-700">
            Hari
          </label>
          <Select
            name="hari"
            value={newSchedule.hari}
            onValueChange={(value) =>
              handleInputChange({ target: { name: "hari", value } } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih Hari" />
            </SelectTrigger>
            <SelectContent>
              {["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"].map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label htmlFor="waktuMulai" className="block text-sm font-medium text-gray-700">
            Waktu Mulai
          </label>
          <Input
            type="time"
            id="waktuMulai"
            name="waktuMulai"
            value={newSchedule.waktuMulai}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label htmlFor="waktuSelesai" className="block text-sm font-medium text-gray-700">
            Waktu Selesai
          </label>
          <Input
            type="time"
            id="waktuSelesai"
            name="waktuSelesai"
            value={newSchedule.waktuSelesai}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Tambah Jadwal Pengumpulan
      </Button>
    </form>
  )
}

