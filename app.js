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
    contact: ''
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
  clientContact: document.getElementById('input-client-contact'),
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
  previewFooterEmail: document.getElementById('preview-footer-email')
};

// ==========================================================================
// Initialization & Render
// ==========================================================================

function init() {
  bindFormInputs();
  bindActionButtons();
  bindZoomControls();
  renderItemInputs();
  updateCalculationsAndPreview();
  autoFitPreview();

  window.addEventListener('resize', () => {
    autoFitPreview();
  });
}

/**
 * Bind form change listeners
 */
function bindFormInputs() {
  DOM.invNumber.addEventListener('input', (e) => {
    state.invoiceNumber = e.target.value;
    DOM.previewInvNumber.textContent = state.invoiceNumber || '-';
  });

  DOM.invDate.addEventListener('input', (e) => {
    state.invoiceDate = e.target.value;
    DOM.previewInvDate.textContent = state.invoiceDate || '-';
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

  DOM.clientContact.addEventListener('input', (e) => {
    state.client.contact = e.target.value;
    DOM.previewClientContact.textContent = state.client.contact || '';
  });

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

    card.innerHTML = `
      <div class="item-row-top">
        <input type="text" class="form-control item-desc-input" placeholder="Deskripsi Jasa / Produk" value="${escapeHtml(item.description)}">
      </div>
      <div class="item-row-bottom">
        <input type="number" class="form-control item-qty-input" placeholder="Qty" min="1" value="${item.qty}">
        <div class="input-prefix-wrapper">
          <span class="input-prefix" style="font-size: 11px; left: 8px;">Rp</span>
          <input type="text" class="form-control item-price-input" style="padding-left: 28px; font-size: 12px;" placeholder="Harga" value="${formatThousand(item.price)}">
        </div>
        <button type="button" class="btn-remove-item" title="Hapus Item" ${state.items.length <= 1 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    // Event listeners for item inputs
    const descInput = card.querySelector('.item-desc-input');
    const qtyInput = card.querySelector('.item-qty-input');
    const priceInput = card.querySelector('.item-price-input');
    const removeBtn = card.querySelector('.btn-remove-item');

    descInput.addEventListener('input', (e) => {
      state.items[index].description = e.target.value;
      updateCalculationsAndPreview();
    });

    qtyInput.addEventListener('input', (e) => {
      const q = parseInt(e.target.value, 10) || 0;
      state.items[index].qty = q;
      updateCalculationsAndPreview();
    });

    priceInput.addEventListener('input', (e) => {
      const p = parseNumber(e.target.value);
      state.items[index].price = p;
      e.target.value = formatThousand(p);
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
  DOM.previewInvDate.textContent = state.invoiceDate || '-';
  DOM.previewClientName.textContent = state.client.name || '-';
  DOM.previewClientCompany.textContent = state.client.company || '';
  DOM.previewClientCompany.style.display = state.client.company ? 'block' : 'none';
  DOM.previewClientContact.textContent = state.client.contact || '';
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
  DOM.clientContact.value = state.client.contact;
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
  currentZoom = Math.min(Math.max(0.4, val), 1.8);
  DOM.sheetWrapper.style.transform = `scale(${currentZoom})`;
  DOM.zoomText.textContent = `${Math.round(currentZoom * 100)}%`;
}

function autoFitPreview() {
  if (!DOM.previewViewport) return;
  const viewportWidth = DOM.previewViewport.clientWidth - 60;
  // A4 width in px at 96 DPI: 210mm ~ 794px
  const a4Width = 794;
  if (viewportWidth < a4Width) {
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
  btn.innerHTML = `<span style="display:inline-block;animation:spin 1s linear infinite">⏳</span> Memproses PDF...`;
  btn.disabled = true;

  try {
    // Generate filename
    const sanitizedNumber = (state.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `INVOICE_WEBCARE_${sanitizedNumber}.pdf`;

    const opt = {
      margin: 0,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        logging: false
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      }
    };

    if (window.html2pdf) {
      await html2pdf().set(opt).from(element).save();
      showNotification(`File ${filename} berhasil diunduh!`);
    } else {
      window.print();
    }
  } catch (err) {
    console.error('Error generating PDF:', err);
    alert('Gagal mendownload PDF otomatis. Membuka dialog print browser...');
    window.print();
  } finally {
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
}

async function downloadInvoicePNG() {
  const element = document.getElementById('invoice-sheet');
  if (!element || !window.html2canvas) return;

  const btn = DOM.btnDownloadImg;
  btn.disabled = true;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const link = document.createElement('a');
    const sanitizedNumber = (state.invoiceNumber || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `INVOICE_WEBCARE_${sanitizedNumber}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showNotification('Gambar invoice berhasil disimpan!');
  } catch (err) {
    console.error('Error generating PNG:', err);
    alert('Gagal menyimpan gambar invoice.');
  } finally {
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
