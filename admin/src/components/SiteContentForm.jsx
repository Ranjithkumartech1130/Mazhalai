import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { Upload, Image as ImageIcon } from 'lucide-react'

const IMAGE_BUCKET = 'mazhalai-gallery'
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE_MB = 8

export default function SiteContentForm() {
  const [formData, setFormData] = useState({
  hero_title: '',
  hero_subtitle: '',
  phone: '',
  email: '',
  address: '',
  hero_image_url: '',
  about_image_url: ''
})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingAbout, setUploadingAbout] = useState(false)

  useEffect(() => {
    fetchContent()
  }, [])

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('id', 1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (data) {
        setFormData(data)
      }
    } catch (error) {
      console.error('Error fetching content:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const uploadImage = async (file, fieldName, setUploading) => {
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMessage('Error: Invalid file type. Please use JPEG, PNG, WebP, or GIF.')
      return
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setMessage(`Error: File is too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`)
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setMessage('Error: Session expired. Please log in again.')
        return
      }

      const ext = file.name.split('.').pop().toLowerCase()
      const storagePath = `site/${fieldName}_${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(IMAGE_BUCKET)
        .upload(storagePath, file, { cacheControl: '3600', upsert: false, contentType: file.type })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath)

      setFormData(prev => ({ ...prev, [fieldName]: urlData.publicUrl }))
      setMessage('Image uploaded — click Save Changes below to publish it on the site.')
    } catch (error) {
      setMessage(`Error: Upload failed - ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({ id: 1, ...formData })

      if (error) throw error
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error saving:', error.message)
      setMessage(`Error saving settings: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8">Loading settings...</div>

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-dark">Global Website Settings</h2>
        {message && (
          <span className={`px-4 py-2 rounded-lg text-sm font-bold ${message.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
            {message}
          </span>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* Hero Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Hero Section</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Title</label>
            <input
              type="text"
              name="hero_title"
              value={formData.hero_title || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Subtitle</label>
            <textarea
              name="hero_subtitle"
              value={formData.hero_subtitle || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Hero Image (Home page banner photo)</label>
            <div className="flex items-center gap-4">
              {formData.hero_image_url ? (
                <img src={formData.hero_image_url} alt="Hero preview" className="h-24 w-32 object-cover rounded-lg border border-gray-200" />
              ) : (
                <div className="h-24 w-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                  <ImageIcon size={24} />
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                <Upload size={16} />
                {uploadingHero ? 'Uploading...' : 'Choose Photo'}
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  className="hidden"
                  disabled={uploadingHero}
                  onChange={(e) => uploadImage(e.target.files[0], 'hero_image_url', setUploadingHero)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">About Section</h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">About Image (classroom photo)</label>
            <div className="flex items-center gap-4">
              {formData.about_image_url ? (
                <img src={formData.about_image_url} alt="About preview" className="h-24 w-32 object-cover rounded-lg border border-gray-200" />
              ) : (
                <div className="h-24 w-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                  <ImageIcon size={24} />
                </div>
              )}
              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                <Upload size={16} />
                {uploadingAbout ? 'Uploading...' : 'Choose Photo'}
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  className="hidden"
                  disabled={uploadingAbout}
                  onChange={(e) => uploadImage(e.target.files[0], 'about_image_url', setUploadingAbout)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
            <textarea
              name="address"
              value={formData.address || ''}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-primary text-dark font-bold py-3 px-8 rounded-lg hover:bg-[#F7D000] transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
