"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Mail, User, Lock, Eye, EyeOff, UserPlus, Leaf } from "lucide-react"
import Notification from "../component/Notification"
import { motion } from "framer-motion"
import { useAuth } from "../hook/useAuth";
import type React from "react" // Added import for React

interface UserData {
  id: string
  role: string
  username: string
}

interface FormData {
  email: string
  username: string
  password: string
  confirmPassword: string
  role: string
  createdById?: string
  desaId: string;
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
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "",
    desaId: user?.desaId || "",
  })
 useEffect(() => {
    if (user?.desaId) {
      setFormData((prev) => ({ ...prev, desaId: user.desaId }));
    }
  }, [user]);

  const [currentUser, setCurrentUser] = useState<UserData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

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
        setFormData((prev) => ({ ...prev, role: allowedRoles[0] }))
        setCurrentUser(user)
      } catch (err) {
        window.location.href = "/"
      }
    }

    validateUserAccess()
  }, [])

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
    }))
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
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

      // Validate role permissions
      if (currentUser.role === "admin" && formData.role === "ADMIN") {
        throw new Error("Insufficient permissions to create admin accounts")
      }

      const registrationData = {
        email: formData.email.trim(),
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role,
        createdById: currentUser.id, // Explicitly set createdById
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Registration failed: ${response.statusText}`)
      }

      setNotification({ message: "Account created successfully!", type: "success" })
      clearForm()
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
    name: "email" | "username" | "password" | "confirmPassword",
    placeholder: string,
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
          value={formData[name]}
          onChange={handleInputChange}
          required
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
              <span className="px-2 py-1 bg-green-200 rounded-full text-xs">{currentUser.role}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
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

          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}

          <motion.button
            type="submit"
            className="w-full py-3 px-6 font-semibold rounded-lg shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-70"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <motion.span
                  className="inline-block h-5 w-5 border-2 border-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                Processing...
              </span>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

