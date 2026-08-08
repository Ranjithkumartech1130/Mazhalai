import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Trash2, Edit3, Save, X, BookOpen, Smile, FileText, Layers } from 'lucide-react'

const emptyForm = {
  title: '',
  age_group: '',
  description: '',
  icon: '🌱',
  tags: '',
}

export default function ProgramsManager() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchPrograms()
  }, [])

  const fetchPrograms = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      setPrograms(data || [])
    } catch (err) {
      showMessage(`Error fetching programs: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.title || !form.age_group || !form.description) {
      showMessage('Title, Age Group, and Description are required.', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('programs').insert([
        {
          title: form.title,
          age_group: form.age_group,
          description: form.description,
          icon: form.icon || '🌱',
          tags: form.tags || '',
        },
      ])

      if (error) throw error
      showMessage('Program card created successfully!', 'success')
      setForm(emptyForm)
      fetchPrograms()
    } catch (err) {
      showMessage(`Failed to create program: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (prog) => {
    setEditingId(prog.id)
    setEditForm({
      title: prog.title || '',
      age_group: prog.age_group || '',
      description: prog.description || '',
      icon: prog.icon || '🌱',
      tags: prog.tags || '',
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async (prog) => {
    if (!editForm.title || !editForm.age_group || !editForm.description) {
      showMessage('Title, Age Group, and Description are required.', 'error')
      return
    }
    try {
      const { error } = await supabase
        .from('programs')
        .update({
          title: editForm.title,
          age_group: editForm.age_group,
          description: editForm.description,
          icon: editForm.icon || '🌱',
          tags: editForm.tags || '',
        })
        .eq('id', prog.id)

      if (error) throw error
      showMessage('Program card updated successfully!', 'success')
      cancelEdit()
      fetchPrograms()
    } catch (err) {
      showMessage(`Update failed: ${err.message}`, 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const prog = deleteConfirm
    setDeleteConfirm(null)
    try {
      const { error } = await supabase.from('programs').delete().eq('id', prog.id)
      if (error) throw error
      setPrograms((prev) => prev.filter((p) => p.id !== prog.id))
      showMessage('Program card deleted.', 'success')
    } catch (err) {
      showMessage(`Delete failed: ${err.message}`, 'error')
    }
  }

  return (
    <div className="space-y-8">
      {/* Messages */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold flex items-center gap-2 ${
            message.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}
        >
          <span>{message.type === 'error' ? '❌' : '✅'}</span> {message.text}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-dark mb-2">Delete Program Card?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently remove "<strong>{deleteConfirm.title}</strong>". This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg border border-gray-200 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Create Form ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Plus size={20} className="text-dark" />
          <h2 className="text-xl font-bold text-dark">Create New Program Card</h2>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Program Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Play Group"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Age Group *</label>
              <input
                type="text"
                required
                placeholder="e.g. 1.5 – 2.5 Years"
                value={form.age_group}
                onChange={(e) => setForm({ ...form, age_group: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Icon (Emoji) *</label>
              <input
                type="text"
                required
                placeholder="e.g. 🌱 or 🚀"
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Sensory Play, Social Skills"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description *</label>
            <textarea
              required
              placeholder="Provide a description of this preschool stage..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus size={18} /> {saving ? 'Adding...' : 'Add Program'}
          </button>
        </form>
      </div>

      {/* ─── Programs List ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-dark flex items-center gap-2">
            <BookOpen size={20} /> Saved Program Cards ({programs.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full mr-3" />
            Loading programs...
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">No programs found in database. Create your first card above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50">
            {programs.map((prog) => (
              <div
                key={prog.id}
                className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                {editingId === prog.id ? (
                  /* Edit inline */
                  <div className="space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-semibold">Title</label>
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold">Age Group</label>
                        <input
                          type="text"
                          value={editForm.age_group}
                          onChange={(e) => setEditForm({ ...editForm, age_group: e.target.value })}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold">Icon</label>
                        <input
                          type="text"
                          value={editForm.icon}
                          onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-semibold">Tags</label>
                        <input
                          type="text"
                          value={editForm.tags}
                          onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold">Description</label>
                      <textarea
                        rows={2}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs resize-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => saveEdit(prog)}
                        className="flex items-center gap-1 bg-primary text-dark font-bold py-1.5 px-3 rounded text-xs hover:bg-yellow-400 cursor-pointer"
                      >
                        <Save size={12} /> Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1 bg-gray-100 text-gray-700 py-1.5 px-3 rounded text-xs hover:bg-gray-200 cursor-pointer"
                      >
                        <X size={12} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display card info */
                  <div className="flex flex-col justify-between h-full space-y-4">
                    <div>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl p-2 bg-yellow-50 border border-yellow-100 rounded-lg">
                            {prog.icon || '🌱'}
                          </span>
                          <div>
                            <h3 className="font-bold text-dark text-base">{prog.title}</h3>
                            <span className="inline-block text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full mt-1">
                              👶 {prog.age_group}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(prog)}
                            className="p-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors cursor-pointer"
                            title="Edit Program"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(prog)}
                            className="p-1.5 border border-gray-200 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                            title="Delete Program"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm mt-3 leading-relaxed">{prog.description}</p>
                    </div>
                    {prog.tags && (
                      <div className="flex flex-wrap gap-1.5 pt-3 border-t border-gray-100">
                        {prog.tags
                          .split(',')
                          .map((t) => t.trim())
                          .filter(Boolean)
                          .map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                      </div>
                    )}
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
