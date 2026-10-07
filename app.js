/**
 * Webcare Invoice Studio - Main Application Logic
 * PT. Webcare Digital Indonesia
 */

// Initial Blank State for New Invoices
const defaultState = {
  invoiceNumber: '',
  invoiceDate: '',
  client: {
    name: '',
    company: '',
    contactType: 'phone',
    countryCode: '+62',
    phone: '',
    email: ''
  },
  items: [
    { description: '', qty: 1, price: 0 }
  ],
  paidAmount: 0,
  kurangLabel: 'Kurang', // 'Kurang' or 'Pelunasan'
  company: {
    name: 'PT. WEBCARE DIGITAL INDONESIA',
    phone: '+62 857-3642-6304',
    email: 'webcareidnofficial@gmail.com',
    web: 'www.webcareidn.com',
    bankName: 'Bank BCA',
    bankAcc: '7205091351',
    bankHolder: 'Mohammad Farkhan',
    signName: 'Mohammad Farkhan',
    signRole: 'Direktur',
    footerAddress: 'Jl. Alas Sari, GG. Alam Pesona I, Pabean, Sidoarjo\nJawa Timur, 61253'
  }
};

let state = JSON.parse(JSON.stringify(defaultState));
let currentZoom = 1.0;

// ==========================================================================
// Formatting Helpers
// ==========================================================================

/**
 * Formats ISO date YYYY-MM-DD from calendar input to DD/MM/YYYY for the invoice
 */
