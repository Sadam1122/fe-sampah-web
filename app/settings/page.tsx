"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { FaRecycle, FaEdit, FaTrash,FaCog , FaUsersCog, FaSearch, FaCheck, FaTimes, FaUserPlus } from "react-icons/fa"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import DashboardHeader from "../component/dashboard-header"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import bcrypt from "bcryptjs"
import { useAuth } from "../hook/useAuth"
import DashboardFooter from "../component/dashboard-footer"


const API_URL = process.env.NEXT_PUBLIC_API_URL

// Define type for User
interface User {
  id: string
  email: string
  username: string
  role: "SUPERADMIN" | "ADMIN" | "WARGA"
  desaId?: string
  createdAt: string
  desa?: {
    id: string
    nama: string
  }
}

// Type for edit form
interface EditFormData {
  id: string
  username: string
  email: string
  role: "SUPERADMIN" | "ADMIN" | "WARGA"
  password?: string
}

// Type for create form
interface CreateFormData {
  email: string
  username: string
  role: "ADMIN" | "WARGA"
  password: string
  desaId?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading, logout } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<EditFormData | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [newUser, setNewUser] = useState<CreateFormData>({
    email: "",
    username: "",
    role: "WARGA",
    password: "",
  })

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/")
      } else {
        fetchUsers()
      }
    }
  }, [user, loading, router])

  // Filter users based on search term
  useEffect(() => {
    if (users) {
      const filtered = users.filter(
        (u) =>
          u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  // Fetch users based on role
  const fetchUsers = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      console.log("Fetching users...")

      const res = await fetch(`${API_URL}/api/settings/${user.desaId}`, {
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role,
          "x-user-desa-id": user.desaId,
        },
      })

      if (!res.ok) {
        throw new Error(`Failed to fetch users (Status: ${res.status})`)
      }

      const usersData = await res.json()

      setUsers(usersData)
      setFilteredUsers(usersData)
      setError(null)
    } catch (err: any) {
      console.error("Error fetching users:", err)
      setError(err.message || "Failed to load users.")
      toast.error(err.message || "Failed to load users.")
    } finally {
      setIsLoading(false)
    }
  }

  const openEditModal = (user: User) => {
    setEditingUser({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setEditingUser(null)
  }

  const openDeleteModal = (user: User) => {
    setUserToDelete(user)
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setUserToDelete(null)
  }

  const openCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const closeCreateModal = () => {
    setIsCreateModalOpen(false)
    setNewUser({
      email: "",
      username: "",
      role: "WARGA",
      password: "",
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser || !user) return

    setIsProcessing(true)

    try {
      // Prepare the data to update
      const updateData: any = {
        id: editingUser.id,
        username: editingUser.username,
        email: editingUser.email,
      }

      // Only include password if it's been changed
      if (editingUser.password) {
        updateData.password = await bcrypt.hash(editingUser.password, 10)
      }

      const res = await fetch(`${API_URL}/api/settings/${user.desaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role,
          "x-user-desa-id": user.desaId,
        },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || `Failed to update user (Status: ${res.status})`)
      }

      // Update users state with the edited user
      const updatedUser = await res.json()
      setUsers(users.map((u) => (u.id === editingUser.id ? { ...u, ...updatedUser } : u)))
      toast.success("User updated successfully")
      closeEditModal()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to update user")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!userToDelete || !user) return

    setIsProcessing(true)

    try {
      const res = await fetch(`${API_URL}/api/settings/${user.desaId}?id=${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role,
          "x-user-desa-id": user.desaId,
        },
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || `Failed to delete user (Status: ${res.status})`)
      }

      // Remove user from state
      setUsers(users.filter((u) => u.id !== userToDelete.id))
      toast.success("User deleted successfully")
      closeDeleteModal()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to delete user")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsProcessing(true)

    try {
      // Hash the password before sending
      const hashedPassword = await bcrypt.hash(newUser.password, 10)

      const userData = {
        ...newUser,
        password: hashedPassword,
        role: "WARGA", // Force WARGA role for ADMIN users
        desaId: user.desaId, // Use the current admin's desaId
      }

      const res = await fetch(`${API_URL}/api/settings/${user.desaId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": user.role,
          "x-user-desa-id": user.desaId,
        },
        body: JSON.stringify(userData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || `Failed to create user (Status: ${res.status})`)
      }

      const createdUser = await res.json()

      // Add new user to state
      setUsers([...users, createdUser])
      toast.success("User created successfully")
      closeCreateModal()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Failed to create user")
    } finally {
      setIsProcessing(false)
    }
  }

  if (loading || isLoading) return <LoadingAnimation />
  if (error && !users.length) return <ErrorDisplay message={error} onRetry={fetchUsers} />
  if (!user) return null // This shouldn't happen due to the redirect, but it's here for type safety

  return (
    <>
      <DashboardHeader />
      <ToastContainer position="top-right" autoClose={3000} />

      <motion.div
        className="max-w-6xl mx-auto mt-12 p-8 bg-white shadow-lg rounded-xl border-l-8 border-green-500"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-green-600 mb-4 md:mb-0"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <FaUsersCog className="inline-block mr-3 mb-1" />
            User Management
          </motion.h1>

          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 w-full md:w-auto">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {user.role === "ADMIN" && (
              <motion.button
                className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCreateModal}
              >
                <FaUserPlus className="mr-2" />
                Add User
              </motion.button>
            )}
          </div>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border rounded-lg shadow-md">
              <thead>
                <tr className="bg-green-500 text-white">
                  <th className="p-3">Username</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <motion.tr
                    key={u.id}
                    className="border-b hover:bg-gray-100 transition-colors"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="p-3 font-medium">{u.username}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <motion.button
                          className="text-blue-500 hover:text-blue-700 transition-colors focus:outline-none"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openEditModal(u)}
                          title="Edit User"
                        >
                          <FaEdit className="text-xl" />
                        </motion.button>

                        <motion.button
                          className="text-red-500 hover:text-red-700 transition-colors focus:outline-none"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => openDeleteModal(u)}
                          title="Delete User"
                        >
                          <FaTrash className="text-xl" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <motion.div
            className="text-center py-10 border rounded-lg bg-gray-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <FaSearch className="mx-auto text-4xl text-gray-400 mb-3" />
            <p className="text-gray-500 text-lg">{searchTerm ? "No users match your search" : "No users found"}</p>
          </motion.div>
        )}
      </motion.div>

      {/* Edit User Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <Modal title="Edit User" onClose={closeEditModal}>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={editingUser?.username}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, username: e.target.value } : null))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser?.email}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">New Password (optional)</label>
                <input
                  type="password"
                  value={editingUser?.password || ""}
                  onChange={(e) => setEditingUser((prev) => (prev ? { ...prev, password: e.target.value } : null))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Leave blank to keep current password"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={closeEditModal}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing}
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FaCheck className="mr-2" />
                      Save
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <Modal title="Confirm Delete" onClose={closeDeleteModal}>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <FaTrash className="text-3xl text-red-500" />
                </div>
              </div>
              <p className="text-gray-700 mb-2">Are you sure you want to delete this user:</p>
              <p className="font-bold text-xl mb-1">{userToDelete?.username}</p>
              <p className="text-gray-500">{userToDelete?.email}</p>
              <p className="text-red-500 text-sm mt-4">This action cannot be undone!</p>
            </div>

            <div className="flex justify-center space-x-3">
              <motion.button
                type="button"
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                onClick={closeDeleteModal}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isProcessing}
              >
                <FaTimes className="mr-2 inline-block" />
                Cancel
              </motion.button>

              <motion.button
                type="button"
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center"
                onClick={handleDeleteUser}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete
                  </>
                )}
              </motion.button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <Modal title="Add New User" onClose={closeCreateModal}>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  type="button"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  onClick={closeCreateModal}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing}
                >
                  Cancel
                </motion.button>

                <motion.button
                  type="submit"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FaUserPlus className="mr-2" />
                      Create User
                    </>
                  )}
                </motion.button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
      <br /><br /><br /><br /><br /><br /><br />
      <DashboardFooter />
    </>
  )
}

// Modal Component
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 focus:outline-none">
            <FaTimes />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  )
}

// Loading Animation Component
function LoadingAnimation() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        className="bg-white p-8 rounded-xl shadow-lg flex flex-col items-center"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="relative"
        >
          <FaCog  className="w-16 h-16 text-green-500" />
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          >
            <div className="w-8 h-8 bg-green-500 rounded-full opacity-20"></div>
          </motion.div>
        </motion.div>
        <motion.h2
          className="mt-4 text-2xl font-bold text-green-700"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          Memuat Users...
        </motion.h2>
      </motion.div>
    </div>
  )
}

// Error Display Component
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-6xl mx-auto mt-20 p-8">
      <motion.div
        className="bg-red-50 border-l-4 border-red-500 p-8 rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center mb-4">
          <FaTimes className="text-3xl text-red-500 mr-4" />
          <h2 className="text-2xl font-bold text-red-700">Error</h2>
        </div>
        <p className="text-red-600 text-lg mb-6">{message}</p>
        <motion.button
          onClick={onRetry}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      </motion.div>
    </div>
  )
}

