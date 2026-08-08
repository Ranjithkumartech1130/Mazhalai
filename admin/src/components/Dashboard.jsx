import { useState } from 'react'
import { supabase } from '../supabase'
import { LayoutDashboard, LogOut, Settings, Image as ImageIcon, Calendar, BookOpen, ExternalLink } from 'lucide-react'
import SiteContentForm from './SiteContentForm'
import GalleryManager from './GalleryManager'
import EventManager from './EventManager'
import ProgramsManager from './ProgramsManager'

export default function Dashboard({ session }) {
  const [activeTab, setActiveTab] = useState('gallery')

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const handleExitAndSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '../index.html'
  }

  const navItems = [
    { id: 'gallery',  label: 'Gallery',        icon: ImageIcon },
    { id: 'events',   label: 'Events',          icon: Calendar },
    { id: 'settings', label: 'Site Settings',   icon: Settings },
    { id: 'programs', label: 'Programs',        icon: BookOpen },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'gallery':  return <GalleryManager />
      case 'events':   return <EventManager />
      case 'settings': return <SiteContentForm />
      case 'programs':
        return <ProgramsManager />
      default:
        return <GalleryManager />
    }
  }

  return (
    <div className="flex h-screen bg-light">
      {/* ─── Sidebar ─── */}
      <div className="w-64 bg-dark text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-heading font-bold text-primary leading-tight">Mazhalai Admin</h1>
          <p className="text-xs text-gray-400 mt-1 truncate">👤 {session.user.email}</p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm font-medium ${
                activeTab === id
                  ? 'bg-primary text-dark font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-2">
          {/* Back to website */}
          <button
            onClick={handleExitAndSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium cursor-pointer"
          >
            <ExternalLink size={16} /> View Website
          </button>
          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-auto flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-heading text-dark capitalize">
              {navItems.find(n => n.id === activeTab)?.label || 'Dashboard'}
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
              Mazhalai Admin Panel
            </span>
          </div>
        </header>

        <main className="p-6 lg:p-8 flex-1">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
