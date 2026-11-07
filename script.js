document.body.classList.add('has-motion');

const header = document.querySelector('#site-header');
const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-navigation');

const updateHeader = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Apri il menu' : 'Chiudi il menu');
  navigation.classList.toggle('is-open', !isOpen);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Apri il menu');
    navigation.classList.remove('is-open');
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Apri il menu');
    menuToggle.focus();
  }
});

const tabs = [...document.querySelectorAll('[role="tab"]')];
const activateTab = (tab, moveFocus = false) => {
  tabs.forEach((item) => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
  if (moveFocus) tab.focus();
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex !== index) {
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    }
  });
});

const lightbox = document.querySelector('#lightbox');
const lightboxImage = document.querySelector('#lightbox-image');
const lightboxCaption = document.querySelector('#lightbox-caption');
const closeLightbox = () => lightbox.close();

document.querySelectorAll('.gallery-item').forEach((item) => {
  item.addEventListener('click', () => {
    lightboxImage.src = item.dataset.image;
    lightboxImage.alt = item.dataset.alt;
    lightboxCaption.textContent = item.dataset.caption;
    lightbox.showModal();
  });
});

document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

const dateInput = document.querySelector('#booking-date');
if (dateInput) {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  dateInput.min = localToday;
}

const bookingForm = document.querySelector('#booking-form');
const bookingStatus = document.querySelector('#form-status');
const requiredFields = [...bookingForm.querySelectorAll('input[required], select[required]')];
const phoneInput = bookingForm.querySelector('[name="phone"]');

const validatePhone = () => {
  const value = phoneInput.value.trim();
  const digitCount = value.replace(/\D/g, '').length;
  const validCharacters = /^[+0-9() .-]{6,24}$/.test(value);
  phoneInput.setCustomValidity(value && (!validCharacters || digitCount < 6)
    ? 'Inserisci un numero di telefono valido con almeno 6 cifre.'
    : '');
};

const fieldLabel = (field) => field.closest('label')?.querySelector('.field-label')?.textContent.replace('*', '').trim() || 'richiesto';
const fieldError = (field) => {
  if (field.validity.customError || field.validity.patternMismatch) return field.validationMessage;
  if (field.validity.typeMismatch) return 'Inserisci un indirizzo email valido.';
  if (field.validity.rangeUnderflow) return 'Scegli una data da oggi in poi.';
  if (field.validity.valueMissing) return `Compila il campo “${fieldLabel(field)}”.`;
  return `Controlla il campo “${fieldLabel(field)}”.`;
};

const refreshFormErrors = () => {
  validatePhone();
  const invalidFields = requiredFields.filter((field) => !field.validity.valid);
  invalidFields.forEach((field) => field.setAttribute('aria-invalid', 'true'));
  requiredFields.filter((field) => field.validity.valid).forEach((field) => field.removeAttribute('aria-invalid'));
  if (bookingStatus.dataset.state === 'error') {
    bookingStatus.textContent = invalidFields.length ? `Restano ${invalidFields.length} campi da completare o correggere.` : '';
    if (!invalidFields.length) delete bookingStatus.dataset.state;
  } else if (bookingStatus.dataset.state === 'demo') {
    bookingStatus.textContent = '';
    delete bookingStatus.dataset.state;
  }
};

bookingForm.addEventListener('input', refreshFormErrors);
bookingForm.addEventListener('change', refreshFormErrors);

let invalidFeedbackTimer;
bookingForm.addEventListener('invalid', (event) => {
  event.target.setAttribute('aria-invalid', 'true');
  if (!invalidFeedbackTimer) {
    invalidFeedbackTimer = window.setTimeout(() => {
      const invalidFields = requiredFields.filter((field) => !field.validity.valid);
      if (invalidFields.length) {
        bookingStatus.dataset.state = 'error';
        bookingStatus.textContent = `${fieldError(invalidFields[0])} Verifica anche gli altri campi evidenziati.`;
      }
      invalidFeedbackTimer = undefined;
    }, 0);
  }
}, true);

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  validatePhone();
  const invalidFields = requiredFields.filter((field) => !field.validity.valid);
  requiredFields.forEach((field) => {
    if (field.validity.valid) field.removeAttribute('aria-invalid');
    else field.setAttribute('aria-invalid', 'true');
  });
  if (invalidFields.length) {
    bookingStatus.dataset.state = 'error';
    bookingStatus.textContent = `${fieldError(invalidFields[0])} Verifica anche gli altri campi evidenziati.`;
    invalidFields[0].focus();
    return;
  }
  bookingStatus.dataset.state = 'demo';
  bookingStatus.textContent = 'La richiesta è solo dimostrativa: non è stata inviata e nessun tavolo è stato confermato.';
});
bookingForm.querySelector('[type="submit"]').disabled = false;

document.querySelector('#year').textContent = new Date().getFullYear();

if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        currentObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible'));
}

const mobileBookingCta = document.querySelector('.mobile-booking-cta');
if ('IntersectionObserver' in window && mobileBookingCta) {
  const bookingCtaObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      mobileBookingCta.classList.toggle('is-hidden', entry.isIntersecting);
      if (entry.isIntersecting && document.activeElement === mobileBookingCta) {
        document.querySelector('#booking-title').focus({ preventScroll: true });
      }
    });
  }, { threshold: 0.12 });
  bookingCtaObserver.observe(document.querySelector('#prenota'));
}
