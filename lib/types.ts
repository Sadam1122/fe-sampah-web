export interface GarbageRecord {
    id: string
    berat: number
    namaPemilik: string
    rt: string
    rw: string
    desaId: string
    desa: Desa
    jenisSampah: string
    poin: number
    waktu: string
  }
  
  export interface User {
    id: string
    username: string
    email: string
    totalPoin: number
  }
  
  export interface Incident {
    id: string
    type: string
    location: string
    status: string
    createdAt: string
    deskripsi: string
  }
  
  export interface Desa {
    id: string
    nama: string
    kecamatan: string
    kabupaten: string
    provinsi: string
  }
  
  