"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../hook/useAuth";
import { FaUser, FaEnvelope, FaShieldAlt, FaMapMarkerAlt, FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import DashboardHeader from "../component/dashboard-header";
import DashboardFooter from "../component/dashboard-footer"


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 🔥 Tambahkan pengecekan login sebelum memuat halaman
  useEffect(() => {
    console.log("Cek user:", user); // 🔍 Cek isi user di console
    if (!user) {
      router.push("/profile"); 
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/pengguna/${user.id}`, {
          headers: { "x-user-role": user.role },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch profile: ${res.status}`);
        }

        const data = await res.json();
        setProfile(data);
      } catch (err) {
        console.error("Error loading profile:", err);
        setError("Gagal memuat data profil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // 🔥 Pastikan hanya menampilkan loading, agar tidak terjadi flicker ke halaman profil
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <motion.div
          className="flex flex-col items-center space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <FaUser className="text-green-600 text-6xl" />
          </motion.div>
          <motion.p
            className="text-gray-500 font-semibold text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          >
            Memuat...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <motion.div
          className="flex flex-col items-center space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            <FaUser className="text-green-600 text-6xl" />
          </motion.div>
          <motion.p
            className="text-gray-500 font-semibold text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
          >
            Memuat Profil...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 font-semibold mt-10">
        {error}
      </div>
    );
  }

  return (
    <>
      <DashboardHeader />
      <div className="max-w-4xl mx-auto mt-20 p-8 bg-white shadow-lg rounded-xl border-l-8 border-green-500 relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 flex items-center space-x-2 text-green-600 hover:text-green-800 transition-colors"
        >
          <FaArrowLeft className="text-xl" />
          <span className="font-semibold">Kembali</span>
        </button>

        <motion.h1
          className="text-4xl font-bold text-green-600 text-center mb-6"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Profil Pengguna
        </motion.h1>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <ProfileItem icon={<FaUser />} label="Nama" value={profile?.username} />
          <ProfileItem icon={<FaEnvelope />} label="Email" value={profile?.email} />
          <ProfileItem icon={<FaShieldAlt />} label="Peran" value={profile?.role} />
          <ProfileItem icon={<FaMapMarkerAlt />} label="Desa" value={profile?.desa?.nama || "Tidak ada"} />
        </motion.div>
        <br /><br /><br /><br /><br />
      </div>
      <DashboardFooter />
    </>
  );
}

function ProfileItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <motion.div
      className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-green-600 text-2xl">{icon}</div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-lg font-semibold text-gray-800">{value || "-"}</p>
      </div>
    </motion.div>
  );
}


