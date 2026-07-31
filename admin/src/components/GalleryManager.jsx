import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react'

export default function GalleryManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newImage, setNewImage] = useState({ category: 'Annual Day', image_url: '' })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchGallery()
  }, [])

  const fetchGallery = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Error fetching gallery:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newImage.image_url) return
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('gallery')
        .insert([newImage])

      if (error) throw error
      setMessage('Photo added to gallery!')
      setNewImage({ category: 'Annual Day', image_url: '' })
      fetchGallery()
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      console.error('Error adding photo:', err.message)
      setMessage('Error adding photo. Check Supabase connection.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this photo?')) return

    try {
      const { error } = await supabase
        .from('gallery')
        .delete()
        .eq('id', id)

      if (error) throw error
      setItems(items.filter(item => item.id !== id))
    } catch (err) {
      console.error('Error deleting photo:', err.message)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading gallery photos...</div>

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-dark">
          <Plus size={20} /> Add New Event Photo
        </h2>
        {message && (
          <div className={`p-3 rounded-lg text-sm mb-4 font-semibold ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-4 align-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={newImage.category}
              onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2.5"
            >
              <option value="Annual Day">Annual Day</option>
              <option value="Sports Day">Sports Day</option>
              <option value="Art & Craft">Art & Craft</option>
              <option value="Celebrations">Cultural Fests</option>
              <option value="Activities">Learning & Play</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              placeholder="https://..."
              value={newImage.image_url}
              onChange={(e) => setNewImage({ ...newImage, image_url: e.target.value })}
              className="w-full border border-gray-200 rounded-lg p-2.5"
              required
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-primary text-dark font-bold py-2.5 px-4 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={18} /> {saving ? 'Adding...' : 'Add to Gallery'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-dark">
          <ImageIcon size={20} /> Current Gallery Photos ({items.length})
        </h2>
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">No photos uploaded to database yet. The public site is currently displaying high-resolution default past event photos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {items.map((item) => (
              <div key={item.id} className="relative group border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <img src={item.image_url} alt={item.category} className="w-full h-48 object-cover" />
                <div className="p-3 bg-white flex justify-between items-center">
                  <span className="text-xs font-bold px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-full">{item.category}</span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
