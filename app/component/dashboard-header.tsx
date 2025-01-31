'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FaRecycle, FaUser, FaCog, FaSignOutAlt, FaBars } from 'react-icons/fa'

export default function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-gradient-to-r from-green-600 to-emerald-500 py-4 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <FaRecycle className="text-white text-3xl" />
            <span className="text-2xl font-bold text-white">WasteMate</span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <NavLink href="/dashboard" icon={<FaRecycle />}>Dashboard</NavLink>
            <NavLink href="/profile" icon={<FaUser />}>Profile</NavLink>
            <NavLink href="/settings" icon={<FaCog />}>Settings</NavLink>
            <NavLink href="/logout" icon={<FaSignOutAlt />}>Logout</NavLink>
          </nav>
          <button
            className="md:hidden text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <FaBars className="text-2xl" />
          </button>
        </div>
        {isMenuOpen && (
          <nav className="mt-4 flex flex-col space-y-2 md:hidden">
            <NavLink href="/dashboard" icon={<FaRecycle />}>Dashboard</NavLink>
            <NavLink href="/profile" icon={<FaUser />}>Profile</NavLink>
            <NavLink href="/settings" icon={<FaCog />}>Settings</NavLink>
            <NavLink href="/logout" icon={<FaSignOutAlt />}>Logout</NavLink>
          </nav>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-2 text-white hover:text-green-200 transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

