import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Trash2 } from "lucide-react"

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  currentData: {
    id: string
    berat: number
    jenisSampah: string
    poin: number
  }
  updateData: (id: string, weight: number, type: string) => void
  deleteData: (id: string) => void
}

const wasteTypes = ["Plastik", "Kertas", "Kaca", "Organik", "B3"]

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, currentData, updateData, deleteData }) => {
  const [weight, setWeight] = useState<number>(currentData.berat)
  const [type, setType] = useState<string>(currentData.jenisSampah)
  const [points, setPoints] = useState<number>(currentData.poin)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const { toast } = useToast()
  

  const calculatePoints = (weight: number): number => {
    const pointsPerKg = 10
    return Math.round(weight * pointsPerKg)
  }

  useEffect(() => {
    setPoints(calculatePoints(weight))
  }, [weight])

  const handleSave = async () => {
    if (weight <= 0 || !type) {
      toast({
        title: "Error",
        description: "Mohon masukkan berat dan jenis sampah yang valid.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      await updateData(currentData.id, weight, type)
      toast({
        title: "Sukses",
        description: "Data berhasil diperbarui!",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Apakah Anda yakin ingin menghapus data ini?")
    if (!confirmDelete) return

    setIsLoading(true)
    try {
      await deleteData(currentData.id)
      toast({
        title: "Sukses",
        description: "Data berhasil dihapus!",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menghapus data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Data Sampah</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="weight" className="text-right">Berat (kg)</label>
            <Input
              id="weight"
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="text-right">Jenis Sampah</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih jenis sampah" />
              </SelectTrigger>
              <SelectContent>
                {wasteTypes.map((wasteType) => (
                  <SelectItem key={wasteType} value={wasteType}>
                    {wasteType}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="points" className="text-right">Poin</label>
            <Input id="points" type="number" value={points} readOnly className="col-span-3" />
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
            <Trash2 className="w-5 h-5 mr-2" /> {isLoading ? "Menghapus..." : "Hapus"}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditModal
