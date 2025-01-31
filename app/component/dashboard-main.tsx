'use client'

import React, { useState, useEffect } from 'react'
import { FaTrash, FaRecycle, FaMapMarkerAlt, FaCalendarAlt, FaSearch, FaRobot, FaLeaf, FaChartLine, FaTrophy, FaExclamationTriangle } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LineChart, BarChart, DonutChart } from "@/components/ui/charts"
import { IncidentForm } from './IncidentForm'
import { RankingList } from './RankingList'
import { SimplifiedMap } from './SimplifiedMap'
import WawasanAI  from './WawasanAI';
import EditModal from "./EditModal";

// Type definitions
interface GarbageRecord {
  id: string
  berat: number
  nama_pemilik: string
  rt: string
  rw: string
  desa: string
  jenis_sampah: string
  poin: number
  waktu: string
}

interface User {
  id: string
  nama_pemilik: string
  email: string
  total_poin: number
  avatar: string
}

interface Incident {
  id: string
  type: string
  location: string
  status: string
  time: string
  description: string
  reporter_id: string
  handled_by: string | null
  time_handled: string | null
}

const wasteTypes = ['Plastik', 'Kertas', 'Kaca', 'Organik', 'B3']

export default function DashboardMain() {
  // Handle search term change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const [garbageData, setGarbageData] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Fetch data (adjust according to your project setup)
  useEffect(() => {
    fetchData();
  }, []);

  // Handle row double-click to open modal with the selected record
  const handleRowDoubleClick = (record: any) => {
    setSelectedRecord(record); // Set selected record
    setIsModalOpen(true); // Open modal
  };

  // Fungsi untuk menghitung poin berdasarkan berat
  const calculatePoints = (weight: number): number => {
    const pointsPerKg = 10; // Misal 1 kg = 10 poin
    return weight * pointsPerKg;
  };

  // Fungsi untuk memperbarui record
  const updateData = async (id: string, weight: number, type: string) => {
    try {
      const newPoints = calculatePoints(weight);
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'pengumpulan_sampah',
          record: { id, berat: weight, jenis_sampah: type, poin: newPoints }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update data');
      }

      toast({
        title: "Sukses",
        description: "Data berhasil diperbarui.",
      });

      setGarbageData(prevData =>
        prevData.map(record =>
          record.id === id
            ? { ...record, berat: weight, jenis_sampah: type, poin: newPoints }
            : record
        )
      );
    } catch (error) {
      console.error('Error updating data:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui data.",
        variant: "destructive",
      });
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(garbageData.length / recordsPerPage);

  // Get records to display for the current page
  const currentRecords = garbageData.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Handle pagination page change
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page); // Set the page
    }
  };

  const [users, setUsers] = useState<User[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [newRecord, setNewRecord] = useState({
    berat: '',
    nama_pemilik: '',
    rt: '',
    rw: '',
    desa: '',
    jenis_sampah: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [totalWeight, setTotalWeight] = useState(0)
  const [uniqueLocations, setUniqueLocations] = useState(0)
  const [recyclingRate, setRecyclingRate] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (garbageData.length > 0) {
      const total = garbageData.reduce((sum, record) => sum + record.berat, 0)
      setTotalWeight(total)
      const locations = new Set(garbageData.map(record => `${record.desa}-${record.rw}-${record.rt}`))
      setUniqueLocations(locations.size)
      const recyclableWaste = garbageData.filter(record => ['Plastik', 'Kertas', 'Kaca'].includes(record.jenis_sampah))
      const recyclableWeight = recyclableWaste.reduce((sum, record) => sum + record.berat, 0)
      setRecyclingRate((recyclableWeight / total) * 100)
    }
  }, [garbageData])

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [garbageResponse, userResponse, incidentResponse] = await Promise.all([
        fetch('/api/supabase?table=pengumpulan_sampah'),
        fetch('/api/supabase?table=leaderboard'),
        fetch('/api/supabase?table=insiden')
      ])

      if (!garbageResponse.ok) throw new Error(`Error fetching garbage data: ${garbageResponse.statusText}`)
      if (!userResponse.ok) throw new Error(`Error fetching user data: ${userResponse.statusText}`)
      if (!incidentResponse.ok) throw new Error(`Error fetching incident data: ${incidentResponse.statusText}`)

      const garbageData = await garbageResponse.json()
      const userData = await userResponse.json()
      const incidentData = await incidentResponse.json()

      setGarbageData(garbageData || [])
      setUsers(userData || [])
      setIncidents(incidentData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Gagal mengambil data. Silakan coba lagi nanti.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setNewRecord(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          table: 'pengumpulan_sampah',
          record: {
            berat: parseFloat(newRecord.berat),
            nama_pemilik: newRecord.nama_pemilik,
            rt: newRecord.rt,
            rw: newRecord.rw,
            desa: newRecord.desa,
            jenis_sampah: newRecord.jenis_sampah,
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit data')
      }

      toast({
        title: "Sukses",
        description: "Data berhasil ditambahkan.",
      })
      setNewRecord({ berat: '', nama_pemilik: '', rt: '', rw: '', desa: '', jenis_sampah: '' })
      fetchData()
    } catch (error) {
      console.error('Error submitting new record:', error)
      toast({
        title: "Error",
        description: "Gagal menambahkan data. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  const filteredData = garbageData.filter(record =>
    record.nama_pemilik.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${record.desa} ${record.rw} ${record.rt}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.jenis_sampah.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const chartData = garbageData.map(record => ({
    date: new Date(record.waktu).toLocaleDateString(),
    weight: record.berat
  }))

  const wasteComposition = wasteTypes.map(type => ({
    name: type,
    value: garbageData.filter(record => record.jenis_sampah === type).reduce((sum, record) => sum + record.berat, 0)
  }))

  const locationPerformance = Array.from(new Set(garbageData.map(record => record.desa))).map(desa => ({
    name: desa,
    "Total Sampah": garbageData.filter(record => record.desa === desa).reduce((sum, record) => sum + record.berat, 0)
  }))
  
  return (
    <main className="container mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <h1 className="text-4xl font-bold text-green-800 mb-8">Dashboard Manajemen Sampah AI</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard
          icon={<FaTrash />}
          title="Total Sampah Terkumpul"
          value={`${totalWeight.toFixed(2)} kg`}
          color="from-green-400 to-green-600"
        />
        <DashboardCard
          icon={<FaRecycle />}
          title="Tingkat Daur Ulang"
          value={`${recyclingRate.toFixed(2)}%`}
          color="from-teal-400 to-teal-600"
        />
        <DashboardCard
          icon={<FaMapMarkerAlt />}
          title="Titik Pengumpulan Unik"
          value={uniqueLocations.toString()}
          color="from-emerald-400 to-emerald-600"
        />
      </div>

      <Tabs defaultValue="collection" className="mb-8">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="collection">Pengumpulan Sampah</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="gamification">Gamifikasi</TabsTrigger>
          <TabsTrigger value="incidents">Insiden</TabsTrigger>
        </TabsList>
        <TabsContent value="collection">
          <Card>
            <CardHeader>
              <CardTitle>Daftar Pengumpulan Sampah</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="berat" className="block text-sm font-medium text-gray-700">Berat (kg)</label>
                    <Input
                      type="number"
                      id="berat"
                      name="berat"
                      value={newRecord.berat}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="nama_pemilik" className="block text-sm font-medium text-gray-700">Nama Pemilik</label>
                    <Input
                      type="text"
                      id="nama_pemilik"
                      name="nama_pemilik"
                      value={newRecord.nama_pemilik}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="rt" className="block text-sm font-medium text-gray-700">RT</label>
                    <Input
                      type="text"
                      id="rt"
                      name="rt"
                      value={newRecord.rt}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="rw" className="block text-sm font-medium text-gray-700">RW</label>
                    <Input
                      type="text"
                      id="rw"
                      name="rw"
                      value={newRecord.rw}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="desa" className="block text-sm font-medium text-gray-700">Desa</label>
                    <Input
                      type="text"
                      id="desa"
                      name="desa"
                      value={newRecord.desa}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="jenis_sampah" className="block text-sm font-medium text-gray-700">Jenis Sampah</label>
                    <Select
                      name="jenis_sampah"
                      value={newRecord.jenis_sampah}
                      onValueChange={(value) => setNewRecord(prev => ({ ...prev, jenis_sampah: value }))}
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
                <Button type="submit" className="w-full">
                  Kirim Data Pengumpulan
                </Button>
              </form>
            </CardContent>
          </Card>

          <br />
          <div>
            {/* Search Input with Icon */}
            <div className="flex items-center border border-gray-300 rounded-lg mb-4 p-2">
              <FaSearch className="text-gray-500 mr-2" /> {/* Icon */}
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange} // Handle search input change
                placeholder="Cari berdasarkan nama, alamat, atau jenis sampah..."
                className="w-full p-2 border-0 outline-none"
              />
            </div>

            {/* Table to show the data */}
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
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-600">Tidak ada data</td>
                    </tr>
                  ) : (
                    filteredData.map((record) => (
                      <tr
                        key={record.id}
                        onDoubleClick={() => handleRowDoubleClick(record)}
                        className="cursor-pointer hover:bg-green-100 transition-colors duration-300"
                      >
                        <td className="px-6 py-4 border-t border-b border-gray-300">{record.berat}</td>
                        <td className="px-6 py-4 border-t border-b border-gray-300">{record.nama_pemilik}</td>
                        <td className="px-6 py-4 border-t border-b border-gray-300">{`${record.desa} RT ${record.rt} RW ${record.rw}`}</td>
                        <td className="px-6 py-4 border-t border-b border-gray-300">{record.jenis_sampah}</td>
                        <td className="px-6 py-4 border-t border-b border-gray-300">{record.poin}</td>
                        <td className="px-6 py-4 border-t border-b border-gray-300">{new Date(record.waktu).toLocaleString('id-ID')}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center mt-4">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-green-500 text-white rounded-l"
              >
                Previous
              </button>
              <span className="px-4 py-2">{currentPage} / {totalPages}</span>
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
            />
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
                  <DonutChart
                    data={wasteComposition}
                    valueFormatter={(value) => `${value.toFixed(2)} kg`}
                    colors={["#FF0000", "#FFA500", "#32CD32", "#1E90FF", "#000000"]}
                  />
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
                    valueFormatter={(value) => `${value.toFixed(2)} kg`}
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
                  <WawasanAI garbageData={garbageData} users={users} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gamification">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RankingList users={users} />

            <Card>
              <CardHeader>
                <CardTitle>Pencapaian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Achievement
                    title="Pemula Daur Ulang"
                    description="Daur ulang item pertama Anda"
                    icon={<FaRecycle />}
                    progress={100}
                  />
                  <Achievement
                    title="Pejuang Sampah"
                    description="Kumpulkan 100kg sampah"
                    icon={<FaTrash />}
                    progress={75}
                  />
                  <Achievement
                    title="Pelindung Lingkungan"
                    description="Pertahankan tingkat daur ulang 90% selama sebulan"
                    icon={<FaLeaf />}
                    progress={50}
                  />
                  <Achievement
                    title="Penggiat Komunitas"
                    description="Ajak 5 teman untuk bergabung"
                    icon={<FaTrophy />}
                    progress={20}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Statistik Pengguna</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <BarChart
                    data={users.map(user => ({
                      name: user.nama_pemilik,
                      "Total Poin": user.total_poin
                    }))}
                    index="name"
                    categories={["Total Poin"]}
                    colors={["violet"]}
                    valueFormatter={(value) => `${value} poin`}
                    yAxisWidth={48}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents">
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
                          <Badge variant={incident.status === 'Pending' ? 'destructive' : 'outline'}>
                            {incident.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(incident.time).toLocaleString('id-ID')}</TableCell>
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
                                    <Badge variant={incident.status === 'Pending' ? 'destructive' : 'outline'}>
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
                                  <div className="col-span-3">{incident.reporter_id}</div>
                                </div>
                                {incident.handled_by && (
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right font-medium">Ditangani Oleh</label>
                                    <div className="col-span-3">{incident.handled_by}</div>
                                  </div>
                                )}
                                {incident.time_handled && (
                                  <div className="grid grid-cols-4 items-center gap-4">
                                    <label className="text-right font-medium">Waktu Penanganan</label>
                                    <div className="col-span-3">{new Date(incident.time_handled).toLocaleString('id-ID')}</div>
                                  </div>
                                )}
                              </div>
                              <DialogFooter>
                                <Button type="submit">Tutup</Button>
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
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <CollectionSchedule />
        <CollectionSummary garbageData={garbageData} />
      </div>
    </main>
  )
}

function DashboardCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string; color: string }) {
  return (
    <motion.div
      className={`bg-gradient-to-r ${color} rounded-lg shadow-md p-6 text-white`}
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jadwal Pengumpulan</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          <ScheduleItem day="Senin" areas="RT 01, RT 02" />
          <ScheduleItem day="Rabu" areas="RT 03, RT 04" />
          <ScheduleItem day="Jumat" areas="RT 05, RT 06" />
        </ul>
      </CardContent>
    </Card>
  )
}

function ScheduleItem({ day, areas }: { day: string; areas: string }) {
  return (
    <li className="flex items-center space-x-2 text-gray-700">
      <FaCalendarAlt className="text-green-600" />
      <span className="font-medium">{day}:</span>
      <span>{areas}</span>
    </li>
  )
}

function CollectionSummary({ garbageData }: { garbageData: GarbageRecord[] }) {
  const totalCollections = garbageData.length
  const totalWeight = garbageData.reduce((sum, record) => sum + record.berat, 0)
  const averageWeight = totalWeight / totalCollections || 0

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
            <p className="text-2xl font-bold">{totalWeight.toFixed(2)} kg</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rata-rata Berat per Pengumpulan</p>
            <p className="text-2xl font-bold">{averageWeight.toFixed(2)} kg</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function Achievement({ title, description, icon, progress }: { title: string; description: string; icon: React.ReactNode; progress: number }) {
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

