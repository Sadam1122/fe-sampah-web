import type React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";

interface UserData {
  id: string;
  username: string;
  role: string;
}

interface IncidentData {
  id?: string;
  desaId?: string;
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
  const [incidentData, setIncidentData] = useState<IncidentData>({
    type: "",
    location: "",
    description: "",
    status: "PENDING",
    reporterId: "",
  });

  const [userData, setUserData] = useState<UserData | null>(null);
  const { toast } = useToast();

  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const response = await fetch("/api/users", {
  //         method: "GET",
  //         headers: {
  //           "Content-Type": "application/json",
  //           "x-user-role": Cookies.get("role") || "", // Mengirimkan role sebagai header
  //         },
  //       });
  
  //       if (!response.ok) {
  //         throw new Error(`Gagal mendapatkan data user: ${response.status} ${response.statusText}`);
  //       }
  
  //       const data = await response.json();
  //       setUserData(data as UserData);
  //       setIncidentData((prev) => ({ ...prev, reporterId: data.id }));
  
  //     } catch (error) {
  //       console.error("Error fetching user data:", error);
  //       toast({ title: "Error", description: "Gagal mendapatkan data pengguna", variant: "destructive" });
  //     }
  //   };
  
  //   fetchUserData();
  // }, []);
  


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/insiden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(incidentData),
      });

      if (!response.ok) throw new Error("Gagal mengirim laporan insiden");

      toast({ title: "Success", description: "Laporan insiden berhasil dikirim" });
      await onSubmit(incidentData);

    } catch (error) {
      console.error("Error submitting incident:", error);
      toast({ title: "Error", description: "Gagal mengirim laporan insiden", variant: "destructive" });
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
              <SelectItem value="illegal_dumping">Pembuangan Ilegal</SelectItem>
              <SelectItem value="overflow">Tempat Sampah Penuh</SelectItem>
              <SelectItem value="hazardous_waste">Sampah Berbahaya</SelectItem>
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
          {userData && (
            <p className="text-sm text-gray-500">
              Dilaporkan oleh: {userData.username} ({userData.role})
            </p>
          )}
          <Button type="submit">Laporkan</Button>
        </form>
      </CardContent>
    </Card>
  );
}
