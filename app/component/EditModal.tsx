import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"; // Sesuaikan path
import { Input } from "@/components/ui/input"; // Sesuaikan path
import { toast } from "react-toastify";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: any;
  updateData: (id: string, weight: number, type: string, points: number) => void; // Tambahkan points di sini
}

const EditModal: React.FC<EditModalProps> = ({ isOpen, onClose, currentData, updateData }) => {
  const [weight, setWeight] = useState<number>(currentData.berat);
  const [type, setType] = useState<string>(currentData.jenis_sampah);
  const [points, setPoints] = useState<number>(currentData.poin); 
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fungsi untuk menghitung poin berdasarkan berat
  const calculatePoints = (weight: number): number => {
    const pointsPerKg = 10; // Misal 1 kg = 10 poin
    return weight * pointsPerKg;
  };

  // Update poin setiap kali berat berubah
  useEffect(() => {
    setPoints(calculatePoints(weight));
  }, [weight]); // Ketika weight berubah, update poin

  const handleSave = async () => {
    if (weight <= 0 || !type) {
      toast.error("Mohon masukkan berat dan jenis sampah yang valid.");
      return;
    }

    setIsLoading(true);
    try {
      await updateData(currentData.id, weight, type, points); // Kirim poin baru
      toast.success("Data berhasil diperbarui!");
      onClose(); // Menutup modal setelah sukses
    } catch (error) {
      toast.error("Gagal memperbarui data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    isOpen ? (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Edit Data Sampah</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Berat (kg)</label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="mt-1"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Jenis Sampah</label>
              <Input
                type="text"
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Poin</label>
              <Input
                type="number"
                value={points}
                readOnly // Poin diupdate otomatis
                className="mt-1"
              />
            </div>
            <div className="flex space-x-4 mt-6">
              <Button onClick={onClose} variant="outline">Batal</Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    ) : null
  );
};

export default EditModal;
