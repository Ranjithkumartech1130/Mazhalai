import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Plus, Trash2, Edit3, Save, X, Quote, Star, Eye, EyeOff, ExternalLink } from 'lucide-react'

const GOOGLE_REVIEW_URL = 'https://g.page/r/CVHVz5U0aXOgEAE/review'

const emptyForm = {
  parent_name: '',
  review: '',
  rating: 5,
  is_featured: true,
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="cursor-pointer"
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={22}
            className={n <= value ? 'text-yellow-400' : 'text-gray-200'}
            fill={n <= value ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setTestimonials(data || [])
    } catch (err) {
      showMessage(`Error fetching testimonials: ${err.message}`, 'error')
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
    if (!form.parent_name || !form.review) {
      showMessage('Parent name and review text are required.', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('testimonials').insert([
        {
          parent_name: form.parent_name,
          review: form.review,
          rating: form.rating || 5,
          is_featured: form.is_featured,
        },
      ])

      if (error) throw error
      showMessage('Testimonial added successfully!', 'success')
      setForm(emptyForm)
      fetchTestimonials()
    } catch (err) {
      showMessage(`Failed to add testimonial: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (t) => {
    setEditingId(t.id)
    setEditForm({
      parent_name: t.parent_name || '',
      review: t.review || '',
      rating: t.rating || 5,
      is_featured: t.is_featured,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const saveEdit = async (t) => {
    if (!editForm.parent_name || !editForm.review) {
      showMessage('Parent name and review text are required.', 'error')
      return
    }
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({
          parent_name: editForm.parent_name,
          review: editForm.review,
          rating: editForm.rating || 5,
          is_featured: editForm.is_featured,
        })
        .eq('id', t.id)

      if (error) throw error
      showMessage('Testimonial updated successfully!', 'success')
      cancelEdit()
      fetchTestimonials()
    } catch (err) {
      showMessage(`Update failed: ${err.message}`, 'error')
    }
  }

  const toggleFeatured = async (t) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_featured: !t.is_featured })
        .eq('id', t.id)
      if (error) throw error
      setTestimonials((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, is_featured: !item.is_featured } : item))
      )
    } catch (err) {
      showMessage(`Failed to update visibility: ${err.message}`, 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const t = deleteConfirm
    setDeleteConfirm(null)
    try {
      const { error } = await supabase.from('testimonials').delete().eq('id', t.id)
      if (error) throw error
      setTestimonials((prev) => prev.filter((item) => item.id !== t.id))
      showMessage('Testimonial deleted.', 'success')
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

      {/* Google reviews helper banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-900">
        <Quote size={20} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Copying reviews from Google?</p>
          <p className="text-blue-800/80 mt-0.5">
            We don't have a paid Google API connected, so reviews aren't pulled in automatically. Open the
            business's Google review page, copy a parent's name and review text, then paste them into the form
            below to publish it on the website.
          </p>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 font-semibold text-blue-700 hover:text-blue-900 underline underline-offset-2"
          >
            Open Google Reviews page <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {/* ─── Create Form ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Plus size={20} className="text-dark" />
          <h2 className="text-xl font-bold text-dark">Add Parent Testimonial</h2>
        </div>
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Priya S."
                value={form.parent_name}
                onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Rating *</label>
              <StarPicker value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Review Text *</label>
            <textarea
              required
              placeholder="Paste the parent's review here..."
              value={form.review}
              onChange={(e) => setForm({ ...form, review: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            Show on website immediately
          </label>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-dark text-white font-bold py-3 px-6 rounded-xl hover:bg-black transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Plus size={18} /> {saving ? 'Adding...' : 'Add Testimonial'}
          </button>
        </form>
      </div>

      {/* ─── Testimonials List ─── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-xl font-bold text-dark flex items-center gap-2">
            <Quote size={20} /> Saved Testimonials ({testimonials.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full mr-3" />
            Loading testimonials...
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12">
            <Quote size={48} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">No testimonials yet. Add your first parent review above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className={`bg-white rounded-xl p-5 border shadow-sm flex flex-col justify-between ${
                  t.is_featured ? 'border-gray-200' : 'border-gray-200 opacity-60'
                }`}
              >
                {editingId === t.id ? (
                  /* Edit inline */
                  <div className="space-y-3 flex-1">
                    <div>
                      <label className="text-xs text-gray-500 font-semibold">Parent Name</label>
                      <input
                        type="text"
                        value={editForm.parent_name}
                        onChange={(e) => setEditForm({ ...editForm, parent_name: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">Rating</label>
                      <StarPicker value={editForm.rating} onChange={(n) => setEditForm({ ...editForm, rating: n })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-semibold">Review</label>
                      <textarea
                        rows={2}
                        value={editForm.review}
                        onChange={(e) => setEditForm({ ...editForm, review: e.target.value })}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs resize-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => saveEdit(t)}
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
                        <div>
                          <h3 className="font-bold text-dark text-base">{t.parent_name}</h3>
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                size={14}
                                className={n <= (t.rating || 5) ? 'text-yellow-400' : 'text-gray-200'}
                                fill={n <= (t.rating || 5) ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleFeatured(t)}
                            className="p-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors cursor-pointer"
                            title={t.is_featured ? 'Hide from website' : 'Show on website'}
                          >
                            {t.is_featured ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                          <button
                            onClick={() => startEdit(t)}
                            className="p-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-sky-50 hover:text-sky-700 hover:border-sky-200 transition-colors cursor-pointer"
                            title="Edit Testimonial"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(t)}
                            className="p-1.5 border border-gray-200 text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors cursor-pointer"
                            title="Delete Testimonial"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-500 text-sm mt-3 leading-relaxed">&ldquo;{t.review}&rdquo;</p>
                    </div>
                    {!t.is_featured && (
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded w-fit">
                        Hidden from website
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-dark mb-2">Delete Testimonial?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently remove the review from "<strong>{deleteConfirm.parent_name}</strong>". This
              action cannot be undone.
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
    </div>
  )
}
