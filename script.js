const factorMatrix = {
  36: { 5: 2.92, 10: 2.75, 15: 2.58 },
  48: { 5: 2.32, 10: 2.15, 15: 1.98 },
  54: { 5: 2.12, 10: 1.95, 15: 1.78 },
  60: { 5: 1.94, 10: 1.78, 15: 1.62 }
};

let currentOffer = null;
let logoDataUrl = null;

const euro = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
const number = new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const $ = (id) => document.getElementById(id);

function parseGermanCurrency(value) {
  if (!value) return NaN;
  const normalized = String(value).replace(/\s/g, '').replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  return Number.parseFloat(normalized);
}

function setText(id, value) { $(id).textContent = value; }

function todayGerman() {
  return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
}

function safeFilePart(value) {
  return String(value || 'Firma')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/_+/g, '_') || 'Firma';
}

async function loadLogo() {
  try {
    const response = await fetch('beam.deals.png');
    const blob = await response.blob();
    logoDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logoDataUrl = null;
  }
}
loadLogo();

function calculateOffer() {
  const price = parseGermanCurrency($('price').value);
  const term = Number($('term').value);
  const residualPercent = Number($('residual').value);
  const priceOk = Number.isFinite(price) && price > 0;

  $('price').classList.toggle('invalid', !priceOk);
  $('term').classList.toggle('invalid', !term);
  $('residual').classList.toggle('invalid', !residualPercent);
  $('priceError').classList.toggle('show-error', !priceOk);

  if (!priceOk || !term || !residualPercent) return null;

  const factor = factorMatrix[term]?.[residualPercent];
  $('comboError').classList.toggle('show-error', !factor);
  if (!factor) return null;

  const deposit = 0;
  const residualValue = price * residualPercent / 100;
  const monthlyRate = price * factor / 100;

  return { price, term, residualPercent, residualValue, deposit, factor, monthlyRate };
}

function renderOffer(offer) {
  setText('monthlyRate', number.format(offer.monthlyRate));
  setText('summaryPrice', euro.format(offer.price));
  setText('summaryTerm', `${offer.term} Monate`);
  setText('summaryDeposit', euro.format(offer.deposit));
  setText('summaryResidual', euro.format(offer.residualValue));
  setText('summaryFactor', `${number.format(offer.factor)} %`);
  setText('summaryRate', number.format(offer.monthlyRate));
}

