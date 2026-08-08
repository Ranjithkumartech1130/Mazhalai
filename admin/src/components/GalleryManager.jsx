import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { Trash2, Plus, Image as ImageIcon, Upload, X, Edit3, Save, ChevronDown } from 'lucide-react'

const BUCKET = 'mazhalai-gallery'
const MAX_FILE_SIZE_MB = 8
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

const CATEGORIES = ['Annual Day', 'Sports Day', 'Art & Craft', 'Celebrations', 'Activities']
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i)

const emptyForm = {
  title: '',
  description: '',
  category: 'Activities',
  album: '',
  event_name: '',
  year: CURRENT_YEAR,
  date: '',
}

export default function GalleryManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')
  const fileInputRef = useRef(null)

  useEffect(() => { fetchGallery() }, [])

  // Clean up preview URL on unmount
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const fetchGallery = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gallery')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setItems(data || [])
    } catch (err) {
      showMessage(`Error fetching gallery: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      showMessage('Invalid file type. Please use JPEG, PNG, WebP, or GIF.', 'error')
      return
    }
    // Validate size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showMessage(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`, 'error')
      return
    }

    setSelectedFile(file)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
  }

  const clearFileSelection = () => {
    setSelectedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      showMessage('Please select an image file to upload.', 'error')
      return
    }

    setUploading(true)
    setUploadProgress(10)

    try {
      // 1. Get current user
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        showMessage('Session expired. Please log in again.', 'error')
        return
      }

      // 2. Build a unique storage path
      const ext = selectedFile.name.split('.').pop().toLowerCase()
      const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const storagePath = `gallery/${fileName}`

      setUploadProgress(30)

      // 3. Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: selectedFile.type,
        })

      if (uploadError) throw uploadError
      setUploadProgress(70)

      // 4. Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(storagePath)

      const imageUrl = urlData.publicUrl

      // 5. Insert metadata into database
      const { error: dbError } = await supabase.from('gallery').insert([{
        image_url: imageUrl,
        storage_path: storagePath,
        title: form.title || null,
        description: form.description || null,
        category: form.category,
        album: form.album || null,
        event_name: form.event_name || null,
        year: form.year ? parseInt(form.year) : null,
        date: form.date || null,
        created_by: session.user.id,
      }])

      if (dbError) {
        // If DB insert fails, clean up the uploaded file
        await supabase.storage.from(BUCKET).remove([storagePath])
        throw dbError
      }

      setUploadProgress(100)
      showMessage('Photo uploaded successfully!', 'success')
      setForm(emptyForm)
      clearFileSelection()
      fetchGallery()
    } catch (err) {
      showMessage(`Upload failed: ${err.message}`, 'error')
    } finally {
      setUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'Activities',
      album: item.album || '',
      event_name: item.event_name || '',
      year: item.year || CURRENT_YEAR,
      date: item.date ? item.date.split('T')[0] : '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async (id) => {
    try {
      const { error } = await supabase.from('gallery').update({
        title: editForm.title || null,
        description: editForm.description || null,
        category: editForm.category,
        album: editForm.album || null,
        event_name: editForm.event_name || null,
        year: editForm.year ? parseInt(editForm.year) : null,
        date: editForm.date || null,
      }).eq('id', id)

      if (error) throw error
      showMessage('Photo info updated!', 'success')
      cancelEdit()
      fetchGallery()
    } catch (err) {
      showMessage(`Update failed: ${err.message}`, 'error')
    }
  }

  const confirmDelete = (item) => setDeleteConfirm(item)

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const item = deleteConfirm
    setDeleteConfirm(null)

    try {
      // 1. Delete from storage (if we have the path)
      if (item.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove([item.storage_path])
        if (storageError) console.warn('Storage delete warning:', storageError.message)
      }

      // 2. Delete from database
      const { error } = await supabase.from('gallery').delete().eq('id', item.id)
      if (error) throw error

      setItems(prev => prev.filter(i => i.id !== item.id))
      showMessage('Photo deleted successfully.', 'success')
    } catch (err) {
      showMessage(`Delete failed: ${err.message}`, 'error')
    }
  }

  const filteredItems = filterCategory === 'all'
    ? items
    : items.filter(i => i.category === filterCategory)

  return (
    <div className="space-y-8">

      {/* ─── Global Message ─── */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
          message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          <span>{message.type === 'error' ? '❌' : '✅'}</span> {message.text}
        </div>
      )}

      {/* ─── Delete Confirmation Modal ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-dark mb-2">Delete Photo?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove the photo and its file from storage. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Upload Form ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Upload size={20} className="text-dark" />
          <h2 className="text-xl font-bold text-dark">Upload New Photo</h2>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-5">
          {/* File Drop Zone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Photo File *</label>
            {previewUrl ? (
              <div className="relative inline-block">
                <img src={previewUrl} alt="Preview" className="h-48 w-64 object-cover rounded-xl border-2 border-primary shadow-md" />
                <button type="button" onClick={clearFileSelection}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 shadow">
                  <X size={14} />
                </button>
                <p className="text-xs text-gray-500 mt-1">{selectedFile?.name} ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)</p>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-yellow-50 transition-all group"
              >
                <ImageIcon size={36} className="mx-auto mb-3 text-gray-300 group-hover:text-primary transition-colors" />
                <p className="font-semibold text-gray-500 group-hover:text-dark">Click to choose a photo</p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP, GIF — Max {MAX_FILE_SIZE_MB}MB</p>
              </div>
            )}
            <input
              ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')}
              onChange={handleFileSelect} className="hidden"
            />
          </div>

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Uploading...</span><span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" placeholder="e.g. Annual Day Stage Celebration"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
              <input type="text" placeholder="e.g. Graduation Ceremony 2025"
                value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Album</label>
              <input type="text" placeholder="e.g. Sports Day 2025"
                value={form.album} onChange={e => setForm({ ...form, album: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea placeholder="Brief description shown when hovering the photo on the website..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
            </div>
          </div>

          <button type="submit" disabled={uploading || !selectedFile}
            className="flex items-center gap-2 bg-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            <Upload size={18} />
            {uploading ? 'Uploading...' : 'Upload Photo'}
          </button>
        </form>
      </div>

      {/* ─── Gallery Grid ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-dark flex items-center gap-2">
            <ImageIcon size={20} /> Gallery Photos ({filteredItems.length}{filterCategory !== 'all' ? ` of ${items.length}` : ''})
          </h2>
          {/* Filter by category */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Filter:</label>
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mr-3" />
              Loading photos...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon size={48} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium">No photos found.</p>
              <p className="text-gray-300 text-sm mt-1">Upload your first photo using the form above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map(item => (
                <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-white">
                  <div className="relative h-44 bg-gray-100">
                    <img src={item.image_url} alt={item.title || item.category}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23f3f4f6" width="100" height="100"/><text y="50%" x="50%" text-anchor="middle" font-size="30" fill="%239ca3af">🖼️</text></svg>' }}
                    />
                    <span className="absolute top-2 left-2 text-xs font-bold px-2 py-1 bg-black/70 text-yellow-300 rounded-full">
                      {item.category}
                    </span>
                  </div>

                  {editingId === item.id ? (
                    /* Edit form inline */
                    <div className="p-4 space-y-3">
                      <input type="text" placeholder="Title" value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="text" placeholder="Event Name" value={editForm.event_name}
                        onChange={e => setEditForm({ ...editForm, event_name: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                      <input type="text" placeholder="Album" value={editForm.album}
                        onChange={e => setEditForm({ ...editForm, album: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                      <div className="grid grid-cols-2 gap-2">
                        <select value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select value={editForm.year} onChange={e => setEditForm({ ...editForm, year: e.target.value })}
                          className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary">
                          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <input type="date" value={editForm.date}
                        onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
                      <textarea placeholder="Description" rows={2} value={editForm.description}
                        onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(item.id)}
                          className="flex-1 flex items-center justify-center gap-1 bg-primary text-dark font-bold py-1.5 rounded-lg text-xs hover:bg-yellow-400 transition-colors">
                          <Save size={12} /> Save
                        </button>
                        <button onClick={cancelEdit}
                          className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-700 font-semibold py-1.5 rounded-lg text-xs hover:bg-gray-200 transition-colors">
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display mode */
                    <div className="p-4">
                      <p className="font-bold text-dark text-sm truncate">{item.title || item.event_name || 'No title'}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{[item.album, item.year].filter(Boolean).join(' · ')}</p>
                      {item.date && <p className="text-xs text-gray-400">📅 {new Date(item.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => startEdit(item)}
                          className="flex-1 flex items-center justify-center gap-1 border border-gray-200 text-gray-600 font-semibold py-1.5 rounded-lg text-xs hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
                          <Edit3 size={12} /> Edit Info
                        </button>
                        <button onClick={() => confirmDelete(item)}
                          className="flex items-center justify-center gap-1 border border-gray-200 text-gray-400 font-semibold py-1.5 px-3 rounded-lg text-xs hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
