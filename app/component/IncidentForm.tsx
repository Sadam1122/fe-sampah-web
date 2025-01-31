import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const incidentTypes = ['Tempat Sampah Penuh', 'Pembuangan Ilegal', 'Peralatan Rusak', 'Lainnya']
const statusOptions = ['Pending', 'Perbaikan', 'Selesai']

interface IncidentFormProps {
  onSubmit: () => void
}

export function IncidentForm({ onSubmit }: IncidentFormProps) {
  const [newIncident, setNewIncident] = useState({
    type: '',
    location: '',
    description: '',
    status: 'Pending',
  })
  const { toast } = useToast()

  const handleIncidentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewIncident(prev => ({ ...prev, [name]: value }))
  }

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('insiden')
        .insert([
          {
            type: newIncident.type,
            location: newIncident.location,
            description: newIncident.description,
            status: newIncident.status,
            reporter_id: 'Anonymous', // Replace with actual user ID when authentication is implemented
          },
        ])

      if (error) throw error

      toast({
        title: "Sukses",
        description: "Insiden berhasil dilaporkan.",
      })
      setNewIncident({ type: '', location: '', description: '', status: 'Pending' })
      onSubmit()
    } catch (error) {
      console.error('Error submitting new incident:', error)
      toast({
        title: "Error",
        description: "Gagal melaporkan insiden. Silakan coba lagi.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporkan Insiden Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleIncidentSubmit} className="space-y-4">
          {/* Select Jenis Insiden */}
          <div>
            <label htmlFor="incidentType" className="block text-sm font-medium text-gray-700">Jenis Insiden</label>
            <Select
              name="type"
              value={newIncident.type}
              onValueChange={(value) => setNewIncident(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Jenis Insiden" />
              </SelectTrigger>
              <SelectContent>
                {incidentTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Input Lokasi */}
          <div>
            <label htmlFor="incidentLocation" className="block text-sm font-medium text-gray-700">Lokasi</label>
            <Input
              id="incidentLocation"
              name="location"
              value={newIncident.location}
              onChange={handleIncidentInputChange}
              placeholder="Masukkan lokasi insiden"
              required
            />
          </div>

          {/* Input Deskripsi */}
          <div>
            <label htmlFor="incidentDescription" className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <Textarea
              id="incidentDescription"
              name="description"
              value={newIncident.description}
              onChange={handleIncidentInputChange}
              rows={3}
              placeholder="Jelaskan insiden"
              required
            />
          </div>

          {/* Select Status */}
          <div>
            <label htmlFor="incidentStatus" className="block text-sm font-medium text-gray-700">Status</label>
            <Select
              name="status"
              value={newIncident.status}
              onValueChange={(value) => setNewIncident(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">Laporkan Insiden</Button>
        </form>
      </CardContent>
    </Card>
  )
}
