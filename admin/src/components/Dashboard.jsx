import { useState } from 'react'
import { supabase } from '../supabase'
import { LayoutDashboard, LogOut, Settings, Image as ImageIcon, Users, BookOpen } from 'lucide-react'
import SiteContentForm from './SiteContentForm'
import GalleryManager from './GalleryManager'

export default function Dashboard({ session }) {
  const [activeTab, setActiveTab] = useState('hero')

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'hero':
        return <SiteContentForm />
      case 'programs':
        return <div className="p-8 bg-white rounded-xl shadow-sm border border-gray-100"><h2 className="text-xl font-bold mb-4">Manage Programs</h2><p className="text-gray-500">Program management interface goes here.</p></div>
      case 'gallery':
        return <GalleryManager />
      default:
        return <SiteContentForm />
    }
  }


  return (
    <div className="flex h-screen bg-light">
      {/* Sidebar */}
      <div className="w-64 bg-dark text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-heading font-bold text-primary">Mazhalai Admin</h1>
          <p className="text-sm text-gray-400 mt-1 truncate">{session.user.email}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setActiveTab('hero')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'hero' ? 'bg-primary text-dark font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <Settings size={20} /> Site Settings
          </button>
          
          <button 
            onClick={() => setActiveTab('programs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'programs' ? 'bg-primary text-dark font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <BookOpen size={20} /> Programs
          </button>
          
          <button 
            onClick={() => setActiveTab('gallery')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'gallery' ? 'bg-primary text-dark font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
          >
            <ImageIcon size={20} /> Gallery
          </button>
          
          {/* Add more tabs for facilities, testimonials here */}
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-5">
          <h2 className="text-xl font-bold font-heading text-dark capitalize">
            {activeTab.replace('-', ' ')} Management
          </h2>
        </header>
        
        <main className="p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}