function formatIsoToDisplayDate(isoDate) {
  if (!isoDate) return '-';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

/**
 * Automatically formats phone number with dashes (e.g. 8111258853 -> 811-1258-853)
 */
function formatPhoneNumber(raw) {
  if (!raw) return '';
  // Strip non-digits
  let digits = raw.replace(/\D/g, '');
  // Remove leading 0 if entered since country code is separate
  if (digits.startsWith('0')) {
    digits = digits.substring(1);
  }
  digits = digits.slice(0, 13);

  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  } else if (digits.length <= 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  } else {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}-${digits.slice(11)}`;
  }
}

/**
 * Updates client contact text in invoice preview based on phone/email
 */
function updateClientContactPreview() {
  if (state.client.contactType === 'phone') {
    if (state.client.phone && state.client.phone.trim().length > 0) {
      DOM.previewClientContact.textContent = `${state.client.countryCode} ${state.client.phone.trim()}`;
    } else {
      DOM.previewClientContact.textContent = '';
    }
  } else {
    DOM.previewClientContact.textContent = state.client.email || '';
  }
}

/**
 * Formats a number to Indonesian Rupiah currency string (e.g. "Rp 5.250.000")
 */
function formatRupiah(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) amount = 0;
  const num = Math.round(Number(amount));
  return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parses numeric value from formatted currency string (e.g. "3.150.000" -> 3150000)
 */
function parseNumber(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  const clean = str.toString().replace(/[^0-9]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Formats raw number with thousand dots (e.g. 350000 -> "350.000")
 */
function formatThousand(num) {
  if (isNaN(num)) return '0';
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// ==========================================================================
// DOM Elements
// ==========================================================================
const DOM = {
  // Inputs
  invNumber: document.getElementById('input-inv-number'),
  invDate: document.getElementById('input-inv-date'),
  clientName: document.getElementById('input-client-name'),
  clientCompany: document.getElementById('input-client-company'),
  
  // Contact Dropdown & Inputs
  selectContactType: document.getElementById('select-contact-type'),
  contactPhoneGroup: document.getElementById('contact-phone-group'),
  selectCountryCode: document.getElementById('select-country-code'),
  inputClientPhone: document.getElementById('input-client-phone'),
  contactEmailGroup: document.getElementById('contact-email-group'),
  inputClientEmail: document.getElementById('input-client-email'),
  emailValidationHelper: document.getElementById('email-validation-helper'),

  itemsContainer: document.getElementById('items-container'),
  btnAddItem: document.getElementById('btn-add-item'),
  paidAmount: document.getElementById('input-paid-amount'),
  selectKurangLabel: document.getElementById('select-kurang-label'),

  // Company Inputs
  companyName: document.getElementById('input-company-name'),
  companyPhone: document.getElementById('input-company-phone'),
  companyEmail: document.getElementById('input-company-email'),
  companyWeb: document.getElementById('input-company-web'),
  bankName: document.getElementById('input-bank-name'),
  bankAcc: document.getElementById('input-bank-acc'),
  bankHolder: document.getElementById('input-bank-holder'),
  signName: document.getElementById('input-sign-name'),
  signRole: document.getElementById('input-sign-role'),
  footerAddress: document.getElementById('input-footer-address'),

  // Status & Summary
  displaySubtotal: document.getElementById('display-subtotal'),
  paymentStatusCard: document.getElementById('payment-status-card'),
  statusTitle: document.getElementById('status-title'),
  statusDisplayPaid: document.getElementById('status-display-paid'),
  statusKurangRow: document.getElementById('status-kurang-row'),
  statusKurangLabel: document.getElementById('status-kurang-label'),
  statusDisplayKurang: document.getElementById('status-display-kurang'),
  statusDescription: document.getElementById('status-description'),

  // Quick Chips
  btnPayFull: document.getElementById('btn-pay-full'),
  btnPay50: document.getElementById('btn-pay-50'),
  btnPay30: document.getElementById('btn-pay-30'),
  btnPayZero: document.getElementById('btn-pay-zero'),

  // Action Buttons
  btnClearForm: document.getElementById('btn-clear-form'),
  btnPrint: document.getElementById('btn-print'),
  btnDownloadPdf: document.getElementById('btn-download-pdf'),
  btnDownloadImg: document.getElementById('btn-download-img'),

  // Zoom Controls
  btnZoomIn: document.getElementById('btn-zoom-in'),
  btnZoomOut: document.getElementById('btn-zoom-out'),
  btnZoomReset: document.getElementById('btn-zoom-reset'),
  zoomText: document.getElementById('zoom-text'),
  sheetWrapper: document.getElementById('sheet-wrapper'),
  previewViewport: document.getElementById('preview-viewport'),

  // Invoice Preview Sheet Elements
  previewInvNumber: document.getElementById('preview-inv-number'),
  previewInvDate: document.getElementById('preview-inv-date'),
  previewClientName: document.getElementById('preview-client-name'),
  previewClientCompany: document.getElementById('preview-client-company'),
  previewClientContact: document.getElementById('preview-client-contact'),
  previewItemsBody: document.getElementById('preview-items-body'),
  previewTotal: document.getElementById('preview-total'),
  previewPaid: document.getElementById('preview-paid'),
  previewKurangRow: document.getElementById('preview-kurang-row'),
  previewKurangLabel: document.getElementById('preview-kurang-label'),
  previewKurang: document.getElementById('preview-kurang'),
  previewCompanyName: document.getElementById('preview-company-name'),
  previewCompanyPhone: document.getElementById('preview-company-phone'),
  previewCompanyEmail: document.getElementById('preview-company-email'),
  previewCompanyWeb: document.getElementById('preview-company-web'),
  previewBankHolder: document.getElementById('preview-bank-holder'),
  previewBankName: document.getElementById('preview-bank-name'),
  previewBankAcc: document.getElementById('preview-bank-acc'),
  previewSignName: document.getElementById('preview-sign-name'),
  previewSignRole: document.getElementById('preview-sign-role'),
  previewFooterAddress: document.getElementById('preview-footer-address'),
  previewFooterEmail: document.getElementById('preview-footer-email'),

  // Mobile Navigation
  mobileTabBar: document.getElementById('mobile-tab-bar'),
  tabBtnEditor: document.getElementById('tab-btn-editor'),
  tabBtnPreview: document.getElementById('tab-btn-preview'),
  appWorkspace: document.getElementById('app-workspace'),
  mobileFloatingSwitch: document.getElementById('mobile-floating-switch'),
  floatingBtnText: document.getElementById('floating-btn-text')
};

// ==========================================================================
// Initialization & Render
// ==========================================================================

function init() {
  bindFormInputs();
  bindActionButtons();
  bindZoomControls();
  bindMobileNavigation();
  renderItemInputs();
  updateCalculationsAndPreview();
  autoFitPreview();

  window.addEventListener('resize', () => {
    autoFitPreview();
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(autoFitPreview, 200);
  });
}

function bindMobileNavigation() {
  if (!DOM.tabBtnEditor || !DOM.tabBtnPreview) return;

  function showEditorTab() {
    DOM.appWorkspace.className = 'app-workspace show-editor';
    DOM.tabBtnEditor.classList.add('active');
    DOM.tabBtnPreview.classList.remove('active');
    if (DOM.floatingBtnText) DOM.floatingBtnText.textContent = 'Lihat Invoice';
  }

  function showPreviewTab() {
    DOM.appWorkspace.className = 'app-workspace show-preview';
    DOM.tabBtnPreview.classList.add('active');
    DOM.tabBtnEditor.classList.remove('active');
    if (DOM.floatingBtnText) DOM.floatingBtnText.textContent = 'Edit Form';
    setTimeout(() => {
      autoFitPreview();
    }, 50);
  }

  DOM.tabBtnEditor.addEventListener('click', showEditorTab);
  DOM.tabBtnPreview.addEventListener('click', showPreviewTab);

  if (DOM.mobileFloatingSwitch) {
    DOM.mobileFloatingSwitch.addEventListener('click', () => {
      if (DOM.appWorkspace.classList.contains('show-preview')) {
        showEditorTab();
      } else {
        showPreviewTab();
      }
    });
  }
}

/**
 * Bind form change listeners
 */
function bindFormInputs() {
  DOM.invNumber.addEventListener('input', (e) => {
    state.invoiceNumber = e.target.value;
    DOM.previewInvNumber.textContent = state.invoiceNumber || '-';
  });

  DOM.invDate.addEventListener('change', (e) => {
    state.invoiceDate = e.target.value;
    DOM.previewInvDate.textContent = formatIsoToDisplayDate(state.invoiceDate);
  });
  DOM.invDate.addEventListener('input', (e) => {
    state.invoiceDate = e.target.value;
    DOM.previewInvDate.textContent = formatIsoToDisplayDate(state.invoiceDate);
  });

  DOM.clientName.addEventListener('input', (e) => {
    state.client.name = e.target.value;
    DOM.previewClientName.textContent = state.client.name || '-';
  });

  DOM.clientCompany.addEventListener('input', (e) => {
    state.client.company = e.target.value;
    DOM.previewClientCompany.textContent = state.client.company || '';
    DOM.previewClientCompany.style.display = state.client.company ? 'block' : 'none';
  });

  // Contact Type Dropdown
  if (DOM.selectContactType) {
    DOM.selectContactType.addEventListener('change', (e) => {
      state.client.contactType = e.target.value;
      if (state.client.contactType === 'phone') {
        if (DOM.contactPhoneGroup) DOM.contactPhoneGroup.style.display = 'block';
        if (DOM.contactEmailGroup) DOM.contactEmailGroup.style.display = 'none';
      } else {
        if (DOM.contactPhoneGroup) DOM.contactPhoneGroup.style.display = 'none';
        if (DOM.contactEmailGroup) DOM.contactEmailGroup.style.display = 'block';
      }
      updateClientContactPreview();
    });
  }

  // Country Code Dropdown
  if (DOM.selectCountryCode) {
    DOM.selectCountryCode.addEventListener('change', (e) => {
      state.client.countryCode = e.target.value;
      updateClientContactPreview();
    });
  }

  // Phone input with auto dash (-)
  if (DOM.inputClientPhone) {
    DOM.inputClientPhone.addEventListener('input', (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      state.client.phone = formatted;
      e.target.value = formatted;
      updateClientContactPreview();
    });
  }

  // Email input with @ requirement validation
  if (DOM.inputClientEmail) {
    DOM.inputClientEmail.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      state.client.email = val;

      if (val.length > 0 && !val.includes('@')) {
        if (DOM.emailValidationHelper) DOM.emailValidationHelper.style.display = 'block';
        DOM.inputClientEmail.classList.add('input-invalid');
      } else {
        if (DOM.emailValidationHelper) DOM.emailValidationHelper.style.display = 'none';
        DOM.inputClientEmail.classList.remove('input-invalid');
      }
      updateClientContactPreview();
    });
  }

  // Paid amount input with auto-formatting
  DOM.paidAmount.addEventListener('input', (e) => {
    const raw = parseNumber(e.target.value);
    state.paidAmount = raw;
    e.target.value = formatThousand(raw);
    updateCalculationsAndPreview();
  });

  DOM.selectKurangLabel.addEventListener('change', (e) => {
    state.kurangLabel = e.target.value;
    updateCalculationsAndPreview();
  });

  // Company editable fields
  DOM.companyName.addEventListener('input', (e) => {
    state.company.name = e.target.value;
    DOM.previewCompanyName.textContent = state.company.name;
  });
  DOM.companyPhone.addEventListener('input', (e) => {
    state.company.phone = e.target.value;
    DOM.previewCompanyPhone.textContent = state.company.phone;
  });
  DOM.companyEmail.addEventListener('input', (e) => {
    state.company.email = e.target.value;
    DOM.previewCompanyEmail.textContent = state.company.email;
    DOM.previewFooterEmail.textContent = state.company.email;
  });
  DOM.companyWeb.addEventListener('input', (e) => {
    state.company.web = e.target.value;
    DOM.previewCompanyWeb.textContent = state.company.web;
  });
  DOM.bankName.addEventListener('input', (e) => {
    state.company.bankName = e.target.value;
    DOM.previewBankName.textContent = state.company.bankName;
  });
  DOM.bankAcc.addEventListener('input', (e) => {
    state.company.bankAcc = e.target.value;
    DOM.previewBankAcc.textContent = state.company.bankAcc;
  });
  DOM.bankHolder.addEventListener('input', (e) => {
    state.company.bankHolder = e.target.value;
    DOM.previewBankHolder.textContent = state.company.bankHolder;
  });
  DOM.signName.addEventListener('input', (e) => {
    state.company.signName = e.target.value;
    DOM.previewSignName.textContent = state.company.signName;
  });
  DOM.signRole.addEventListener('input', (e) => {
    state.company.signRole = e.target.value;
    DOM.previewSignRole.textContent = state.company.signRole;
  });
  DOM.footerAddress.addEventListener('input', (e) => {
    state.company.footerAddress = e.target.value;
    DOM.previewFooterAddress.innerHTML = state.company.footerAddress.replace(/\n/g, '<br>');
  });

  DOM.btnAddItem.addEventListener('click', () => {
    state.items.push({ description: '', qty: 1, price: 0 });
    renderItemInputs();
    updateCalculationsAndPreview();
  });
}

/**
 * Renders the editable item input rows in left panel
 */
function renderItemInputs() {
  DOM.itemsContainer.innerHTML = '';

  state.items.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'item-row-card';

    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const lineTotal = qty * price;

    card.innerHTML = `
      <div class="item-grid-desktop">
        <div class="col-desc">
          <input type="text" class="form-control form-control-sm item-desc-input" placeholder="Deskripsi Jasa / Produk" value="${escapeHtml(item.description)}">
        </div>
        <div class="col-qty">
          <input type="number" class="form-control form-control-sm item-qty-input" placeholder="Qty" min="1" value="${item.qty}">
        </div>
        <div class="col-price">
          <div class="input-prefix-wrapper">
            <span class="input-prefix" style="font-size: 10px; left: 6px;">Rp</span>
            <input type="text" class="form-control form-control-sm item-price-input" style="padding-left: 24px; font-size: 11.5px; text-align: right;" placeholder="0" value="${formatThousand(item.price)}">
          </div>
        </div>
        <div class="col-total">
          <span class="item-line-total-badge">${formatRupiah(lineTotal)}</span>
        </div>
        <div class="col-action">
          <button type="button" class="btn-remove-item" title="Hapus Item" ${state.items.length <= 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;

    // Event listeners for item inputs
    const descInput = card.querySelector('.item-desc-input');
    const qtyInput = card.querySelector('.item-qty-input');
    const priceInput = card.querySelector('.item-price-input');
    const totalBadge = card.querySelector('.item-line-total-badge');
    const removeBtn = card.querySelector('.btn-remove-item');

    function updateRowTotal() {
      const q = Number(state.items[index].qty) || 0;
      const p = Number(state.items[index].price) || 0;
      if (totalBadge) totalBadge.textContent = formatRupiah(q * p);
    }

    descInput.addEventListener('input', (e) => {
      state.items[index].description = e.target.value;
      updateCalculationsAndPreview();
    });

    qtyInput.addEventListener('input', (e) => {
      const q = parseInt(e.target.value, 10) || 0;
      state.items[index].qty = q;
      updateRowTotal();
      updateCalculationsAndPreview();
    });

    priceInput.addEventListener('input', (e) => {
      const p = parseNumber(e.target.value);
      state.items[index].price = p;
      e.target.value = formatThousand(p);
      updateRowTotal();
      updateCalculationsAndPreview();
    });

    if (state.items.length > 1) {
      removeBtn.addEventListener('click', () => {
        state.items.splice(index, 1);
        renderItemInputs();
        updateCalculationsAndPreview();
      });
    }

    DOM.itemsContainer.appendChild(card);
  });
}

