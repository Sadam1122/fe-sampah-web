"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FaTrash, FaRecycle, FaMapMarkerAlt, FaCalendarAlt } from "react-icons/fa"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

// Import icons
import { Search, Plus, Trash2, Edit, ArrowUpDown, Info, TrendingUp, Users, DollarSign } from "lucide-react"

// Type definitions for waste types management
interface WasteType {
  id: string
  name: string
  description: string
  pricePerKg: number
  recyclable: boolean
  hazardous: boolean
  createdAt: string
  updatedAt: string
}

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
  // Add rupiah field
  rupiah?: number
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
  // Add total earnings
  totalEarnings?: number
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
  const [totalEarnings, setTotalEarnings] = useState(0)
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
  const [isSearchingUser, setIsSearchingUser] = useState(false)
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null)

  // Waste Types Management State
  const [wasteTypesList, setWasteTypesList] = useState<WasteType[]>([])
  const [wasteTypeSearchTerm, setWasteTypeSearchTerm] = useState("")
  const [selectedWasteType, setSelectedWasteType] = useState<WasteType | null>(null)
  const [isWasteTypeDialogOpen, setIsWasteTypeDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [wasteTypeFormData, setWasteTypeFormData] = useState({
    name: "",
    description: "",
    pricePerKg: "",
    recyclable: false,
    hazardous: false,
  })
  const [sortConfig, setSortConfig] = useState<{
    key: keyof WasteType | null
    direction: "ascending" | "descending"
  }>({ key: null, direction: "ascending" })
  const [wasteTypeStats, setWasteTypeStats] = useState({
    totalTypes: 0,
    averagePrice: 0,
    recyclablePercentage: 0,
    hazardousCount: 0,
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (user) {
      fetchDesaInfo(user.desaId)
      fetchData()
      fetchWasteTypes() // Fetch waste types data
    }
  }, [user, loading, router])

  // Add a new useEffect to recalculate earnings when wasteTypesList changes:
  useEffect(() => {
    if (user && wasteTypesList.length > 0 && garbageData.length > 0) {
      // Recalculate earnings when waste types are loaded
      const updatedEarnings = garbageData.reduce((sum, record) => {
        const wasteType = wasteTypesList.find((type) => type.name === record.jenisSampah)
        const rupiah = wasteType ? Number(record.berat) * Number(wasteType.pricePerKg) : 0
        return sum + rupiah
      }, 0)
      setTotalEarnings(updatedEarnings)
    }
  }, [wasteTypesList, garbageData, user])

  // Fetch waste types
  const fetchWasteTypes = async () => {
    if (!user) return

    try {
      const response = await axios.get(`${API_URL}/api/waste-types`, {
        headers: { "x-user-role": user.role },
      })

      if (response.status === 200) {
        setWasteTypesList(response.data)
        calculateWasteTypeStats(response.data)
      }
    } catch (error) {
      console.error("Error fetching waste types:", error)
      toast({
        title: "Error",
        description: "Gagal mengambil data jenis sampah. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  // Calculate waste type statistics
  const calculateWasteTypeStats = (types: WasteType[]) => {
    if (!types.length) return

    const totalTypes = types.length
    const totalPrice = types.reduce((sum, type) => sum + Number(type.pricePerKg || 0), 0)
    const averagePrice = totalTypes > 0 ? totalPrice / totalTypes : 0
    const recyclableCount = types.filter((type) => type.recyclable).length
    const recyclablePercentage = (recyclableCount / totalTypes) * 100
    const hazardousCount = types.filter((type) => type.hazardous).length

    setWasteTypeStats({
      totalTypes,
      averagePrice,
      recyclablePercentage,
      hazardousCount,
    })
  }

  // Handle waste type form input change
  const handleWasteTypeInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked
      setWasteTypeFormData((prev) => ({ ...prev, [name]: checked }))
    } else {
      setWasteTypeFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // Reset waste type form
  const resetWasteTypeForm = () => {
    setWasteTypeFormData({
      name: "",
      description: "",
      pricePerKg: "",
      recyclable: false,
      hazardous: false,
    })
    setIsEditMode(false)
    setSelectedWasteType(null)
  }

  // Open edit dialog for waste type
  const openWasteTypeEditDialog = (wasteType: WasteType) => {
    setSelectedWasteType(wasteType)
    setWasteTypeFormData({
      name: wasteType.name,
      description: wasteType.description,
      pricePerKg: wasteType.pricePerKg.toString(),
      recyclable: wasteType.recyclable,
      hazardous: wasteType.hazardous,
    })
    setIsEditMode(true)
    setIsWasteTypeDialogOpen(true)
  }

  // Open create dialog for waste type
  const openWasteTypeCreateDialog = () => {
    resetWasteTypeForm()
    setIsWasteTypeDialogOpen(true)
  }

  // Handle waste type form submission
  const handleWasteTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk melakukan tindakan ini.",
        variant: "destructive",
      })
      return
    }

    // Validate form
    if (!wasteTypeFormData.name || !wasteTypeFormData.description || !wasteTypeFormData.pricePerKg) {
      toast({
        title: "Validasi Error",
        description: "Silakan isi semua field yang diperlukan.",
        variant: "destructive",
      })
      return
    }

    const price = Number.parseFloat(wasteTypeFormData.pricePerKg)
    if (isNaN(price) || price < 0) {
      toast({
        title: "Validasi Error",
        description: "Harga harus berupa angka positif.",
        variant: "destructive",
      })
      return
    }

    try {
      if (isEditMode && selectedWasteType) {
        // Update existing waste type
        const response = await axios.put(
          `${API_URL}/api/waste-types/${selectedWasteType.id}`,
          {
            name: wasteTypeFormData.name,
            description: wasteTypeFormData.description,
            pricePerKg: Number.parseFloat(wasteTypeFormData.pricePerKg),
            recyclable: wasteTypeFormData.recyclable,
            hazardous: wasteTypeFormData.hazardous,
          },
          { headers: { "x-user-role": user.role } },
        )

        if (response.status === 200) {
          toast({
            title: "Sukses",
            description: "Jenis sampah berhasil diperbarui.",
          })

          // Update local state
          setWasteTypesList((prev) => prev.map((item) => (item.id === selectedWasteType.id ? response.data : item)))
          calculateWasteTypeStats(
            wasteTypesList.map((item) => (item.id === selectedWasteType.id ? response.data : item)),
          )
        }
      } else {
        // Create new waste type
        const response = await axios.post(
          `${API_URL}/api/waste-types`,
          {
            name: wasteTypeFormData.name,
            description: wasteTypeFormData.description,
            pricePerKg: Number.parseFloat(wasteTypeFormData.pricePerKg),
            recyclable: wasteTypeFormData.recyclable,
            hazardous: wasteTypeFormData.hazardous,
          },
          { headers: { "x-user-role": user.role } },
        )

        if (response.status === 201) {
          toast({
            title: "Sukses",
            description: "Jenis sampah baru berhasil ditambahkan.",
          })

          // Add to local state
          const updatedList = [...wasteTypesList, response.data]
          setWasteTypesList(updatedList)
          calculateWasteTypeStats(updatedList)
        }
      }

      // Close dialog and reset form
      setIsWasteTypeDialogOpen(false)
      resetWasteTypeForm()
    } catch (error) {
      console.error("Error submitting waste type form:", error)
      toast({
        title: "Error",
        description: isEditMode
          ? "Gagal memperbarui jenis sampah. Silakan coba lagi."
          : "Gagal membuat jenis sampah. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  // Handle waste type deletion
  const handleWasteTypeDelete = async (id: string) => {
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki izin untuk menghapus jenis sampah.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("Apakah Anda yakin ingin menghapus jenis sampah ini? Tindakan ini tidak dapat dibatalkan.")) {
      return
    }

    try {
      const response = await axios.delete(`${API_URL}/api/waste-types/${id}`, {
        headers: { "x-user-role": user.role },
      })

      if (response.status === 200) {
        toast({
          title: "Sukses",
          description: "Jenis sampah berhasil dihapus.",
        })

        // Remove from local state
        const updatedList = wasteTypesList.filter((item) => item.id !== id)
        setWasteTypesList(updatedList)
        calculateWasteTypeStats(updatedList)
      }
    } catch (error) {
      console.error("Error deleting waste type:", error)
      toast({
        title: "Error",
        description: "Gagal menghapus jenis sampah. Mungkin sedang digunakan dalam pengumpulan yang ada.",
        variant: "destructive",
      })
    }
  }

  // Handle waste type sorting
  const handleWasteTypeSort = (key: keyof WasteType) => {
    let direction: "ascending" | "descending" = "ascending"

    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }

    setSortConfig({ key, direction })

    const sortedData = [...wasteTypesList].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === "ascending" ? -1 : 1
      }
      if (a[key] > b[key]) {
        return direction === "ascending" ? 1 : -1
      }
      return 0
    })

    setWasteTypesList(sortedData)
  }

  // Filter waste types based on search term
  const filteredWasteTypes = wasteTypesList.filter(
    (wasteType) =>
      wasteType.name.toLowerCase().includes(wasteTypeSearchTerm.toLowerCase()) ||
      wasteType.description.toLowerCase().includes(wasteTypeSearchTerm.toLowerCase()),
  )

  // Prepare chart data for waste types
  const wasteTypePriceData = wasteTypesList.map((type) => ({
    name: type.name,
    price: type.pricePerKg,
  }))

  const wasteTypeCompositionData = [
    { name: "Recyclable", value: wasteTypesList.filter((t) => t.recyclable).length },
    { name: "Non-Recyclable", value: wasteTypesList.filter((t) => !t.recyclable).length },
  ].filter((item) => item.value > 0)

  const wasteTypeHazardousData = [
    { name: "Hazardous", value: wasteTypesList.filter((t) => t.hazardous).length },
    { name: "Non-Hazardous", value: wasteTypesList.filter((t) => !t.hazardous).length },
  ].filter((item) => item.value > 0)

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

      // Process garbage data and calculate rupiah values
      const garbageDataWithRupiah = garbageResponse.data.map((record: GarbageRecord) => {
        // Find the waste type for this record
        const wasteType = wasteTypesList.find((type) => type.name === record.jenisSampah)
        // Calculate rupiah based on weight and price per kg
        const rupiah = wasteType ? Number(record.berat) * Number(wasteType.pricePerKg) : 0
        console.log(
          `Record: ${record.id}, Weight: ${record.berat}, Type: ${record.jenisSampah}, Price: ${wasteType?.pricePerKg || 0}, Rupiah: ${rupiah}`,
        )
        return {
          ...record,
          rupiah,
        }
      })

      setGarbageData(garbageDataWithRupiah)

      // Calculate total weight
      const total = garbageDataWithRupiah.reduce(
        (sum: number, record: GarbageRecord) => sum + (Number(record.berat) || 0),
        0,
      )
      setTotalWeight(total)

      // Calculate total earnings with explicit conversion to numbers
      const earnings = garbageDataWithRupiah.reduce((sum: number, record: GarbageRecord) => {
        // If rupiah is already calculated in the record, use it
        if (record.rupiah) {
          return sum + Number(record.rupiah)
        }
        // Otherwise calculate it based on waste type
        const wasteType = wasteTypesList.find((type) => type.name === record.jenisSampah)
        const calculatedRupiah = wasteType ? Number(record.berat) * Number(wasteType.pricePerKg) : 0
        return sum + calculatedRupiah
      }, 0)
      console.log(`Total earnings calculated: ${earnings}`)
      setTotalEarnings(earnings)

      const locations = new Set(garbageDataWithRupiah.map((record: GarbageRecord) => `${record.rt}-${record.rw}`))
      setUniqueLocations(locations.size)

      // First, ensure wasteTypesList is available
      if (wasteTypesList.length > 0) {
        // Identify recyclable waste based on waste type properties
        const recyclableWaste = garbageDataWithRupiah.filter((record: GarbageRecord) => {
          const wasteType = wasteTypesList.find((type) => type.name === record.jenisSampah)
          return wasteType?.recyclable === true
        })

        // Calculate total weight of recyclable waste
        const recyclableWeight = recyclableWaste.reduce(
          (sum: number, record: GarbageRecord) => sum + (Number(record.berat) || 0),
          0,
        )

        // Calculate recycling rate as percentage
        const recyclingRate = total > 0 ? (recyclableWeight / total) * 100 : 0
        console.log("Recycling calculation:", {
          totalWeight: total,
          recyclableWeight,
          recyclingRate,
          recyclableItems: recyclableWaste.length,
          totalItems: garbageDataWithRupiah.length,
        })
        setRecyclingRate(recyclingRate)
      } else {
        // If waste types aren't loaded yet, use a fallback calculation based on common recyclable materials
        const commonRecyclables = ["Plastik", "Kertas", "Kaca", "Logam", "Kardus", "Aluminium"]
        const recyclableWaste = garbageDataWithRupiah.filter((record: GarbageRecord) =>
          commonRecyclables.includes(record.jenisSampah),
        )

        const recyclableWeight = recyclableWaste.reduce(
          (sum: number, record: GarbageRecord) => sum + (Number(record.berat) || 0),
          0,
        )

        const recyclingRate = total > 0 ? (recyclableWeight / total) * 100 : 0
        console.log("Fallback recycling calculation:", {
          totalWeight: total,
          recyclableWeight,
          recyclingRate,
        })
        setRecyclingRate(recyclingRate)
      }

      // Process leaderboard data to include earnings
      const leaderboardWithEarnings = leaderboardResponse.data.map((entry: LeaderboardEntry) => {
        // Calculate total earnings for this user
        const userRecords = garbageDataWithRupiah.filter((record: GarbageRecord) => {
          const recordUser = users.find((u) => u.id === record.userId)
          return recordUser?.id === entry.userId
        })

        const totalEarnings = userRecords.reduce((sum: number, record: GarbageRecord) => sum + (record.rupiah || 0), 0)

        return {
          ...entry,
          totalEarnings,
        }
      })

      setLeaderboard(leaderboardWithEarnings)

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
  }, [user, toast, wasteTypesList, users])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewRecord((prev) => ({ ...prev, [name]: value }))

    // Recalculate price when weight changes
    if (name === "berat" && newRecord.jenisSampah) {
      const selectedWasteType = wasteTypesList.find((type) => type.name === newRecord.jenisSampah)
      if (selectedWasteType && value) {
        const weight = Number.parseFloat(value)
        const price = selectedWasteType.pricePerKg * weight
        setCalculatedPrice(price)
      } else {
        setCalculatedPrice(null)
      }
    }
  }

  // Calculate rupiah earned based on waste type and weight
  const calculateRupiah = (weight: number, wasteType: string): number => {
    const selectedWasteType = wasteTypesList.find((type) => type.name === wasteType)
    if (selectedWasteType) {
      return weight * selectedWasteType.pricePerKg
    }
    // Fallback if waste type not found
    return 0
  }

  // Modified handleSubmit function to merge data when username matches and use rupiah instead of points
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

      const rupiah = calculateRupiah(weight, newRecord.jenisSampah)

      // Find the selected user to get their username
      const selectedUser = users.find((u) => u.id === newRecord.userId)
      if (!selectedUser) {
        toast({
          title: "Error",
          description: "User tidak ditemukan.",
        })
        return
      }

      // Check if there's an existing record with the same username
      const existingRecords = garbageData.filter((record) => {
        const recordUser = users.find((u) => u.id === record.userId)
        return recordUser?.username === selectedUser.username && record.jenisSampah === newRecord.jenisSampah
      })

      // Format the request body according to the new structure
      const requestBody = {
        username: selectedUser.username,
        berat: weight,
        rt: newRecord.rt,
        rw: newRecord.rw,
        jenisSampah: newRecord.jenisSampah,
        poin: 0, // We're not using points anymore, but API might still require it
        rupiah: rupiah,
      }

      // If there's an existing record, update it instead of creating a new one
      if (existingRecords.length > 0) {
        const existingRecord = existingRecords[0]
        const updatedWeight = Number(existingRecord.berat) + weight
        const updatedRupiah = calculateRupiah(updatedWeight, newRecord.jenisSampah)

        const updateResponse = await axios.put(
          `${API_URL}/api/pengumpulan-sampah/${existingRecord.id}`,
          {
            berat: updatedWeight,
            jenisSampah: newRecord.jenisSampah,
            poin: 0, // Not using points
            rupiah: updatedRupiah,
          },
          {
            headers: { "x-user-role": user.role },
          },
        )

        if (updateResponse.status === 200) {
          toast({
            title: "Sukses",
            description: "Data berhasil diperbarui dan digabungkan dengan data yang sudah ada.",
          })
          setNewRecord({ berat: "", userId: "", rt: "", rw: "", jenisSampah: "" })
          fetchData()
        } else {
          throw new Error("Failed to update existing record")
        }
      } else {
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
              totalPoin: 0, // Not using points
              poinSaatIni: 0, // Not using points
              jumlahPengumpulan: 1,
              totalEarnings: rupiah,
            },
            {
              headers: { "x-user-role": user.role },
            },
          )

          if (leaderboardResponse.status === 201) {
            toast({
              title: "Sukses",
              description: "Data berhasil ditambahkan dan pendapatan warga diperbarui.",
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
      const rupiah = calculateRupiah(weight, type)
      const response = await axios.put(`${API_URL}/api/pengumpulan-sampah/${id}`, {
        berat: weight,
        jenisSampah: type,
        poin: 0, // Not using points anymore
        rupiah: rupiah,
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

  // Improved filteredData implementation for consistent searching
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

  const wasteComposition = wasteTypesList
    .map((type) => ({
      name: type.name,
      value: garbageData
        .filter((record) => record.jenisSampah === type.name)
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

  // Prepare earnings data for charts
  const earningsData = Array.from(
    new Set(
      garbageData.map((record) => {
        const user = users.find((u) => u.id === record.userId)
        return user?.username || "Unknown"
      }),
    ),
  )
    .map((username) => {
      const userRecords = garbageData.filter((record) => {
        const recordUser = users.find((u) => u.id === record.userId)
        return recordUser?.username === username
      })

      const totalEarnings = userRecords.reduce((sum, record) => sum + (record.rupiah || 0), 0)

      return {
        name: username,
        earnings: totalEarnings,
      }
    })
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 10) // Top 10 earners

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        <DashboardCard
          icon={<DollarSign />}
          title="Total Pendapatan"
          value={`Rp${totalEarnings.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          color="bg-gradient-to-r from-blue-500 to-blue-700 shadow-lg"
        />
      </div>

      <Tabs defaultValue="collection" className="mb-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="collection">Pengumpulan Sampah</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="earnings">Pendapatan</TabsTrigger>
          <TabsTrigger value="waste-types">Jenis Sampah</TabsTrigger>
          {user?.role === "WARGA" ? (
            <TabsTrigger value="news">Berita</TabsTrigger>
          ) : (
            <TabsTrigger value="incidents">Insiden</TabsTrigger>
          )}
        </TabsList>

        {/* Waste Types Tab Content */}
        <TabsContent value="waste-types">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Jenis Sampah"
              value={wasteTypeStats.totalTypes.toString()}
              icon={<Info className="h-8 w-8 text-blue-500" />}
              color="bg-blue-50 border-blue-200"
            />
            <StatCard
              title="Harga Rata-rata"
              value={wasteTypeStats ? `Rp${wasteTypeStats.averagePrice.toLocaleString("id-ID")}/kg` : "Loading..."}
              icon={<ArrowUpDown className="h-8 w-8 text-amber-500" />}
              color="bg-amber-50 border-amber-200"
            />
            <StatCard
              title="Persentase Daur Ulang"
              value={`${wasteTypeStats.recyclablePercentage.toFixed(2)}%`}
              icon={<FaRecycle className="h-8 w-8 text-green-500" />}
              color="bg-green-50 border-green-200"
            />
            <StatCard
              title="Jenis Berbahaya"
              value={wasteTypeStats.hazardousCount.toString()}
              icon={<Trash2 className="h-8 w-8 text-red-500" />}
              color="bg-red-50 border-red-200"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Daftar Jenis Sampah</CardTitle>
                <CardDescription>Kelola jenis sampah dan informasi harganya</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center border border-gray-300 rounded-lg p-2 w-full md:w-2/3">
                    <Search className="text-gray-500 mr-2" />
                    <input
                      type="text"
                      value={wasteTypeSearchTerm}
                      onChange={(e) => setWasteTypeSearchTerm(e.target.value)}
                      placeholder="Cari jenis sampah..."
                      className="w-full p-2 border-0 outline-none"
                    />
                  </div>
                  {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
                    <Button onClick={openWasteTypeCreateDialog} className="ml-2">
                      <Plus className="mr-2 h-4 w-4" /> Tambah
                    </Button>
                  )}
                </div>

                <div className="overflow-x-auto shadow-lg rounded-lg">
                  <Table>
                    <TableHeader className="bg-gradient-to-r from-green-400 to-green-600 text-white">
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handleWasteTypeSort("name")}>
                          Nama {sortConfig.key === "name" && (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead>Deskripsi</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handleWasteTypeSort("pricePerKg")}>
                          Harga/kg{" "}
                          {sortConfig.key === "pricePerKg" && (sortConfig.direction === "ascending" ? "↑" : "↓")}
                        </TableHead>
                        <TableHead>Properti</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWasteTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-gray-600">
                            Tidak ada jenis sampah ditemukan
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredWasteTypes.map((wasteType) => (
                          <TableRow key={wasteType.id} className="hover:bg-green-50 transition-colors duration-200">
                            <TableCell className="font-medium">{wasteType.name}</TableCell>
                            <TableCell>{wasteType.description}</TableCell>
                            <TableCell>
                              Rp
                              {wasteType.pricePerKg.toLocaleString("id-ID", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-2">
                                {wasteType.recyclable && (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                    Daur Ulang
                                  </Badge>
                                )}
                                {wasteType.hazardous && (
                                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                                    Berbahaya
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                {(user?.role === "ADMIN" || user?.role === "SUPERADMIN") && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openWasteTypeEditDialog(wasteType)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                      onClick={() => handleWasteTypeDelete(wasteType.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analisis Jenis Sampah</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="price">
                  <TabsList className="mb-4">
                    <TabsTrigger value="price">Harga</TabsTrigger>
                    <TabsTrigger value="recyclable">Daur Ulang</TabsTrigger>
                    <TabsTrigger value="hazardous">Berbahaya</TabsTrigger>
                  </TabsList>

                  <TabsContent value="price">
                    <div className="h-[300px]">
                      <BarChart
                        data={wasteTypePriceData}
                        index="name"
                        categories={["price"]}
                        colors={["#10B981"]}
                        valueFormatter={(value) =>
                          `Rp${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                        }
                        yAxisWidth={48}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="recyclable">
                    <div className="h-[300px]">
                      <PieChart
                        data={wasteTypeCompositionData}
                        category="value"
                        index="name"
                        valueFormatter={(value) => `${value} jenis`}
                        colors={["#10B981", "#6B7280"]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {wasteTypeCompositionData.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: index === 0 ? "#10B981" : "#6B7280" }}
                          ></div>
                          <span>
                            {item.name}: {item.value} jenis
                          </span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="hazardous">
                    <div className="h-[300px]">
                      <PieChart
                        data={wasteTypeHazardousData}
                        category="value"
                        index="name"
                        valueFormatter={(value) => `${value} jenis`}
                        colors={["#EF4444", "#6B7280"]}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {wasteTypeHazardousData.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-2"
                            style={{ backgroundColor: index === 0 ? "#EF4444" : "#6B7280" }}
                          ></div>
                          <span>
                            {item.name}: {item.value} jenis
                          </span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Waste Type Form Dialog */}
          <Dialog open={isWasteTypeDialogOpen} onOpenChange={setIsWasteTypeDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{isEditMode ? "Edit Jenis Sampah" : "Tambah Jenis Sampah Baru"}</DialogTitle>
                <DialogDescription>
                  {isEditMode ? "Perbarui detail jenis sampah ini." : "Isi detail untuk menambahkan jenis sampah baru."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleWasteTypeSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="name" className="text-right font-medium">
                      Nama
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={wasteTypeFormData.name}
                      onChange={handleWasteTypeInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="description" className="text-right font-medium">
                      Deskripsi
                    </label>
                    <Input
                      id="description"
                      name="description"
                      value={wasteTypeFormData.description}
                      onChange={handleWasteTypeInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="pricePerKg" className="text-right font-medium">
                      Harga per kg (Rp)
                    </label>
                    <Input
                      id="pricePerKg"
                      name="pricePerKg"
                      type="number"
                      step="0.01"
                      min="0"
                      value={wasteTypeFormData.pricePerKg}
                      onChange={handleWasteTypeInputChange}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right font-medium">Properti</label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="recyclable"
                          name="recyclable"
                          checked={wasteTypeFormData.recyclable}
                          onChange={handleWasteTypeInputChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="recyclable">Dapat Didaur Ulang</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="hazardous"
                          name="hazardous"
                          checked={wasteTypeFormData.hazardous}
                          onChange={handleWasteTypeInputChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <label htmlFor="hazardous">Berbahaya</label>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsWasteTypeDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit">{isEditMode ? "Perbarui" : "Tambah"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="collection">
          <Card className="mb-6 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
            <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white">
              <CardTitle className="text-2xl">Daftar Pengumpulan Sampah</CardTitle>
              <CardDescription className="text-green-100">
                Kelola data pengumpulan sampah dan pendapatan warga
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {user?.role === "ADMIN" && (
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6 bg-green-50 p-6 rounded-lg mb-8 border border-green-100"
                >
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                    <Plus className="mr-2 h-5 w-5" /> Tambah Data Pengumpulan Baru
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label htmlFor="berat" className="block text-sm font-medium text-gray-700 mb-1">
                        Berat (kg)
                      </label>
                      <Input
                        type="number"
                        id="berat"
                        name="berat"
                        value={newRecord.berat}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm"
                      />
                    </div>
                    {/* Improved user selection dropdown */}
                    <div>
                      <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">
                        Pilih Warga
                      </label>
                      <div className="relative">
                        <Select
                          name="userId"
                          value={newRecord.userId}
                          onValueChange={(value) => {
                            setNewRecord((prev) => ({
                              ...prev,
                              userId: value,
                            }))
                          }}
                        >
                          <SelectTrigger className="w-full shadow-sm">
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

                                    return filteredUsers.length > 0 ? (
                                      filteredUsers.map((u) => (
                                        <SelectItem
                                          key={u.id}
                                          value={u.id || "default-id"}
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
                      <label htmlFor="rt" className="block text-sm font-medium text-gray-700 mb-1">
                        RT
                      </label>
                      <Input
                        type="text"
                        id="rt"
                        name="rt"
                        value={newRecord.rt}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="rw" className="block text-sm font-medium text-gray-700 mb-1">
                        RW
                      </label>
                      <Input
                        type="text"
                        id="rw"
                        name="rw"
                        value={newRecord.rw}
                        onChange={handleInputChange}
                        required
                        className="shadow-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="jenisSampah" className="block text-sm font-medium text-gray-700 mb-1">
                        Jenis Sampah
                      </label>
                      <Select
                        name="jenisSampah"
                        value={newRecord.jenisSampah}
                        onValueChange={(value) => {
                          setNewRecord((prev) => ({ ...prev, jenisSampah: value }))
                          // Update price calculation when waste type changes
                          const selectedWasteType = wasteTypesList.find((type) => type.name === value)
                          if (selectedWasteType && newRecord.berat) {
                            const weight = Number.parseFloat(newRecord.berat)
                            const price = selectedWasteType.pricePerKg * weight
                            setCalculatedPrice(price)
                          }
                        }}
                      >
                        <SelectTrigger className="w-full shadow-sm">
                          <SelectValue placeholder="Pilih Jenis Sampah" />
                        </SelectTrigger>
                        <SelectContent>
                          {wasteTypesList.map((type) => (
                            <SelectItem key={type.id} value={type.name}>
                              {type.name} - Rp
                              {type.pricePerKg.toLocaleString("id-ID", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                              /kg
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {calculatedPrice !== null && (
                    <div className="mt-2 p-4 bg-white border border-green-200 rounded-md shadow-sm">
                      <p className="text-lg font-medium text-green-800 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2" />
                        Pendapatan Estimasi: Rp
                        {calculatedPrice.toLocaleString("id-ID", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {newRecord.berat} kg × Rp
                        {Number(
                          wasteTypesList.find((t) => t.name === newRecord.jenisSampah)?.pricePerKg || 0,
                        ).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        /kg
                      </p>
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleSubmit}
                  >
                    Kirim Data Pengumpulan
                  </Button>
                </form>
              )}

              <div className="mt-8">
                <div className="flex items-center border border-gray-300 rounded-lg mb-6 p-3 bg-white shadow-sm">
                  <Search className="text-gray-500 mr-2 h-5 w-5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Cari data berdasarkan username, alamat, atau jenis sampah..."
                    className="w-full p-2 border-0 outline-none text-gray-700"
                  />
                </div>

                <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-200">
                  <table className="min-w-full table-auto border-collapse">
                    <thead className="bg-gradient-to-r from-green-600 to-green-800 text-white">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Berat</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Nama Warga</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Alamat</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Jenis Sampah</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Pendapatan</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Waktu</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-600">
                            <div className="flex flex-col items-center">
                              <Trash2 className="h-12 w-12 text-gray-400 mb-2" />
                              <p>Tidak ada data pengumpulan sampah</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        currentRecords.map((record) => {
                          const recordUser = users.find((u) => u.id === record.userId)
                          const wasteType = wasteTypesList.find((type) => type.name === record.jenisSampah)
                          const rupiah = record.rupiah || (wasteType ? record.berat * wasteType.pricePerKg : 0)

                          return (
                            <tr
                              key={record.id}
                              onDoubleClick={() => handleRowDoubleClick(record)}
                              className="hover:bg-green-50 transition-colors duration-300"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="font-medium">{record.berat}</span> kg
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-bold mr-3">
                                    {recordUser?.username?.charAt(0).toUpperCase() || "?"}
                                  </div>
                                  <span className="font-medium">{recordUser?.username || "User tidak ditemukan"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">{`RT ${record.rt} RW ${record.rw}`}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge
                                  className={`${wasteType?.recyclable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                                >
                                  {record.jenisSampah}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap font-medium text-green-700">
                                Rp
                                {rupiah.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                {new Date(record.waktu).toLocaleString("id-ID")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRowDoubleClick(record)
                                    }}
                                    className="border-gray-300 hover:bg-green-50 hover:border-green-300"
                                  >
                                    <Edit className="h-4 w-4 text-gray-600" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 hover:bg-red-50 hover:border-red-300"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
                                        deleteData(record.id)
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-gray-600">
                    Menampilkan {currentRecords.length} dari {filteredData.length} data
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                    >
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNumber =
                          currentPage > 3
                            ? currentPage - 3 + i + (totalPages - currentPage < 2 ? totalPages - currentPage - 2 : 0)
                            : i + 1

                        return pageNumber <= totalPages ? (
                          <Button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            className={`w-8 h-8 p-0 ${currentPage === pageNumber ? "bg-green-600 hover:bg-green-700" : "border-gray-300"}`}
                          >
                            {pageNumber}
                          </Button>
                        ) : null
                      })}
                    </div>
                    <Button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                      className="border-gray-300"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>

              {selectedRecord && isModalOpen && (
                <EditModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  currentData={selectedRecord}
                  updateData={updateData}
                  deleteData={deleteData}
                />
              )}
            </CardContent>
          </Card>

          {user?.role === "ADMIN" && (
            <Card className="mt-8 shadow-lg border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <CardTitle>Input Jadwal Pengumpulan</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CollectionScheduleForm user={user} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white">
                <CardTitle>Tren Pengumpulan Sampah</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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

            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white">
                <CardTitle>Komposisi Sampah</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
                        style={{ backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"][index % 5] }}
                      ></div>
                      <span>
                        {item.name}: {typeof item.value === "number" ? item.value.toFixed(2) : "-"} kg
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white">
                <CardTitle>Performa Pengumpulan per Lokasi</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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

            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white">
                <CardTitle>Wawasan AI</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div>
                  <WawasanAI garbageData={garbageData} users={leaderboard} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="earnings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <CardTitle>Top 10 Pendapatan Warga</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[400px]">
                  <BarChart
                    data={earningsData}
                    index="name"
                    categories={["earnings"]}
                    colors={["#3B82F6"]}
                    valueFormatter={(value) =>
                      `Rp${Number(value).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                    }
                    yAxisWidth={80}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-gray-100">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <CardTitle>Ringkasan Pendapatan</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center">
                      <DollarSign className="h-10 w-10 text-blue-600 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">Total Pendapatan</p>
                        <p className="text-2xl font-bold text-blue-900">
                          Rp
                          {totalEarnings.toLocaleString("id-ID", {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center">
                      <Users className="h-10 w-10 text-green-600 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Jumlah Warga Aktif</p>
                        <p className="text-2xl font-bold text-green-900">
                          {new Set(garbageData.map((record) => record.userId)).size}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="flex items-center">
                      <TrendingUp className="h-10 w-10 text-amber-600 mr-4" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Rata-rata Pendapatan per Warga</p>
                        <p className="text-2xl font-bold text-amber-900">
                          Rp
                          {(
                            totalEarnings / (new Set(garbageData.map((record) => record.userId)).size || 1)
                          ).toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border border-gray-100 md:col-span-2">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
                <CardTitle>Daftar Pendapatan Warga</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                  <table className="min-w-full table-auto border-collapse">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Nama Warga</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Total Pengumpulan</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Total Berat (kg)</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-blue-800">Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((entry) => {
                        // Calculate total weight for this user
                        const userRecords = garbageData.filter((record) => record.userId === entry.userId)
                        const totalWeight = userRecords.reduce((sum, record) => sum + Number(record.berat), 0)

                        return (
                          <tr key={entry.id} className="hover:bg-blue-50 transition-colors duration-300">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold mr-3">
                                  {entry.user?.username?.charAt(0).toUpperCase() || "?"}
                                </div>
                                <span className="font-medium">{entry.user?.username}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{entry.jumlahPengumpulan}</td>
                            <td className="px-6 py-4 whitespace-nowrap">{totalWeight.toFixed(2)} kg</td>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-green-700">
                              Rp
                              {(entry.totalEarnings || 0).toLocaleString("id-ID", {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0,
                              })}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
          {user?.role !== "WARGA" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-lg border border-gray-100">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-800 text-white">
                  <CardTitle>Laporan Insiden</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
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

              <Card className="md:col-span-2 shadow-lg border border-gray-100">
                <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-800 text-white">
                  <CardTitle>Ringkasan Insiden</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
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
      className={`${color} rounded-lg shadow-md p-6 text-white`}
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

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <Card className={`${color} border shadow-md`}>
      <CardContent className="flex items-center p-6">
        <div className="mr-4">{icon}</div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
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
    <Card className="shadow-lg border border-gray-100">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <CardTitle>Jadwal Pengumpulan</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-500">
            <FaCalendarAlt className="w-12 h-12 mb-4 text-gray-300" />
            <p>Belum ada jadwal pengumpulan tersedia</p>
          </div>
        ) : (
          <ul className="space-y-3">
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
    <li className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
      <FaCalendarAlt className="text-blue-600 mr-3" />
      <span className="font-medium text-blue-800 mr-2">{day}:</span>
      <span className="text-blue-700">
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

  // Calculate total earnings
  const totalEarnings = garbageData.reduce((sum, record) => sum + (record.rupiah || 0), 0)
  const averageEarnings = totalEarnings / totalCollections || 0

  return (
    <Card className="shadow-lg border border-gray-100">
      <CardHeader className="bg-gradient-to-r from-green-600 to-green-800 text-white">
        <CardTitle>Ringkasan Pengumpulan</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm font-medium text-green-700">Total Pengumpulan</p>
            <p className="text-2xl font-bold text-green-800">{totalCollections}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm font-medium text-green-700">Total Berat</p>
            <p className="text-2xl font-bold text-green-800">{(Number(totalWeight) || 0).toFixed(2)} kg</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm font-medium text-green-700">Rata-rata Berat per Pengumpulan</p>
            <p className="text-2xl font-bold text-green-800">{averageWeight.toFixed(2)} kg</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
            <p className="text-sm font-medium text-green-700">Rata-rata Pendapatan per Pengumpulan</p>
            <p className="text-2xl font-bold text-green-800">
              Rp{averageEarnings.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
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
          <label htmlFor="hari" className="block text-sm font-medium text-gray-700 mb-1">
            Hari
          </label>
          <Select
            name="hari"
            value={newSchedule.hari}
            onValueChange={(value) =>
              handleInputChange({ target: { name: "hari", value } } as React.ChangeEvent<HTMLSelectElement>)
            }
          >
            <SelectTrigger className="w-full shadow-sm">
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
          <label htmlFor="waktuMulai" className="block text-sm font-medium text-gray-700 mb-1">
            Waktu Mulai
          </label>
          <Input
            type="time"
            id="waktuMulai"
            name="waktuMulai"
            value={newSchedule.waktuMulai}
            onChange={handleInputChange}
            required
            className="shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="waktuSelesai" className="block text-sm font-medium text-gray-700 mb-1">
            Waktu Selesai
          </label>
          <Input
            type="time"
            id="waktuSelesai"
            name="waktuSelesai"
            value={newSchedule.waktuSelesai}
            onChange={handleInputChange}
            required
            className="shadow-sm"
          />
        </div>
      </div>
      <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
        Tambah Jadwal Pengumpulan
      </Button>
    </form>
  )
}

