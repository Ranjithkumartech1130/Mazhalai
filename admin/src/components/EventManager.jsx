import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'
import { Plus, Trash2, Edit3, Save, X, Calendar, Upload, Image as ImageIcon } from 'lucide-react'

const BUCKET = 'mazhalai-gallery'
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_FILE_SIZE_MB = 8

const EVENT_CATEGORIES = ['Annual Day', 'Sports Day', 'Cultural', 'Workshop', 'Graduation', 'Festival', 'General']

const emptyForm = {
  title: '',
  description: '',
  event_date: '',
  category: 'General',
}

export default function EventManager() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editCoverFile, setEditCoverFile] = useState(null)
  const [editCoverPreview, setEditCoverPreview] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const fileInputRef = useRef(null)
  const editFileInputRef = useRef(null)

  useEffect(() => { fetchEvents() }, [])

  const fetchEvents = async () => {
    setLoading(true)

    try {

      const { data: sessionData } = await supabase.auth.getSession()

      console.log("CURRENT SESSION:", sessionData.session)

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })

      console.log("EVENT DATA:", data)
      console.log("EVENT ERROR:", error)

      if (error) throw error

      setEvents(data || [])

    } catch (err) {

      console.log("CATCH ERROR:", err)
      showMessage(`Error fetching events: ${err.message}`, 'error')

    } finally {

      setLoading(false)  

    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  const handleCoverSelect = (e, isEdit = false) => {
    const file = e.target.files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      showMessage('Invalid file type. Use JPEG, PNG or WebP.', 'error'); return
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showMessage(`File too large. Max ${MAX_FILE_SIZE_MB}MB.`, 'error'); return
    }
    const preview = URL.createObjectURL(file)
    if (isEdit) {
      setEditCoverFile(file)
      setEditCoverPreview(preview)
    } else {
      setCoverFile(file)
      setCoverPreview(preview)
    }
  }

  const uploadCoverImage = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    const fileName = `events/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    })
    if (error) throw error
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return { imageUrl: urlData.publicUrl, imagePath: fileName }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title || !form.event_date) {
      showMessage('Title and Event Date are required.', 'error'); return
    }
    setSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { showMessage('Session expired. Please log in again.', 'error'); return }

      let coverImageUrl = null
      let coverImagePath = null

      if (coverFile) {
        const { imageUrl, imagePath } = await uploadCoverImage(coverFile)
        coverImageUrl = imageUrl
        coverImagePath = imagePath
      }

      const { error } = await supabase.from('events').insert([{
        title: form.title,
        description: form.description || null,
        event_date: form.event_date,
        category: form.category,
        cover_image_url: coverImageUrl,
        cover_image_path: coverImagePath,
        created_by: session.user.id,
      }])

      if (error) throw error
      showMessage('Event created successfully!', 'success')
      setForm(emptyForm)
      setCoverFile(null)
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      setCoverPreview(null)
      fetchEvents()
    } catch (err) {
      showMessage(`Failed to create event: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (ev) => {
    setEditingId(ev.id)
    setEditForm({
      title: ev.title || '',
      description: ev.description || '',
      event_date: ev.event_date ? ev.event_date.split('T')[0] : '',
      category: ev.category || 'General',
    })
    setEditCoverFile(null)
    setEditCoverPreview(ev.cover_image_url || null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
    setEditCoverFile(null)
    setEditCoverPreview(null)
  }

  const saveEdit = async (ev) => {
    if (!editForm.title || !editForm.event_date) {
      showMessage('Title and Event Date are required.', 'error'); return
    }
    try {
      let coverImageUrl = ev.cover_image_url
      let coverImagePath = ev.cover_image_path

      if (editCoverFile) {
        // Delete old cover if exists
        if (ev.cover_image_path) {
          await supabase.storage.from(BUCKET).remove([ev.cover_image_path])
        }
        const { imageUrl, imagePath } = await uploadCoverImage(editCoverFile)
        coverImageUrl = imageUrl
        coverImagePath = imagePath
      }

      const { error } = await supabase.from('events').update({
        title: editForm.title,
        description: editForm.description || null,
        event_date: editForm.event_date,
        category: editForm.category,
        cover_image_url: coverImageUrl,
        cover_image_path: coverImagePath,
      }).eq('id', ev.id)

      if (error) throw error
      showMessage('Event updated!', 'success')
      cancelEdit()
      fetchEvents()
    } catch (err) {
      showMessage(`Update failed: ${err.message}`, 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const ev = deleteConfirm
    setDeleteConfirm(null)
    try {
      if (ev.cover_image_path) {
        await supabase.storage.from(BUCKET).remove([ev.cover_image_path])
      }
      const { error } = await supabase.from('events').delete().eq('id', ev.id)
      if (error) throw error
      setEvents(prev => prev.filter(e => e.id !== ev.id))
      showMessage('Event deleted.', 'success')
    } catch (err) {
      showMessage(`Delete failed: ${err.message}`, 'error')
    }
  }

  return (
    <div className="space-y-8">

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
          <span>{message.type === 'error' ? '❌' : '✅'}</span> {message.text}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-dark mb-2">Delete Event?</h3>
            <p className="text-gray-500 text-sm mb-6">This will permanently remove "<strong>{deleteConfirm.title}</strong>" and its cover image. Cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 font-semibold hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Event Form ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Plus size={20} className="text-dark" />
          <h2 className="text-xl font-bold text-dark">Create New Event</h2>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Event Title *</label>
              <input type="text" required placeholder="e.g. Annual Sports Day 2025"
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Event Date *</label>
              <input type="date" required value={form.event_date}
                onChange={e => setForm({ ...form, event_date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cover Image</label>
              {coverPreview ? (
                <div className="relative inline-block">
                  <img src={coverPreview} alt="Cover" className="h-20 w-32 object-cover rounded-lg border" />
                  <button type="button" onClick={() => { setCoverFile(null); URL.revokeObjectURL(coverPreview); setCoverPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-500 hover:border-primary hover:text-dark transition-all w-full">
                  <Upload size={16} /> Choose cover image
                </button>
              )}
              <input ref={fileInputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={e => handleCoverSelect(e, false)} className="hidden" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea placeholder="What happened at this event? (shown on the website)"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors disabled:opacity-50">
            <Plus size={18} /> {saving ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>

      {/* ─── Events List ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-dark flex items-center gap-2">
            <Calendar size={20} /> All Events ({events.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full mr-3" />
            Loading events...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">No events yet. Create your first event above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {events.map(ev => (
              <div key={ev.id} className="p-5">
                {editingId === ev.id ? (
                  /* Edit inline */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input type="text" placeholder="Title" value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <input type="date" value={editForm.event_date}
                        onChange={e => setEditForm({ ...editForm, event_date: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <select value={editForm.category}
                        onChange={e => setEditForm({ ...editForm, category: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div>
                        {editCoverPreview ? (
                          <div className="relative inline-block">
                            <img src={editCoverPreview} alt="Cover" className="h-14 w-24 object-cover rounded border" />
                            <button type="button" onClick={() => { setEditCoverFile(null); setEditCoverPreview(null); if (editFileInputRef.current) editFileInputRef.current.value = '' }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
                              <X size={8} />
                            </button>
                          </div>
                        ) : (
                          <button type="button" onClick={() => editFileInputRef.current?.click()}
                            className="flex items-center gap-1 border border-dashed border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-500 hover:border-primary transition-all">
                            <Upload size={12} /> Change cover
                          </button>
                        )}
                        <input ref={editFileInputRef} type="file" accept={ALLOWED_TYPES.join(',')}
                          onChange={e => handleCoverSelect(e, true)} className="hidden" />
                      </div>
                    </div>
                    <textarea placeholder="Description" rows={2} value={editForm.description}
                      onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(ev)}
                        className="flex items-center gap-1 bg-primary text-dark font-bold py-2 px-4 rounded-lg text-sm hover:bg-yellow-400 transition-colors">
                        <Save size={14} /> Save
                      </button>
                      <button onClick={cancelEdit}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex items-start gap-4">
                    {ev.cover_image_url ? (
                      <img src={ev.cover_image_url} alt={ev.title} className="w-20 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar size={24} className="text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-dark">{ev.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs font-semibold px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full">{ev.category}</span>
                            <span className="text-xs text-gray-400">
                              📅 {new Date(ev.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                          </div>
                          {ev.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ev.description}</p>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => startEdit(ev)}
                            className="flex items-center gap-1 border border-gray-200 text-gray-600 py-1.5 px-3 rounded-lg text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors">
                            <Edit3 size={12} /> Edit
                          </button>
                          <button onClick={() => setDeleteConfirm(ev)}
                            className="flex items-center gap-1 border border-gray-200 text-gray-400 py-1.5 px-3 rounded-lg text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