/**
 * Calculate Subtotal, Total, Paid, and Kurang amounts
 * Updates the Live Invoice Preview table & totals
 */
function updateCalculationsAndPreview() {
  let total = 0;

  // 1. Render Table Rows in Invoice Preview
  DOM.previewItemsBody.innerHTML = '';
  state.items.forEach(item => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    const lineTotal = qty * price;
    total += lineTotal;

    const hasContent = (item.description && item.description.trim().length > 0) || price > 0;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="td-desc">${escapeHtml(item.description || '-')}</td>
      <td class="td-qty">${hasContent ? qty : '-'}</td>
      <td class="td-price">${hasContent ? formatRupiah(price) : '-'}</td>
      <td class="td-total">${hasContent ? formatRupiah(lineTotal) : '-'}</td>
    `;
    DOM.previewItemsBody.appendChild(tr);
  });

  // 2. Subtotal & Total display
  DOM.displaySubtotal.textContent = formatRupiah(total);
  DOM.previewTotal.textContent = formatRupiah(total);

  // 3. Paid Amount & Kurang Logic
  const paid = Math.max(0, state.paidAmount);
  DOM.statusDisplayPaid.textContent = formatRupiah(paid);

  // Core Rule:
  // Kalo uangnya lunas (paid >= total && total > 0):
  // Maka dibawah tulisan sudah dibayar TIDAK ADA.
  // Kalo uang yang diinput kurang (paid < total):
  // Maka akan ada tulisan kurang ... dibawah sudah dibayar.
  const isLunas = paid >= total && total > 0;
  const kurang = Math.max(0, total - paid);

  if (isLunas) {
    // LUNAS CASE
    DOM.paymentStatusCard.className = 'status-card status-paid';
    DOM.statusTitle.textContent = 'Status: LUNAS PENUH';
    DOM.statusKurangRow.style.display = 'none';
    DOM.statusDescription.textContent = 'Tagihan telah LUNAS. Tulisan sisa kurang di bawah "Sudah Di bayar" otomatis ditiadakan dari invoice.';

    // In Invoice Preview:
    DOM.previewPaid.textContent = formatRupiah(paid);
    DOM.previewKurangRow.style.display = 'none'; // Sembunyikan baris Kurang / Pelunasan
  } else if (paid === 0 && total === 0) {
    // Kosongan / Initial Blank state
    DOM.paymentStatusCard.className = 'status-card status-pending';
    DOM.statusTitle.textContent = 'Status: Form Kosong (Siap Diisi)';
    DOM.statusKurangRow.style.display = 'none';
    DOM.statusDescription.textContent = 'Silakan isi nomor invoice, klien, dan item tagihan.';
    DOM.previewPaid.textContent = formatRupiah(0);
    DOM.previewKurangRow.style.display = 'none';
  } else {
    // KURANG / BELUM LUNAS CASE
    DOM.paymentStatusCard.className = 'status-card status-pending';
    DOM.statusTitle.textContent = 'Status: BELUM LUNAS (Ada Sisa Kurang)';
    DOM.statusKurangRow.style.display = 'flex';
    DOM.statusKurangLabel.textContent = `Sisa ${state.kurangLabel}:`;
    DOM.statusDisplayKurang.textContent = formatRupiah(kurang);
    DOM.statusDescription.innerHTML = `Baris <strong>${escapeHtml(state.kurangLabel)} ${formatRupiah(kurang)}</strong> akan ditampilkan di bawah "Sudah Di bayar".`;

    // In Invoice Preview:
    DOM.previewPaid.textContent = formatRupiah(paid);
    DOM.previewKurangRow.style.display = 'flex'; // Tampilkan baris Kurang / Pelunasan
    DOM.previewKurangLabel.textContent = state.kurangLabel;
    DOM.previewKurang.textContent = formatRupiah(kurang);
  }

  // Update header and client fields in preview
  DOM.previewInvNumber.textContent = state.invoiceNumber || '-';
  DOM.previewInvDate.textContent = formatIsoToDisplayDate(state.invoiceDate);
  DOM.previewClientName.textContent = state.client.name || '-';
  DOM.previewClientCompany.textContent = state.client.company || '';
  DOM.previewClientCompany.style.display = state.client.company ? 'block' : 'none';
  updateClientContactPreview();
}

/**
 * Bind Action buttons: Print, PDF, PNG, Sample, Reset
 */
function bindActionButtons() {
  // Quick payment chips
  DOM.btnPayFull.addEventListener('click', () => {
    let total = calculateTotal();
    state.paidAmount = total;
    DOM.paidAmount.value = formatThousand(total);
    updateCalculationsAndPreview();
  });

  DOM.btnPay50.addEventListener('click', () => {
    let total = calculateTotal();
    let dp = Math.round(total * 0.5);
    state.paidAmount = dp;
    DOM.paidAmount.value = formatThousand(dp);
    updateCalculationsAndPreview();
  });

  DOM.btnPay30.addEventListener('click', () => {
    let total = calculateTotal();
    let dp = Math.round(total * 0.3);
    state.paidAmount = dp;
    DOM.paidAmount.value = formatThousand(dp);
    updateCalculationsAndPreview();
  });

  DOM.btnPayZero.addEventListener('click', () => {
    state.paidAmount = 0;
    DOM.paidAmount.value = '0';
    updateCalculationsAndPreview();
  });

  // Reset / Clear Form
  DOM.btnClearForm.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan data form?')) {
      state = JSON.parse(JSON.stringify(defaultState));
      syncInputsFromState();
      renderItemInputs();
      updateCalculationsAndPreview();
      showNotification('Form berhasil dikosongkan.');
    }
  });

  // Native Print
  DOM.btnPrint.addEventListener('click', () => {
    window.print();
  });

  // Download PDF via html2pdf
  DOM.btnDownloadPdf.addEventListener('click', () => {
    downloadInvoicePDF();
  });

  // Download Image PNG via html2canvas
  DOM.btnDownloadImg.addEventListener('click', () => {
    downloadInvoicePNG();
  });
}

function calculateTotal() {
  return state.items.reduce((sum, it) => sum + ((Number(it.qty) || 0) * (Number(it.price) || 0)), 0);
}

function syncInputsFromState() {
  DOM.invNumber.value = state.invoiceNumber;
  DOM.invDate.value = state.invoiceDate;
  DOM.clientName.value = state.client.name;
  DOM.clientCompany.value = state.client.company;

  if (DOM.selectContactType) DOM.selectContactType.value = state.client.contactType || 'phone';
  if (DOM.selectCountryCode) DOM.selectCountryCode.value = state.client.countryCode || '+62';
  if (DOM.inputClientPhone) DOM.inputClientPhone.value = state.client.phone || '';
  if (DOM.inputClientEmail) DOM.inputClientEmail.value = state.client.email || '';

  if (state.client.contactType === 'email') {
    if (DOM.contactPhoneGroup) DOM.contactPhoneGroup.style.display = 'none';
    if (DOM.contactEmailGroup) DOM.contactEmailGroup.style.display = 'block';
  } else {
    if (DOM.contactPhoneGroup) DOM.contactPhoneGroup.style.display = 'block';
    if (DOM.contactEmailGroup) DOM.contactEmailGroup.style.display = 'none';
  }

  if (DOM.emailValidationHelper) DOM.emailValidationHelper.style.display = 'none';
  if (DOM.inputClientEmail) DOM.inputClientEmail.classList.remove('input-invalid');

  DOM.paidAmount.value = state.paidAmount > 0 ? formatThousand(state.paidAmount) : '';
  DOM.selectKurangLabel.value = state.kurangLabel;

  DOM.companyName.value = state.company.name;
  DOM.companyPhone.value = state.company.phone;
  DOM.companyEmail.value = state.company.email;
  DOM.companyWeb.value = state.company.web;
  DOM.bankName.value = state.company.bankName;
  DOM.bankAcc.value = state.company.bankAcc;
  DOM.bankHolder.value = state.company.bankHolder;
  DOM.signName.value = state.company.signName;
  DOM.signRole.value = state.company.signRole;
  DOM.footerAddress.value = state.company.footerAddress;
}

// ==========================================================================
// Zoom & Fit Controls
// ==========================================================================

function bindZoomControls() {
  DOM.btnZoomIn.addEventListener('click', () => {
    setZoom(currentZoom + 0.1);
  });
  DOM.btnZoomOut.addEventListener('click', () => {
    setZoom(currentZoom - 0.1);
  });
  DOM.btnZoomReset.addEventListener('click', () => {
    setZoom(1.0);
  });
}

function setZoom(val) {
  currentZoom = Math.min(Math.max(0.28, val), 1.8);
  DOM.sheetWrapper.style.transform = `scale(${currentZoom})`;
  DOM.zoomText.textContent = `${Math.round(currentZoom * 100)}%`;

  // Adjust bottom margin to eliminate empty vertical whitespace when scaled down on mobile
  if (currentZoom < 1.0) {
    const a4HeightPx = 1123;
    const scaledHeight = a4HeightPx * currentZoom;
    const diff = a4HeightPx - scaledHeight;
    DOM.sheetWrapper.style.marginBottom = `-${diff - 16}px`;
  } else {
    DOM.sheetWrapper.style.marginBottom = '0px';
  }
}

function autoFitPreview() {
  if (!DOM.previewViewport) return;
  const paddingOffset = window.innerWidth <= 768 ? 20 : 50;
  const viewportWidth = DOM.previewViewport.clientWidth - paddingOffset;
  // A4 width in px at 96 DPI: 210mm ~ 794px
  const a4Width = 794;
  if (viewportWidth < a4Width && viewportWidth > 0) {
    const fit = Math.floor((viewportWidth / a4Width) * 100) / 100;
    setZoom(fit);
  } else {
    setZoom(1.0);
  }
}

// ==========================================================================
// PDF & Image Export
// ==========================================================================

async function downloadInvoicePDF() {
  const element = document.getElementById('invoice-sheet');
  if (!element) return;

  const btn = DOM.btnDownloadPdf;
  const originalText = btn.innerHTML;
  btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> Memproses...`;
  btn.disabled = true;

  // Temporarily reset zoom/scale transform so html2pdf captures standard 1:1 crisp dimensions
  const wrapper = DOM.sheetWrapper;
  const prevTransform = wrapper ? wrapper.style.transform : '';
  const prevMargin = wrapper ? wrapper.style.marginBottom : '';

  try {
    if (wrapper) {
      wrapper.style.transform = 'none';
      wrapper.style.marginBottom = '0px';
    }

    // Generate clean filename
    const sanitizedNumber = (state.invoiceNumber || 'DRAFT').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `INVOICE_${sanitizedNumber}.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    if (window.html2pdf) {
      // Generate PDF and guarantee strictly 1 page (delete any blank trailing pages)
      await html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          const totalPages = pdf.internal.getNumberOfPages();
          for (let i = totalPages; i > 1; i--) {
            pdf.deletePage(i);
          }
        })
        .save();

      showNotification(`File ${filename} berhasil diunduh (1 Halaman)!`);
    } else {
      window.print();
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Gagal mendownload PDF otomatis. Membuka dialog print browser...');
    window.print();
  } finally {
    if (wrapper) {
      wrapper.style.transform = prevTransform;
      wrapper.style.marginBottom = prevMargin;
    }
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function downloadInvoicePNG() {
  const element = document.getElementById('invoice-sheet');
  if (!element || !window.html2canvas) return;

  const btn = DOM.btnDownloadImg;
  btn.disabled = true;

  const wrapper = DOM.sheetWrapper;
  const prevTransform = wrapper ? wrapper.style.transform : '';
  const prevMargin = wrapper ? wrapper.style.marginBottom : '';

  try {
    if (wrapper) {
      wrapper.style.transform = 'none';
      wrapper.style.marginBottom = '0px';
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollY: 0,
      scrollX: 0
    });

    const link = document.createElement('a');
    const sanitizedNumber = (state.invoiceNumber || 'DRAFT').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `INVOICE_${sanitizedNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showNotification(`File ${link.download} berhasil diunduh!`);
  } catch (err) {
    console.error('Error generating PNG:', err);
    alert('Gagal membuat gambar PNG.');
  } finally {
    if (wrapper) {
      wrapper.style.transform = prevTransform;
      wrapper.style.marginBottom = prevMargin;
    }
    btn.disabled = false;
  }
}

// Notification Toast
function showNotification(msg) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #10b981;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      z-index: 9999;
      opacity: 0;
      transform: translateY(10px);
      transition: all 0.25s ease;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3000);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Launch app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', init);
