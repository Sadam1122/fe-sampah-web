"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Mail, User, Lock, Eye, EyeOff, UserPlus, Leaf, MapPin, Building, Home, Loader } from "lucide-react"
import Notification from "../component/Notification"
import { motion } from "framer-motion"
import { useAuth } from "../hook/useAuth"
import type React from "react"
import { v4 as uuidv4 } from "uuid"

// Tambahkan ini di bagian atas file, setelah import statements
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

interface UserData {
  id: string
  role: string
  username: string
  desaId: string
}

interface FormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  role: string
  createdById?: string
  desaId: string
  // Desa information (for superadmin only)
  nama?: string
  kecamatan?: string
  kabupaten?: string
  provinsi?: string
}

interface Desa {
  id: string
  nama: string
  kecamatan: string
  kabupaten: string
  provinsi: string
}

const ROLE_CONFIGURATIONS: Record<string, string[]> = {
  superadmin: ["WARGA", "ADMIN"],
  admin: ["WARGA"],
  staff: ["WARGA"],
}

const validatePassword = (password: string): string[] => {
  const errors: string[] = []
  if (password.length < 8) errors.push("Password harus memiliki panjang minimal 8 karakter")
  if (!/[A-Z]/.test(password)) errors.push("Password harus mengandung setidaknya satu huruf kapital")
  if (!/[a-z]/.test(password)) errors.push("Password harus mengandung setidaknya satu huruf kecil")
  if (!/[0-9]/.test(password)) errors.push("Password harus mengandung setidaknya satu angka")
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Password harus mengandung setidaknya satu karakter khusus")
  return errors
}

