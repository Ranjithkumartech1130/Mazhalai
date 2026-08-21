document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(n => n.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
    }));

    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
            navbar.style.padding = '5px 0';
        } else {
            navbar.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
            navbar.style.padding = '0';
        }
    });

    // Scroll Reveal Animation
    function reveal() {
        var reveals = document.querySelectorAll('.reveal');
        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            var elementVisible = 150;
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            }
        }
    }
    
    window.addEventListener('scroll', reveal);
    reveal(); // Trigger on load

    // Smooth Scrolling for anchor links (if browser doesn't support smooth behavior natively)
    document.querySelectorAll('a[href^="#"]:not(.js-open-admission-form)').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Adjust for fixed header height
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // ==================== GALLERY FILTERING & LIGHTBOX ====================
    const filterBtns = document.querySelectorAll('.gallery-filter-btn');
    const galleryCards = document.querySelectorAll('.gallery-card');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                galleryCards.forEach(card => {
                    const category = card.getAttribute('data-category');
                    if (filterValue === 'all' || category === filterValue) {
                        card.classList.remove('hide');
                        card.style.opacity = '0';
                        card.style.transform = 'scale(0.95)';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        card.classList.add('hide');
                    }
                });
            });
        });
    }

    // Lightbox Functionality
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxBadge = document.getElementById('lightboxBadge');
    const lightboxTitle = document.getElementById('lightboxTitle');
    const lightboxDesc = document.getElementById('lightboxDesc');
    const lightboxDate = document.getElementById('lightboxDate');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');
    const lightboxBackdrop = document.querySelector('.lightbox-backdrop');

    let currentPhotoIndex = 0;
    let visibleCards = [];
    let activeCardSelector = '.gallery-card:not(.hide)';

    function updateVisibleCards() {
        visibleCards = Array.from(document.querySelectorAll(activeCardSelector));
    }

    function getCardData(card) {
        if (card.classList.contains('event-card')) {
            return {
                img: card.querySelector('img'),
                badge: card.querySelector('.event-card-badge'),
                title: card.querySelector('.event-card-title'),
                desc: card.querySelector('.event-card-desc'),
                date: card.querySelector('.event-card-date'),
            };
        }
        return {
            img: card.querySelector('img'),
            badge: card.querySelector('.gallery-badge'),
            title: card.querySelector('.gallery-info h3'),
            desc: card.querySelector('.gallery-info p'),
            date: card.querySelector('.gallery-date'),
        };
    }

    function openLightbox(index) {
        updateVisibleCards();
        if (visibleCards.length === 0 || index < 0 || index >= visibleCards.length) return;

        currentPhotoIndex = index;
        const card = visibleCards[currentPhotoIndex];
        const { img, badge, title, desc, date } = getCardData(card);

        if (img) lightboxImg.src = img.src;
        lightboxBadge.textContent = badge ? badge.textContent : '';
        lightboxTitle.textContent = title ? title.textContent : '';
        lightboxDesc.textContent = desc ? desc.textContent : '';
        lightboxDate.textContent = date ? date.textContent : '';

        lightboxModal.classList.add('active');
        lightboxModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        if (!lightboxModal) return;
        lightboxModal.classList.remove('active');
        lightboxModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function showNextPhoto() {
        updateVisibleCards();
        if (visibleCards.length === 0) return;
        currentPhotoIndex = (currentPhotoIndex + 1) % visibleCards.length;
        openLightbox(currentPhotoIndex);
    }

    function showPrevPhoto() {
        updateVisibleCards();
        if (visibleCards.length === 0) return;
        currentPhotoIndex = (currentPhotoIndex - 1 + visibleCards.length) % visibleCards.length;
        openLightbox(currentPhotoIndex);
    }

    // Attach click events on gallery cards, event cards & zoom buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.lightbox-content')) return;

        const galleryCard = e.target.closest('.gallery-card');
        const eventCard = e.target.closest('.event-card');
        const card = galleryCard || eventCard;
        if (!card) return;
        if (galleryCard && galleryCard.classList.contains('hide')) return;
        if (eventCard && !eventCard.querySelector('img')) return;

        activeCardSelector = galleryCard ? '.gallery-card:not(.hide)' : '.event-card';
        updateVisibleCards();
        const index = visibleCards.indexOf(card);
        if (index !== -1) {
            openLightbox(index);
        }
    });

    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);
    if (lightboxNext) lightboxNext.addEventListener('click', showNextPhoto);
    if (lightboxPrev) lightboxPrev.addEventListener('click', showPrevPhoto);

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') showNextPhoto();
        if (e.key === 'ArrowLeft') showPrevPhoto();
    });
});

