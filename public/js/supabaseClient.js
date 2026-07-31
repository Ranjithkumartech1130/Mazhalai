// Initialize Supabase Client
// Replace these with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Fetch Site Content
async function fetchSiteContent() {
    // Return early if no real supabase URL is provided
    if (SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') return;

    try {
        const { data, error } = await supabaseClient
            .from('site_content')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching site content:', error);
            return;
        }

        if (data) {
            // Update DOM Elements
            const heroTitle = document.getElementById('hero-title');
            if (heroTitle && data.hero_title) {
                // If the title has HTML (like <br> or <span>), innerHTML is needed. 
                // However, our admin panel currently inputs plain text.
                // Let's assume the first half and second half split logic if needed, 
                // or just inject text.
                heroTitle.textContent = data.hero_title;
            }

            const heroSubtitle = document.getElementById('hero-subtitle');
            if (heroSubtitle && data.hero_subtitle) heroSubtitle.textContent = data.hero_subtitle;

            // Update Contact Info elements if they exist
            document.querySelectorAll('.dynamic-phone').forEach(el => el.textContent = data.phone);
            document.querySelectorAll('.dynamic-email').forEach(el => el.textContent = data.email);
            document.querySelectorAll('.dynamic-address').forEach(el => {
                // simple split by comma for line breaks if needed, or just text
                el.innerHTML = data.address.replace(/\n/g, '<br>');
            });
            
            // If there's an updated hero image URL from DB
            if (data.hero_image_url) {
                const heroImg = document.getElementById('hero-image');
                if (heroImg) heroImg.src = data.hero_image_url;
            }
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Fetch Programs
async function fetchPrograms() {
    // Return early if no real supabase URL is provided
    if (SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') return;

    try {
        const { data, error } = await supabaseClient
            .from('programs')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        if (data && data.length > 0) {
            const programsGrid = document.getElementById('dynamic-programs-grid');
            if (programsGrid) {
                programsGrid.innerHTML = ''; // clear static ones
                
                const colors = ['bg-yellow', 'bg-black', 'bg-yellow'];
                
                data.forEach((prog, index) => {
                    const bgColor = colors[index % colors.length];
                    const textColor = bgColor === 'bg-black' ? 'text-white' : '';
                    
                    const cardHTML = `
                        <div class="program-card reveal active">
                            <div class="card-header ${bgColor}">
                                <h3 class="${textColor}">${prog.title}</h3>
                                <span class="age ${textColor}">${prog.age_group}</span>
                            </div>
                            <div class="card-body">
                                <p>${prog.description}</p>
                            </div>
                        </div>
                    `;
                    programsGrid.insertAdjacentHTML('beforeend', cardHTML);
                });
            }
        }
    } catch (err) {
        console.error('Error fetching programs:', err);
    }
}

// Fetch Gallery Photos from Supabase
async function fetchGallery() {
    if (SUPABASE_URL === 'https://YOUR_PROJECT_ID.supabase.co') return;

    try {
        const { data, error } = await supabaseClient
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            const galleryGrid = document.getElementById('galleryGrid');
            if (galleryGrid) {
                galleryGrid.innerHTML = ''; // Replace fallback items if custom database photos exist

                data.forEach((item) => {
                    const catSlug = (item.category || 'all').toLowerCase().replace(/\s+/g, '-');
                    const cardHTML = `
                        <div class="gallery-card reveal active" data-category="${catSlug}">
                            <div class="gallery-img-wrap">
                                <img src="${item.image_url}" alt="${item.title || item.category}" loading="lazy">
                                <div class="gallery-badge">${item.category || 'Event'}</div>
                                <div class="gallery-overlay">
                                    <div class="gallery-info">
                                        <h3>${item.title || item.category || 'Special Event'}</h3>
                                        <p>${item.description || 'Cherished moment captured at Mazhalai Preschool.'}</p>
                                        <span class="gallery-date">📅 ${new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                    </div>
                                    <button class="gallery-zoom-btn" aria-label="View photo">🔍</button>
                                </div>
                            </div>
                        </div>
                    `;
                    galleryGrid.insertAdjacentHTML('beforeend', cardHTML);
                });
            }
        }
    } catch (err) {
        console.error('Error fetching gallery:', err);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    fetchSiteContent();
    fetchPrograms();
    fetchGallery();
});

