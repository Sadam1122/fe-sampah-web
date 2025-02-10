import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useAuth } from "../hook/useAuth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface IncidentData {
  id?: string;
  desaId: string;
  type: string;
  location: string;
  description: string;
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
  time?: string;
  reporterId: string;
  handledBy?: string;
  timeHandled?: string;
}

interface IncidentFormProps {
  onSubmit: (incident: IncidentData) => Promise<void>;
}

export function IncidentForm({ onSubmit }: IncidentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [incidentData, setIncidentData] = useState<IncidentData>({
    desaId: user?.desaId || "",
    type: "",
    location: "",
    description: "",
    status: "PENDING",
    reporterId: "",
    handledBy: "",
  });

  useEffect(() => {
    if (user?.desaId) {
      setIncidentData((prev) => ({ ...prev, desaId: user.desaId }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user) {
        throw new Error("User belum tersedia");
      }
      
      const response = await axios.post(
        `${API_URL}/api/insiden`,
        {
          ...incidentData,
          handledBy: incidentData.reporterId,
          timeHandled: new Date().toISOString(),
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-user-role": user.role,
          },
        }
      );

      if (response.status !== 201) throw new Error("Gagal mengirim laporan insiden");
      
      toast({ title: "Success", description: "Laporan insiden berhasil dikirim" });
      await onSubmit(incidentData);

      // Reset form setelah submit berhasil
      setIncidentData({
        desaId: user.desaId || "",
        type: "",
        location: "",
        description: "",
        status: "PENDING",
        reporterId: "",
        handledBy: "",
      });
    } catch (error) {
      console.error("Error submitting incident:", error);
      toast({ title: "Error", description: "Gagal mengirim laporan insiden", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporkan Insiden</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select onValueChange={(value) => setIncidentData((prev) => ({ ...prev, type: value }))} required>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Jenis Insiden" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pembuangan Ilegal">Pembuangan Ilegal</SelectItem>
              <SelectItem value="Tempat Sampah Penuh">Tempat Sampah Penuh</SelectItem>
              <SelectItem value="Sampah Berbahaya">Sampah Berbahaya</SelectItem>
              <SelectItem value="Kebakaran">Kebakaran</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Lokasi"
            value={incidentData.location}
            onChange={(e) => setIncidentData((prev) => ({ ...prev, location: e.target.value }))}
            required
          />
          <Input
            placeholder="Deskripsi"
            value={incidentData.description}
            onChange={(e) => setIncidentData((prev) => ({ ...prev, description: e.target.value }))}
            required
          />
          <Input
            placeholder="Nama Pelapor"
            value={incidentData.reporterId}
            onChange={(e) => setIncidentData((prev) => ({ ...prev, reporterId: e.target.value }))}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Mengirim..." : "Laporkan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}