export default function RegisterPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "",
    desaId: user?.desaId || "",
    nama: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
  })

  useEffect(() => {
    if (user?.desaId) {
      setFormData((prev) => ({ ...prev, desaId: user.desaId }))
    }
  }, [user])

  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  // Add this state to track the desa creation process
  const [desaCreated, setDesaCreated] = useState(false)
  const [newDesaId, setNewDesaId] = useState("")
  // New states for desa selection feature
  const [desaList, setDesaList] = useState<Desa[]>([])
  const [loadingDesa, setLoadingDesa] = useState(false)

  // Animation variants for the loading icon
  const pulseAnimation = {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.7, 1, 0.7],
      transition: {
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      },
    },
  }

  useEffect(() => {
    const validateUserAccess = () => {
      try {
        const userJson = localStorage.getItem("user")

        if (!userJson) {
          window.location.href = "/"
          return
        }

        const user = JSON.parse(userJson) as UserData
        const allowedRoles = ROLE_CONFIGURATIONS[user.role.toLowerCase()] || ["WARGA"]

        setAvailableRoles(allowedRoles)
        setFormData((prev) => ({ ...prev, role: allowedRoles[0], desaId: user.desaId }))
        setCurrentUser(user)
        setIsSuperAdmin(user.role.toLowerCase() === "superadmin")
        
        // If superadmin, fetch the list of desa
        if (user.role.toLowerCase() === "superadmin") {
          fetchDesaList()
        }
      } catch (err) {
        window.location.href = "/"
      }
    }

    validateUserAccess()
  }, [])

  // Function to fetch desa list
  const fetchDesaList = async () => {
    setLoadingDesa(true)
    try {
      const response = await fetch(`${API_URL}/api/desa`, {
        headers: {
          "x-user-role": "superadmin",
        },
      })
      
      if (!response.ok) {
        throw new Error("Failed to fetch desa list")
      }
      
      const data = await response.json()
      setDesaList(data)
    } catch (error) {
      setNotification({
        message: error instanceof Error ? error.message : "Failed to load desa list",
        type: "error",
      })
    } finally {
      setLoadingDesa(false)
    }
  }

  useEffect(() => {
    setPasswordErrors(validatePassword(formData.password))
  }, [formData.password])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const clearForm = () => {
    setFormData((prev) => ({
      ...prev,
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      nama: "",
      kecamatan: "",
      kabupaten: "",
      provinsi: "",
    }))
  }

  // Ubah fungsi handleDesaCreation
  const handleDesaCreation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setNotification(null)

    try {
      if (!currentUser?.id) {
        throw new Error("Creator ID not found")
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match")
      }

      if (passwordErrors.length > 0) {
        throw new Error("Password does not meet requirements")
      }

      if (formData.role === "ADMIN") {
        // For superadmin creating admin, check if creating new desa or selecting existing one
        if (!desaCreated && !newDesaId) {
          // If creating new desa
          if (formData.nama) {
            // Validate desa fields if creating a new desa
            if (!formData.nama || !formData.kecamatan || !formData.kabupaten || !formData.provinsi) {
              throw new Error("All desa information fields are required for new desa creation")
            }

            const generatedDesaId = uuidv4()

            // Perbarui permintaan API untuk pembuatan desa
            const desaResponse = await fetch(`${API_URL}/api/desa`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-user-role": currentUser.role,
              },
              body: JSON.stringify({
                id: generatedDesaId,
                nama: formData.nama,
                kecamatan: formData.kecamatan,
                kabupaten: formData.kabupaten,
                provinsi: formData.provinsi,
              }),
            })

            if (!desaResponse.ok) {
              const errorData = await desaResponse.json()
              throw new Error(errorData.message || `Desa creation failed: ${desaResponse.statusText}`)
            }

            // Store the new desa ID and mark desa as created
            setNewDesaId(generatedDesaId)
            setDesaCreated(true)
            setNotification({
              message: "Desa berhasil dibuat! Silahkan klik tombol Register untuk menyelesaikan pendaftaran admin.",
              type: "success",
            })
          } else if (formData.desaId) {
            // Using existing desa, proceed to registration
            setNewDesaId(formData.desaId)
            setDesaCreated(true)
            handleUserRegistration()
          } else {
            throw new Error("Pilih desa yang sudah ada atau buat desa baru")
          }
        } else {
          // If desa already created or selected, proceed to registration
          handleUserRegistration()
        }
      } else {
        // Untuk peran non-admin, lanjutkan langsung ke pendaftaran
        handleUserRegistration()
      }
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Desa creation failed. Please try again.",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  // Ubah fungsi handleUserRegistration
  const handleUserRegistration = async () => {
    setLoading(true)
    setNotification(null)

    try {
      // Registration data preparation according to the specified structure
      const registrationData = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role,
        desaId: formData.role === "ADMIN" && newDesaId ? newDesaId : formData.desaId,
      }

      // Perbarui permintaan API untuk pendaftaran pengguna
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": currentUser?.role || "",
        },
        body: JSON.stringify(registrationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Registration failed: ${response.statusText}`)
      }

      setNotification({ message: "Account created successfully!", type: "success" })
      clearForm()
      setDesaCreated(false)
      setNewDesaId("")
    } catch (err) {
      setNotification({
        message: err instanceof Error ? err.message : "Registration failed. Please try again.",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderInput = (
    type: string,
    icon: React.ReactNode,
    label: string,
    name: keyof FormData,
    placeholder: string,
    required = true,
  ) => (
    <div className="relative">
      <label htmlFor={name} className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center border rounded-lg overflow-hidden hover:border-green-500 transition-colors">
        <div className="p-3 bg-green-50">{icon}</div>
        <input
          type={
            type === "password"
              ? (name === "password" ? showPassword : showConfirmPassword)
                ? "text"
                : "password"
              : type
          }
          id={name}
          name={name}
          className="w-full px-4 py-2 focus:outline-none bg-white"
          placeholder={placeholder}
          value={formData[name] as string}
          onChange={handleInputChange}
          required={required}
        />
        {type === "password" && (
          <button
            type="button"
            className="p-3 bg-green-50 text-gray-500 hover:text-gray-700"
            onClick={() =>
              name === "password" ? setShowPassword(!showPassword) : setShowConfirmPassword(!showConfirmPassword)
            }
          >
            {(name === "password" ? showPassword : showConfirmPassword) ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 via-green-200 to-green-300 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative"
      >
        <button
          onClick={() => window.history.back()}
          className="absolute top-4 left-4 p-2 bg-green-100 rounded-full text-green-700 hover:bg-green-200 transition-colors"
          type="button"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex items-center justify-center mb-6">
          <Leaf className="text-green-500 mr-2" size={24} />
          <h1 className="text-3xl font-bold text-green-800">Create Account</h1>
        </div>

        {currentUser && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-800">
              <UserPlus size={16} />
              <span>Creating as: </span>
              <span className="font-semibold">{currentUser.username}</span>
              <span className="px-2 py-1 bg-green-200 rounded-full text-xs uppercase">{currentUser.role}</span>
            </div>
          </div>
        )}

        {/* Replace the form onSubmit handler and add a second button for registration */}
        <form onSubmit={handleDesaCreation} className="space-y-6">
          {renderInput("email", <Mail size={20} className="text-green-600" />, "Email", "email", "Enter your email")}
          {renderInput(
            "text",
            <User size={20} className="text-green-600" />,
            "Username",
            "username",
            "Choose a username",
          )}
          {renderInput(
            "password",
            <Lock size={20} className="text-green-600" />,
            "Password",
            "password",
            "Enter your password",
          )}
          {renderInput(
            "password",
            <Lock size={20} className="text-green-600" />,
            "Confirm Password",
            "confirmPassword",
            "Confirm your password",
          )}

          {passwordErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-500 mt-2"
            >
              <ul className="list-disc list-inside">
                {passwordErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </motion.div>
          )}

          <div className="relative">
            <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
              Role
            </label>
            <div className="flex items-center border rounded-lg overflow-hidden hover:border-green-500 transition-colors">
              <div className="p-3 bg-green-50">
                <User size={20} className="text-green-600" />
              </div>
              <select
                id="role"
                name="role"
                className="w-full px-4 py-2 focus:outline-none bg-white"
                value={formData.role}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a role</option>
                {availableRoles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desa selection - only show when superadmin is creating a user (admin or warga) */}
          {isSuperAdmin && formData.role && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-3 border-t border-green-100"
            >
              <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                <Home size={16} />
                {formData.role === "ADMIN" ? "Pilih atau Buat Desa Baru" : "Pilih Desa"}
              </h3>

              {/* Desa selection dropdown */}
              <div className="relative">
                <label htmlFor="desaId" className="block text-sm font-semibold text-gray-700 mb-2">
                  {formData.role === "ADMIN" ? "Pilih Desa (Opsional)" : "Pilih Desa"}
                </label>
                <div className="flex items-center border rounded-lg overflow-hidden hover:border-green-500 transition-colors">
                  <div className="p-3 bg-green-50">
                    <MapPin size={20} className="text-green-600" />
                  </div>
                  <select
                    id="desaId"
                    name="desaId"
                    className="w-full px-4 py-2 focus:outline-none bg-white"
                    value={formData.desaId}
                    onChange={handleInputChange}
                    required={formData.role !== "ADMIN"}
                    disabled={loadingDesa}
                  >
                    <option value="">Pilih Desa</option>
                    {desaList.map((desa) => (
                      <option key={desa.id} value={desa.id}>
                        {desa.nama} - {desa.kecamatan}, {desa.kabupaten}
                      </option>
                    ))}
                  </select>
                  {loadingDesa && (
                    <div className="p-3 bg-green-50">
                      <Loader size={20} className="text-green-600 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              {/* Create new desa fields - only for ADMIN role */}
              {formData.role === "ADMIN" && (
                <>
                  <div className="relative pt-2">
                    <div className="flex items-center">
                      <hr className="flex-grow border-t border-gray-200" />
                      <span className="px-3 text-xs text-gray-500">ATAU BUAT DESA BARU</span>
                      <hr className="flex-grow border-t border-gray-200" />
                    </div>
                  </div>

                  {renderInput(
                    "text",
                    <Home size={20} className="text-green-600" />,
                    "Nama Desa",
                    "nama",
                    "Masukkan nama desa",
                    false
                  )}

                  {renderInput(
                    "text",
                    <MapPin size={20} className="text-green-600" />,
                    "Kecamatan",
                    "kecamatan",
                    "Masukkan kecamatan",
                    false
                  )}

                  {renderInput(
                    "text",
                    <Building size={20} className="text-green-600" />,
                    "Kabupaten",
                    "kabupaten",
                    "Masukkan kabupaten",
                    false
                  )}

                  {renderInput(
                    "text",
                    <MapPin size={20} className="text-green-600" />,
                    "Provinsi",
                    "provinsi",
                    "Masukkan provinsi",
                    false
                  )}
                </>
              )}
            </motion.div>
          )}

          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

          {formData.role === "ADMIN" && !desaCreated && formData.nama ? (
            <motion.button
              type="submit"
              className="w-full py-3 px-6 font-semibold rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-70"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div className="flex items-center justify-center" variants={pulseAnimation} animate="animate">
                    <Home size={20} className="text-white" />
                  </motion.div>
                  <span>Membuat Desa...</span>
                </span>
              ) : (
                "Buat Desa"
              )}
            </motion.button>
          ) : formData.role === "ADMIN" && desaCreated ? (
            <motion.button
              type="button"
              onClick={handleUserRegistration}
              className="w-full py-3 px-6 font-semibold rounded-lg shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-70"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div className="flex items-center justify-center" variants={pulseAnimation} animate="animate">
                    <UserPlus size={20} className="text-white" />
                  </motion.div>
                  <span>Memuat register...</span>
                </span>
              ) : (
                "Register Admin"
              )}
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              className="w-full py-3 px-6 font-semibold rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-70"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.div className="flex items-center justify-center" variants={pulseAnimation} animate="animate">
                    <UserPlus size={20} className="text-white" />
                  </motion.div>
                  <span>Memuat register...</span>
                </span>
              ) : (
                "Create Account"
              )}
            </motion.button>
          )}
        </form>
      </motion.div>
    </div>
  )
}