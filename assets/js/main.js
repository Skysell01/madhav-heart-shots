/**
 * Madhavbaug Heart-O-Safe SHOTS - High Conversion COD Landing Page Logic
 * Features:
 * 1. Single Hero Showcase / Interactive Gallery
 * 2. Pricing & Bundle Sync (1 Box, 2 Boxes - Most Popular, 4 Boxes - Best Value)
 * 3. Unified COD Lead Modal with Name, Contact, Address, City, State
 * 4. 24-Hour Duplicate Prevention by Contact Number
 * 5. Google Sheets Webhook Integration
 * 6. Sticky Mobile Bar, Review Filtering & Accordion FAQs
 */

// ==============================================================================
// GOOGLE SHEETS WEBHOOK CONFIGURATION
// ==============================================================================
const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzCmm_ihBnhl0NCTPNFGmKm3eApnA9_1qEEYWFco11zrPIHNo6ka21BxGYYnRpH8kB0/exec';

// Local Storage Key & 24 Hours Cooldown (24 * 60 * 60 * 1000 ms)
const SUBMITTED_CONTACTS_KEY = 'madhavbaug_heart_o_safe_contacts_24h';
const DUPLICATE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================================================
  // 1. Pricing & Bundle Selector State
  // ==========================================================================
  const bundleCards = document.querySelectorAll('.bundle-card');
  const formPackCards = document.querySelectorAll('.form-pack-card');
  const currentPriceEl = document.getElementById('currentPrice');
  const originalPriceEl = document.getElementById('originalPrice');
  const discountTagEl = document.getElementById('discountTag');
  const stickyPriceEl = document.getElementById('stickyPrice');
  const stickyPackNameEl = document.getElementById('stickyPackName');

  const bundleData = [
    {
      index: 0,
      title: '1 Box (14 Daily Heart-O-Safe Shots)',
      shots: 14,
      price: 899,
      original: 1299,
      discount: '31% की छूट',
      desc: '2 Weeks Cardio Arterial & BP Starter Pack'
    },
    {
      index: 1,
      title: '2 Boxes (28 Daily Heart-O-Safe Shots - 1 Month)',
      shots: 28,
      price: 1599,
      original: 2598,
      discount: '38% की सबसे बड़ी छूट',
      desc: 'Most Popular: Complete 1 Month Arterial & Cholesterol Cleanse'
    },
    {
      index: 2,
      title: '4 Boxes (56 Daily Heart-O-Safe Shots - 2 Months)',
      shots: 56,
      price: 2899,
      original: 5196,
      discount: '44% की महा बचत',
      desc: 'Best Value: 2 Months Plaque Dissolution & Cardiovascular Stamina'
    }
  ];

  let selectedBundleIndex = 1; // Default: 2 Boxes (Most Popular)

  function updateBundleState(index) {
    selectedBundleIndex = index;
    const data = bundleData[index];

    // Update Hero UI
    if (currentPriceEl) currentPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (originalPriceEl) originalPriceEl.textContent = `₹${data.original.toLocaleString('en-IN')}`;
    if (discountTagEl) discountTagEl.textContent = data.discount;

    // Update Hero Bundle Cards
    bundleCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update Form Pack Cards if present
    formPackCards.forEach((card, i) => {
      card.classList.toggle('active', i === index);
    });

    // Update Sticky Bar
    if (stickyPriceEl) stickyPriceEl.textContent = `₹${data.price.toLocaleString('en-IN')}`;
    if (stickyPackNameEl) stickyPackNameEl.textContent = data.title;

    // Update hidden inputs in modal form
    const modalSelectedPack = document.getElementById('modalSelectedPack');
    const modalPrice = document.getElementById('modalPrice');
    if (modalSelectedPack) modalSelectedPack.value = data.title;
    if (modalPrice) modalPrice.value = `₹${data.price.toLocaleString('en-IN')}`;
  }

  bundleCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  formPackCards.forEach((card, i) => {
    card.addEventListener('click', () => updateBundleState(i));
  });

  // Initialize with index 1 (Most popular)
  updateBundleState(1);

  // ==========================================================================
  // 2. Duplicate Contact Validation (24-Hour Prevention)
  // ==========================================================================
  function cleanPhoneNumber(phone) {
    return (phone || '').replace(/\D/g, '').slice(-10);
  }

  function checkDuplicateContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return false;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      const timestamp = stored[clean];
      if (timestamp && (Date.now() - timestamp < DUPLICATE_COOLDOWN_MS)) {
        return true;
      }
    } catch (e) {}
    return false;
  }

  function saveSubmittedContact(phone) {
    const clean = cleanPhoneNumber(phone);
    if (!clean || clean.length < 10) return;
    try {
      const stored = JSON.parse(localStorage.getItem(SUBMITTED_CONTACTS_KEY) || '{}');
      stored[clean] = Date.now();
      localStorage.setItem(SUBMITTED_CONTACTS_KEY, JSON.stringify(stored));
    } catch (e) {}
  }

  const phoneInput = document.getElementById('modalCodPhone');
  const duplicateAlert = document.getElementById('modalDuplicateAlert');

  function validateDuplicateUI() {
    if (!phoneInput) return false;
    const phone = phoneInput.value.trim();
    const isDup = checkDuplicateContact(phone);
    if (duplicateAlert) {
      duplicateAlert.style.display = isDup ? 'block' : 'none';
    }
    return isDup;
  }

  if (phoneInput) {
    phoneInput.addEventListener('input', validateDuplicateUI);
    phoneInput.addEventListener('blur', validateDuplicateUI);
  }

  // ==========================================================================
  // 3. Modals Management (Common COD Lead Modal, Thank You Modal)
  // ==========================================================================
  const codModal = document.getElementById('codModal');
  const codModalClose = document.getElementById('codModalClose');
  const thankYouModal = document.getElementById('thankYouModal');
  const thankYouModalClose = document.getElementById('thankYouModalClose');
  const thankYouModalDoneBtn = document.getElementById('thankYouModalDoneBtn');

  function openModal(modal) {
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    if (modal === codModal && duplicateAlert) {
      duplicateAlert.style.display = 'none';
    }

    const firstInput = modal.querySelector('input:not([type="hidden"])');
    if (firstInput) setTimeout(() => firstInput.focus(), 150);
  }

  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
  }

  // ALL CTA BUTTONS ACROSS THE ENTIRE PAGE TRIGGER THIS COMMON COD MODAL
  const allCtaButtons = document.querySelectorAll(
    '.btn-buy-now, #heroBuyNow, #stickyBuyNow, #navCtaBtn, #sectionCodBuyBtn, .hero-quick-form-btn, .btn-hero-order'
  );

  allCtaButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(codModal);
    });
  });

  if (codModalClose) codModalClose.addEventListener('click', () => closeModal(codModal));
  if (thankYouModalClose) thankYouModalClose.addEventListener('click', () => closeModal(thankYouModal));
  if (thankYouModalDoneBtn) thankYouModalDoneBtn.addEventListener('click', () => closeModal(thankYouModal));

  // Close modal on overlay background click
  [codModal, thankYouModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [codModal, thankYouModal].forEach(modal => {
        if (modal && modal.classList.contains('active')) closeModal(modal);
      });
    }
  });

  // ==========================================================================
  // 4. COD Order Submission (Lead Webhook + 24hr Prevention + Thank You)
  // ==========================================================================
  const modalCodForm = document.getElementById('modalCodForm');

  function generateOrderId() {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `MDB-HRT-${randomNum}`;
  }

  function handleOrderSuccess(name, phone, address, city, state, packTitle, amount, orderId) {
    // Populate Thank You Modal
    const tyOrderId = document.getElementById('thankYouOrderId');
    const tyCustomerName = document.getElementById('thankYouCustomerName');
    const tyPhone = document.getElementById('thankYouPhone');
    const tyPack = document.getElementById('thankYouPack');
    const tyAmount = document.getElementById('thankYouAmount');
    const waShareBtn = document.getElementById('whatsappConfirmBtn');

    const addressParts = [address, city, state].filter(Boolean);
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : 'सत्यापन कॉल पर दर्ज किया जाएगा';
    const cityStateText = [city, state].filter(Boolean).join(', ') || 'Cardiac Verification Call';

    if (tyOrderId) tyOrderId.textContent = orderId;
    if (tyCustomerName) tyCustomerName.textContent = name || 'प्रिय ग्राहक';
    if (tyPhone) tyPhone.textContent = `+91 ${phone}`;
    if (tyPack) tyPack.textContent = packTitle;
    if (tyAmount) tyAmount.textContent = `₹${amount.toLocaleString('en-IN')}`;

    if (waShareBtn) {
      const waText = encodeURIComponent(
        `नमस्ते Madhavbaug! मैंने Heart-O-Safe Shots का Cash On Delivery ऑर्डर किया है।\n` +
        `Order ID: ${orderId}\n` +
        `Pack: ${packTitle}\n` +
        `Amount: ₹${amount}\n` +
        `Name: ${name}\n` +
        `Address: ${formattedAddress}\n` +
        `City/State: ${cityStateText}`
      );
      waShareBtn.href = `https://wa.me/919321456789?text=${waText}`;
    }

    closeModal(codModal);
    openModal(thankYouModal);
    showToast('🎉 Cash on Delivery ऑर्डर दर्ज हो गया है!');
  }

  if (modalCodForm) {
    modalCodForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('modalCodName')?.value.trim() || '';
      const phone = document.getElementById('modalCodPhone')?.value.trim() || '';
      const address = document.getElementById('modalCodAddress')?.value.trim() || '';
      const city = document.getElementById('modalCodCity')?.value.trim() || '';
      const state = document.getElementById('modalCodState')?.value.trim() || '';
      const bundle = bundleData[selectedBundleIndex] || bundleData[1];

      // 1. Check if contact number was already submitted within 24 hours
      if (checkDuplicateContact(phone)) {
        if (duplicateAlert) duplicateAlert.style.display = 'block';
        showToast('⚠️ Already submitted form. Wait for 24hr, our cardiac expert will call you.');
        return;
      }

      const submitBtn = document.getElementById('modalSubmitBtn');
      const originalText = submitBtn ? submitBtn.innerHTML : '';
      if (submitBtn) {
        submitBtn.innerHTML = '⏳ ऑर्डर दर्ज हो रहा है...';
        submitBtn.disabled = true;
      }

      const orderId = generateOrderId();
      const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Lead data payload
      const leadData = {
        timestamp: now,
        orderId: orderId,
        name: name,
        contact: phone,
        address: address || '-',
        city: city || '-',
        state: state || '-',
        package: bundle.title,
        price: `₹${bundle.price}`,
        paymentMode: 'Cash On Delivery (COD)',
        pageUrl: window.location.href
      };

      // 2. Post to Google Sheets Webhook
      if (GOOGLE_SHEETS_WEBHOOK_URL && GOOGLE_SHEETS_WEBHOOK_URL.trim() !== '') {
        try {
          await fetch(GOOGLE_SHEETS_WEBHOOK_URL.trim(), {
            method: 'POST',
            mode: 'no-cors', // standard for Google Apps Script Web App
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(leadData)
          });
          console.log('Lead successfully sent to Google Sheets Webhook:', leadData);
        } catch (err) {
          console.error('Error posting lead to Google Sheets:', err);
        }
      }

      // 3. Mark contact as submitted for 24-hr prevention
      saveSubmittedContact(phone);

      // 4. Restore button and show Thank You confirmation modal
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }

      handleOrderSuccess(name, phone, address, city, state, bundle.title, bundle.price, orderId);
    });
  }

  // ==========================================================================
  // 5. Sticky Bottom Bar Visibility on Scroll (Mobile & Desktop)
  // ==========================================================================
  const stickyBar = document.getElementById('stickyMobileBar');
  const heroSection = document.getElementById('product-hero');

  if (stickyBar && heroSection) {
    window.addEventListener('scroll', () => {
      const heroBottom = heroSection.getBoundingClientRect().bottom;
      if (heroBottom < 100) {
        stickyBar.classList.add('visible');
      } else {
        stickyBar.classList.remove('visible');
      }
    });
  }

  // ==========================================================================
  // 6. Accordion FAQ Functionality
  // ==========================================================================
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question-btn, .faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('active');
        // Close others
        faqItems.forEach(other => other.classList.remove('active'));
        // Toggle current
        if (!isOpen) {
          item.classList.add('active');
        }
      });
    }
  });

  // ==========================================================================
  // 7. Customer Review Filters
  // ==========================================================================
  const filterBtns = document.querySelectorAll('.review-filter-btn');
  const reviewCards = document.querySelectorAll('.review-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');

      reviewCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // ==========================================================================
  // 8. Toast Notification Helper
  // ==========================================================================
  function showToast(msg) {
    let toast = document.getElementById('toastNotice');
    let toastMsg = document.getElementById('toastMsg');
    if (!toast) return;
    if (toastMsg) toastMsg.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
  window.showToast = showToast;
});
