"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Lightbulb, Leaf, Recycle, Globe2 } from "lucide-react";

const news = [
  {
    title: "Kota Bersih, Hidup Sehat: Program Baru Daur Ulang",
    description:
      "Pemerintah meluncurkan program 'Recycle 2025' yang bertujuan mengurangi sampah plastik hingga 50% dalam dua tahun ke depan.",
    date: "10 Februari 2025",
  },
  {
    title: "Revolusi Hijau di Sekolah",
    description:
      "Sekolah-sekolah kini mulai menerapkan sistem daur ulang dan pemanfaatan kompos dari sampah organik di kantin.",
    date: "8 Februari 2025",
  },
  {
    title: "Bank Sampah Digital: Tukar Sampah Jadi Saldo",
    description:
      "Warga kini bisa menukar sampah plastik dan kertas menjadi saldo digital yang bisa digunakan untuk belanja atau donasi lingkungan.",
    date: "5 Februari 2025",
  },
];

const tips = [
  {
    title: "5 Cara Sederhana Kurangi Plastik di Rumah",
    content:
      "Gunakan tas belanja kain, bawa botol minum sendiri, dan hindari sedotan plastik untuk langkah kecil yang berdampak besar.",
    icon: <Recycle className="text-green-500" size={24} />,
  },
  {
    title: "Membuat Kompos dari Sampah Dapur",
    content:
      "Sampah organik seperti sisa sayur dan buah bisa diubah menjadi pupuk alami yang kaya nutrisi untuk tanaman Anda.",
    icon: <Leaf className="text-green-500" size={24} />,
  },
  {
    title: "Fakta Menarik: Sampah Bisa Jadi Energi",
    content:
      "Tahukah Anda? Sampah organik bisa diolah menjadi biogas yang bisa digunakan sebagai sumber energi alternatif.",
    icon: <Lightbulb className="text-yellow-500" size={24} />,
  },
  {
    title: "Jaga Laut dari Sampah Plastik",
    content:
      "Setiap tahun, lebih dari 8 juta ton plastik mencemari lautan. Mulai dari diri sendiri dengan mengurangi pemakaian plastik sekali pakai!",
    icon: <Globe2 className="text-blue-500" size={24} />,
  },
];

export function NewsSection() {
  return (
    <Tabs defaultValue="berita" className="w-full">
      <TabsList>
        <TabsTrigger value="berita">Berita & Program</TabsTrigger>
        <TabsTrigger value="tips">Tips & Fakta Menarik</TabsTrigger>
      </TabsList>

      <TabsContent value="berita">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                <p className="text-xs text-gray-500">Diterbitkan: {item.date}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="tips">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {tips.map((tip, index) => (
            <Card key={index} className="flex flex-col items-center text-center p-4">
              <div className="mb-2">{tip.icon}</div>
              <CardHeader>
                <CardTitle className="text-lg">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{tip.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