$('rateForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const offer = calculateOffer();
  if (!offer) return;
  currentOffer = offer;
  renderOffer(offer);
  $('offerSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

$('price').addEventListener('blur', () => {
  const value = parseGermanCurrency($('price').value);
  if (Number.isFinite(value)) $('price').value = number.format(value);
});

$('editButton').addEventListener('click', () => $('calculator').scrollIntoView({ behavior: 'smooth', block: 'start' }));

function validateRateInputs() {
  const recalculated = calculateOffer();
  if (!recalculated) return false;
  currentOffer = recalculated;
  renderOffer(currentOffer);
  return true;
}

function validateOfferForm() {
  const required = ['financeType', 'salutation', 'firstName', 'lastName', 'company', 'address', 'zip', 'city'];
  let valid = validateRateInputs();

  required.forEach((id) => {
    const field = $(id);
    const ok = field.value.trim().length > 0;
    field.classList.toggle('invalid', !ok);
    valid = valid && ok;
  });

  $('offerError').classList.toggle('show-error', !valid);
  return valid;
}

function getFormData() {
  return {
    financeType: $('financeType').value.trim(),
    salutation: $('salutation').value.trim(),
    firstName: $('firstName').value.trim(),
    lastName: $('lastName').value.trim(),
    company: $('company').value.trim(),
    address: $('address').value.trim(),
    zip: $('zip').value.trim(),
    city: $('city').value.trim()
  };
}

function greeting(data) {
  const title = data.salutation === 'Frau' ? 'Sehr geehrte Frau' : 'Sehr geehrter Herr';
  return `${title} ${data.lastName},`;
}

function addWrappedText(doc, text, x, y, maxWidth, lineHeight) {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + (lines.length * lineHeight);
}

function drawOfferPdf(doc, data) {
  const offer = currentOffer;
  const date = todayGerman();

  doc.setProperties({
    title: `Finanzierungsangebot: ${data.financeType}`,
    subject: `Finanzierungsangebot ${data.financeType} für ${data.company}`,
    author: 'beamdeals GmbH',
    creator: 'beamdeals Finanzierungsrechner'
  });

  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', 18, 18, 40, 13);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('beam.deals', 18, 27);
  }

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('beamdeals GmbH, Siemensstrasse 11, 40789 Monheim am Rhein', 18, 55);
  doc.line(18, 56.2, 98, 56.2);

  doc.setFontSize(10.5);
  doc.text(data.company, 18, 66);
  doc.text(data.address, 18, 73);
  doc.text(`${data.zip} ${data.city}`, 18, 80);

  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Datum:', 142, 44);
  doc.text(date, 170, 44);

  doc.setFont('helvetica', 'bold');
  doc.text('beamdeals GmbH', 158, 57, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Siemensstrasse 11', 158, 64, { align: 'center' });
  doc.text('40789 Monheim am Rhein', 158, 71, { align: 'center' });
  doc.text('Tel.: +49 2383 6590790', 158, 78, { align: 'center' });
  doc.text('info@beamdeals.de', 158, 85, { align: 'center' });
  doc.text('https://beamdeals.de', 158, 92, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Finanzierungsangebot: ${data.financeType}`, 18, 112);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(greeting(data), 18, 128);
  doc.text('vielen Dank für das entgegengebrachte Vertrauen! Wie folgt bieten wir Ihnen unverbindlich an:', 18, 143);

  const labelX = 68;
  const valueX = 118;
  let y = 160;
  const rows = [
    ['Anschaffungspreis:', euro.format(offer.price)],
    ['Laufzeit:', `${offer.term} Monate`],
    ['Mietsonderzahlung:', euro.format(offer.deposit)],
    ['Monatliche Rate:', euro.format(offer.monthlyRate)],
    ['Rate in %:', `${number.format(offer.factor)} %`],
    ['kalk. Restwert:', euro.format(offer.residualValue)]
  ];

  doc.setFontSize(10.5);
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, labelX, y);
    doc.setFont('helvetica', 'bold');
    doc.text(value, valueX, y);
    y += 7;
  });

  y += 10;
  if (data.financeType === 'Mietkauf') {
    doc.setFont('helvetica', 'bold');
    doc.text('Hinweis: Die gesetzl. Mehrwertsteuer fällt vorab auf die Summe aller Zahlungen an.', 18, y);
    y += 14;
  }

  doc.setFont('helvetica', 'normal');
  y = addWrappedText(doc, 'Die oben genannten Preise verstehen sich netto, zuzüglich der gesetzlichen Mehrwertsteuer.', 18, y, 174, 5.5);
  y += 8;
  y = addWrappedText(doc, 'Wir freuen uns, für Sie tätig werden zu können und sichern Ihnen bereits jetzt eine faire, schnelle und unbürokratische Abwicklung zu.', 18, y, 174, 5.5);
  y += 16;

  doc.text('Mit freundlichen Grüßen,', 18, y);
  doc.setFont('helvetica', 'bold');
  doc.text('beamdeals GmbH', 18, y + 7);

  doc.setDrawColor(180, 190, 200);
  doc.line(18, 258, 192, 258);

  doc.setFontSize(7.5);
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(['beamdeals GmbH', 'Siemensstrasse 11', '40789 Monheim am Rhein', 'Tel.: +49 2383 6590790', 'info@beamdeals.de', 'https://beamdeals.de'], 18, 263);
  doc.text(['USt-IdNr.: DE460134975', 'Steuernummer: 5135/5707/573', 'Amtsgericht Hilden HRB 111624', 'GF: Marcel Ebbert und Frank Azzara'], 78, 263);
  doc.text(['beamdeals GmbH', 'Dortmunder Volksbank', 'IBAN: DE37 4416 0014 6727 4540 00', 'BIC: GENODEM1DOR'], 145, 263);
}

function generatePdf() {
  if (!window.jspdf?.jsPDF) {
    alert('PDF-Modul konnte nicht geladen werden. Bitte prüfen Sie die Internetverbindung oder hosten Sie jsPDF lokal.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const data = getFormData();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  drawOfferPdf(doc, data);

  const fileName = `${safeFilePart(data.financeType)}_${safeFilePart(data.company)}_${todayGerman()}_beam.deals.pdf`;
  doc.save(fileName);
}

$('offerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!validateOfferForm()) return;
  generatePdf();
});
