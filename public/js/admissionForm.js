// ==========================================
// Mazhalai Preschool – Floating Admission Enquiry Widget
// ==========================================
// Submissions are sent straight to a Google Apps Script Web App, which
// appends each enquiry as a row in Google Sheets. This is reachable from
// anywhere on the internet (unlike a localhost server), so it works no
// matter where this static site itself ends up hosted.
//
// Setup:
//   1. Open the target Google Sheet.
//   2. Extensions -> Apps Script, paste in the contents of
//      google-apps-script/Code.gs (project root), save.
//   3. Deploy -> New deployment -> type "Web app".
//        - Execute as: Me
//        - Who has access: Anyone
//   4. Copy the deployment URL and paste it below.
// ==========================================

const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxxkab-u0S9HVwUIgik7xgAqG4QTKdodo4V2ltQdRFZlMjsCYLaFCuOMWft1UwRhuzp/exec';

const _admissionConfigured = (
  GOOGLE_SHEETS_WEB_APP_URL &&
  GOOGLE_SHEETS_WEB_APP_URL.indexOf('PASTE_YOUR_') !== 0
);

document.addEventListener('DOMContentLoaded', () => {
  const fab = document.getElementById('admissionFabBtn');
  const panel = document.getElementById('admissionPanel');
  const closeBtn = document.getElementById('admissionPanelClose');

  function setPanelOpen(open) {
    if (!panel || !fab) return;
    panel.classList.toggle('active', open);
    panel.setAttribute('aria-hidden', String(!open));
    fab.setAttribute('aria-expanded', String(open));
  }

  if (fab && panel) {
    fab.addEventListener('click', () => setPanelOpen(!panel.classList.contains('active')));
    if (closeBtn) closeBtn.addEventListener('click', () => setPanelOpen(false));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('active')) setPanelOpen(false);
    });

    document.addEventListener('click', (e) => {
      if (!panel.classList.contains('active')) return;
      if (panel.contains(e.target) || fab.contains(e.target)) return;
      setPanelOpen(false);
    });
  }

  // "Enquire Now" / "Apply for Admission" links scattered around the page
  // still open the floating panel — the hero has its own always-visible
  // copy of the form (wired up below), but everywhere else on the page
  // this is still how visitors reach an admission form.
  document.querySelectorAll('.js-open-admission-form').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setPanelOpen(true);
    });
  });

  // Shared submit-handling for any admission form on the page — the
  // floating panel's form and the hero's always-visible form both use
  // this, each with its own status/button elements and a `source` label
  // so submissions can be told apart in the sheet.
  function wireAdmissionForm(form, statusEl, submitBtn, source, { closeOnSuccess } = {}) {
    if (!form) return;

    function setStatus(message, type) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.classList.remove('success', 'error');
      if (type) statusEl.classList.add(type);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const payload = {
        name: form.name.value.trim(),
        mobile: form.mobile.value.trim(),
        childAge: form.childAge.value,
        program: form.program.value,
        source,
      };

      if (!payload.name || !payload.mobile || !payload.childAge || !payload.program) {
        setStatus('Please fill in all required fields.', 'error');
        return;
      }

      if (!_admissionConfigured) {
        console.warn('Admission form: GOOGLE_SHEETS_WEB_APP_URL is not configured yet in js/admissionForm.js');
        setStatus('Thanks! We received your details — our team will call you shortly.', 'success');
        form.reset();
        return;
      }

      submitBtn.disabled = true;
      setStatus('Submitting…', '');

      try {
        // Apps Script Web Apps don't return CORS headers for cross-origin
        // reads, so we fire with mode:'no-cors' and treat a resolved fetch
        // (no network error) as success — the response body is opaque and
        // intentionally not read here.
        await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
        });

        setStatus('Thank you! We’ll contact you shortly to schedule your visit.', 'success');
        form.reset();
        if (closeOnSuccess) setTimeout(() => setPanelOpen(false), 1800);
      } catch (err) {
        console.error('Admission form submit error:', err);
        setStatus('Something went wrong. Please call us directly or try again.', 'error');
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  wireAdmissionForm(
    document.getElementById('admissionForm'),
    document.getElementById('admissionStatus'),
    document.getElementById('admissionSubmitBtn'),
    'Website Floating Admission Widget',
    { closeOnSuccess: true }
  );

  wireAdmissionForm(
    document.getElementById('heroAdmissionForm'),
    document.getElementById('heroAdmissionStatus'),
    document.getElementById('heroAdmissionSubmitBtn'),
    'Website Hero Form'
  );
});
