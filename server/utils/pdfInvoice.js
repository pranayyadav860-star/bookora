// server/utils/pdfInvoice.js
// Premium Hotel Booking Invoice — design matched to React InvoiceGenerator component
// Produces a PDF buffer with crisp layout, brand colours and print‑ready quality

"use strict";

/* ─────────────────────────────────────────────────────────────────────────────
   COLOUR PALETTE (matches React component)
───────────────────────────────────────────────────────────────────────────── */
const C = {
  brand:      [0.082, 0.376, 0.424],   // #155F6C (teal-dark) – header bg
  brandLight: [0.941, 0.980, 0.984],   // #F0FAFB (teal-tint) – section bg
  accent:     [0.918, 0.702, 0.196],   // #EAB332 (gold) – highlights, badges
  success:    [0.133, 0.773, 0.369],   // #22C55E (green) – confirmed badge
  text:       [0.102, 0.118, 0.137],   // #1A1E23
  muted:      [0.435, 0.467, 0.514],   // #6F7783
  border:     [0.878, 0.890, 0.906],   // #E0E3E7
  white:      [1,     1,     1    ],
  red:        [0.937, 0.267, 0.267],   // #EF4444 – cancelled badge
};

/* ─────────────────────────────────────────────────────────────────────────────
   TINY PDF BUILDER (same as before, with all required drawing methods)
───────────────────────────────────────────────────────────────────────────── */
class PDFBuilder {
  constructor(w = 595, h = 842) {
    this.W = w;
    this.H = h;
    this._stream = [];
  }

  setFill([r, g, b])   { this._stream.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg`); return this; }
  setStroke([r, g, b]) { this._stream.push(`${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG`); return this; }
  setLineWidth(w)      { this._stream.push(`${w} w`); return this; }

  rect(x, y, w, h, fill = C.white, stroke = null, lw = 0.5) {
    this.setFill(fill);
    if (stroke) { this.setStroke(stroke); this.setLineWidth(lw); }
    const op = stroke ? "b" : "f";
    this._stream.push(`${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re ${op}`);
    return this;
  }

  roundRect(x, y, w, h, r, fill, stroke = null, lw = 0.5) {
    const k = 0.5523;
    this.setFill(fill);
    if (stroke) { this.setStroke(stroke); this.setLineWidth(lw); }
    const op = stroke ? "b" : "f";
    this._stream.push([
      `${(x + r).toFixed(2)} ${y.toFixed(2)} m`,
      `${(x + w - r).toFixed(2)} ${y.toFixed(2)} l`,
      `${(x + w - r + k*r).toFixed(2)} ${y.toFixed(2)} ${(x + w).toFixed(2)} ${(y + k*r).toFixed(2)} ${(x + w).toFixed(2)} ${(y + r).toFixed(2)} c`,
      `${(x + w).toFixed(2)} ${(y + h - r).toFixed(2)} l`,
      `${(x + w).toFixed(2)} ${(y + h - r + k*r).toFixed(2)} ${(x + w - k*r).toFixed(2)} ${(y + h).toFixed(2)} ${(x + w - r).toFixed(2)} ${(y + h).toFixed(2)} c`,
      `${(x + r).toFixed(2)} ${(y + h).toFixed(2)} l`,
      `${(x + r - k*r).toFixed(2)} ${(y + h).toFixed(2)} ${x.toFixed(2)} ${(y + h - k*r).toFixed(2)} ${x.toFixed(2)} ${(y + h - r).toFixed(2)} c`,
      `${x.toFixed(2)} ${(y + r).toFixed(2)} l`,
      `${x.toFixed(2)} ${(y + r - k*r).toFixed(2)} ${(x + r - k*r).toFixed(2)} ${y.toFixed(2)} ${(x + r).toFixed(2)} ${y.toFixed(2)} c`,
      op
    ].join("\n"));
    return this;
  }

  hline(x1, y, x2, color = C.border, lw = 0.5) {
    this.setStroke(color).setLineWidth(lw);
    this._stream.push(`${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`);
    return this;
  }

  vline(x, y1, y2, color = C.border, lw = 0.5) {
    this.setStroke(color).setLineWidth(lw);
    this._stream.push(`${x.toFixed(2)} ${y1.toFixed(2)} m ${x.toFixed(2)} ${y2.toFixed(2)} l S`);
    return this;
  }

  text(str, x, yTop, size, color = C.text, font = "F1") {
    const y = this.H - yTop - size * 0.75;
    this.setFill(color);
    this._stream.push(`BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${this._escape(str)}) Tj ET`);
    return this;
  }

  textR(str, xRight, yTop, size, color = C.text, font = "F1") {
    const est = String(str).length * size * 0.52;
    return this.text(str, xRight - est, yTop, size, color, font);
  }

  textC(str, xLeft, xRight, yTop, size, color = C.text, font = "F1") {
    const est = String(str).length * size * 0.52;
    const x = xLeft + (xRight - xLeft - est) / 2;
    return this.text(str, x, yTop, size, color, font);
  }

  _escape(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  _content() {
    return this._stream.join("\n");
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn), b = new Date(checkOut);
  if (isNaN(a) || isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86400000));
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT – generates PDF that exactly matches React InvoiceGenerator
───────────────────────────────────────────────────────────────────────────── */
async function generatePDFInvoice(bookingData, guestDetails, hotelDetails) {
  const p = new PDFBuilder(595, 842);
  const W = p.W, H = p.H;
  const ML = 45, MR = W - 45;
  const CW = MR - ML;

  const nights = nightsBetween(bookingData.checkIn, bookingData.checkOut);
  const perNight = bookingData.amount ? Math.round(bookingData.amount / nights) : 0;
  const taxes = Math.round(bookingData.amount * 0.12);   // 12% GST estimate
  const subTotal = bookingData.amount - taxes;
  const bId = bookingData.bookingId || "—";
  const status = (bookingData.status || "Confirmed").toUpperCase();
  const statusColor = status === "CONFIRMED" ? C.success : status === "CANCELLED" ? C.red : C.muted;

  // ─────────────────────────────────────────────────────────────────────────
  // HEADER (dark teal, full width)
  const HDR_H = 110;
  p.rect(0, 0, W, HDR_H, C.brand);
  p.text("BOOKORA", ML, 22, 26, C.white, "F2");
  p.text("Luxury Hotel Booking Platform", ML, 52, 9, [0.7, 0.85, 0.88]);

  // "TAX INVOICE" gold pill
  p.roundRect(MR - 120, 18, 120, 30, 6, C.accent);
  p.text("TAX INVOICE", MR - 108, 26, 11, C.brand, "F2");

  p.textR(`Invoice No: ${bId}`, MR, 54, 8, [0.85, 0.95, 0.97]);
  p.textR(`Date: ${fmtDate(bookingData.createdAt || new Date())}`, MR, 66, 8, [0.85, 0.95, 0.97]);

  p.hline(0, HDR_H - 4, W, C.accent, 3);

  // ─────────────────────────────────────────────────────────────────────────
  // BOOKING STATUS BAR
  let Y = HDR_H + 18;
  p.roundRect(ML, Y, CW, 36, 8, C.brandLight, C.border, 0.5);
  p.text("Booking Status:", ML + 14, Y + 11, 9, C.muted);
  p.roundRect(ML + 110, Y + 8, 90, 20, 6, statusColor);
  p.text(status, ML + 124, Y + 13, 9, C.white, "F2");

  p.text(`Booking ID: ${bId}`, ML + 220, Y + 11, 9, C.muted);
  p.text(`Payment: ${(bookingData.paymentStatus || "Paid").toUpperCase()}`, ML + 380, Y + 11, 9, C.muted);

  // ─────────────────────────────────────────────────────────────────────────
  // GUEST & HOTEL INFO BOXES
  Y += 52;
  const BOX_H = 120;
  const halfW = (CW - 12) / 2;

  // Guest box
  p.roundRect(ML, Y, halfW, BOX_H, 8, C.white, C.border, 0.5);
  p.rect(ML, Y, halfW, 26, C.brand);
  p.text("GUEST DETAILS", ML + 12, Y + 8, 8, C.white, "F2");
  let gy = Y + 34;
  const guestRows = [
    ["Name",   guestDetails.fullName || "—"],
    ["Email",  guestDetails.email    || "—"],
    ["Phone",  guestDetails.phone    || "—"],
    ["Guests", String(bookingData.guests || 1)]
  ];
  for (const [lbl, val] of guestRows) {
    p.text(lbl, ML + 12, gy, 8, C.muted);
    p.text(val, ML + 60, gy, 8, C.text);
    gy += 16;
  }
  if (guestDetails.specialRequests) {
    p.text("Note", ML + 12, gy, 8, C.muted);
    p.text(guestDetails.specialRequests.slice(0, 38), ML + 60, gy, 8, C.text);
  }

  // Hotel box
  const hx = ML + halfW + 12;
  p.roundRect(hx, Y, halfW, BOX_H, 8, C.white, C.border, 0.5);
  p.rect(hx, Y, halfW, 26, C.brand);
  p.text("PROPERTY DETAILS", hx + 12, Y + 8, 8, C.white, "F2");
  let hy = Y + 34;
  const hotelRows = [
    ["Hotel",   bookingData.hotelName               || "—"],
    ["City",    hotelDetails.city || bookingData.city || "—"],
    ["Address", (hotelDetails.address || "").slice(0, 30) || "—"],
    ["Room",    bookingData.roomType || "Standard Room"]
  ];
  for (const [lbl, val] of hotelRows) {
    p.text(lbl, hx + 12, hy, 8, C.muted);
    p.text(val, hx + 60, hy, 8, C.text);
    hy += 16;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STAY SUMMARY BAR (check‑in / nights / check‑out)
  Y += BOX_H + 18;
  p.roundRect(ML, Y, CW, 54, 8, C.brandLight, C.border, 0.5);
  const third = CW / 3;

  p.text("CHECK-IN", ML + 16, Y + 10, 7, C.muted, "F2");
  p.text(fmtDate(bookingData.checkIn), ML + 16, Y + 22, 13, C.brand, "F2");
  p.text("From 2:00 PM", ML + 16, Y + 38, 7, C.muted);
  p.vline(ML + third, Y + 8, Y + 46, C.border, 0.5);

  p.textC(`${nights}`, ML + third, ML + 2*third, Y + 8, 22, C.accent, "F2");
  p.textC(nights === 1 ? "NIGHT" : "NIGHTS", ML + third, ML + 2*third, Y + 34, 7, C.muted, "F2");
  p.vline(ML + 2*third, Y + 8, Y + 46, C.border, 0.5);

  p.text("CHECK-OUT", ML + 2*third + 16, Y + 10, 7, C.muted, "F2");
  p.text(fmtDate(bookingData.checkOut), ML + 2*third + 16, Y + 22, 13, C.brand, "F2");
  p.text("Until 11:00 AM", ML + 2*third + 16, Y + 38, 7, C.muted);

  // ─────────────────────────────────────────────────────────────────────────
  // CHARGES BREAKDOWN TABLE
  Y += 70;
  p.text("CHARGES BREAKDOWN", ML, Y, 9, C.brand, "F2");
  Y += 14;

  const ROW_H = 24;
  p.rect(ML, Y, CW, ROW_H, C.brand);
  const cols = { desc: ML + 10, nights: ML + 280, rate: ML + 360, amount: ML + 460 };
  p.text("Description",   cols.desc,   Y + 8, 8, C.white, "F2");
  p.text("Nights",        cols.nights, Y + 8, 8, C.white, "F2");
  p.text("Rate / Night",  cols.rate,   Y + 8, 8, C.white, "F2");
  p.text("Amount (INR)",  cols.amount, Y + 8, 8, C.white, "F2");
  Y += ROW_H;

  const tableRows = [
    [`${bookingData.roomType || "Standard Room"} — ${bookingData.hotelName}`, String(nights), `Rs.${perNight.toLocaleString("en-IN")}`, `Rs.${subTotal.toLocaleString("en-IN")}`],
    bookingData.mealPlan ? [`Meal Plan: ${bookingData.mealPlan}`, "", "", "Included"] : null,
    bookingData.couponCode ? [`Coupon Discount (${bookingData.couponCode})`, "", "", `-Rs.${(bookingData.discountAmount || 0).toLocaleString("en-IN")}`] : null,
  ].filter(Boolean);

  tableRows.forEach((row, i) => {
    const bg = i % 2 === 0 ? C.white : C.brandLight;
    p.rect(ML, Y, CW, ROW_H, bg, C.border, 0.3);
    p.text(row[0], cols.desc,   Y + 8, 8, C.text);
    p.text(row[1], cols.nights, Y + 8, 8, C.text);
    p.text(row[2], cols.rate,   Y + 8, 8, C.text);
    p.text(row[3], cols.amount, Y + 8, 8, C.text);
    Y += ROW_H;
  });

  // Totals box (right‑aligned)
  const totW = 220, totX = MR - totW;
  Y += 10;
  p.hline(totX, Y, MR, C.border);
  Y += 10;

  const totals = [
    ["Sub Total",      `Rs.${subTotal.toLocaleString("en-IN")}`,       C.text, C.muted, false],
    ["GST (12%)",      `Rs.${taxes.toLocaleString("en-IN")}`,          C.text, C.muted, false],
    ["TOTAL AMOUNT",   `Rs.${bookingData.amount?.toLocaleString("en-IN") || "—"}`, C.brand, C.brand, true],
  ];
  for (const [lbl, val, vc, lc, bold] of totals) {
    const font = bold ? "F2" : "F1";
    const sz   = bold ? 11 : 9;
    if (bold) {
      p.roundRect(totX - 4, Y - 2, totW + 4, 22, 4, C.brandLight, C.border, 0.5);
    }
    p.text(lbl, totX + 8, Y + 2, sz, lc, font);
    p.textR(val, MR - 8,  Y + 2, sz, vc, font);
    Y += bold ? 26 : 18;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // LOYALTY POINTS (if any)
  if (bookingData.loyaltyPointsEarned > 0) {
    Y += 8;
    p.roundRect(ML, Y, CW, 36, 8, [1, 0.98, 0.93], C.accent, 0.8);
    p.text("LOYALTY POINTS EARNED", ML + 14, Y + 8, 9, C.accent, "F2");
    p.text(`+${bookingData.loyaltyPointsEarned} points added to your Bookora wallet (1 pt = Rs.1 value).`,
           ML + 14, Y + 22, 8, [0.5, 0.38, 0.05]);
    Y += 46;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CANCELLATION POLICY
  Y += 14;
  p.text("CANCELLATION POLICY", ML, Y, 9, C.brand, "F2");
  Y += 14;
  const policies = [
    "Free cancellation up to 48 hours before check‑in.",
    "50% charge applies for cancellations between 24 and 48 hours before check‑in.",
    "No refund for cancellations less than 24 hours before check‑in.",
  ];
  for (const pol of policies) {
    p.text(`• ${pol}`, ML + 6, Y, 8, C.muted);
    Y += 13;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // FOOTER BAND (dark teal)
  const FTR_Y = H - 68;
  p.rect(0, FTR_Y, W, 68, C.brand);
  p.hline(0, FTR_Y, W, C.accent, 2.5);

  p.text("support@bookora.com", ML, FTR_Y + 14, 8, [0.75, 0.9, 0.92]);
  p.text("+91 93468 26589", ML, FTR_Y + 27, 8, [0.75, 0.9, 0.92]);

  p.textC("This is a computer‑generated invoice and does not require a signature.",
          ML, MR, FTR_Y + 14, 7, [0.65, 0.8, 0.82]);
  p.textC("GSTIN: 22AAAAA0000A1Z5  |  CIN: U63090MH2020PTC123456",
          ML, MR, FTR_Y + 26, 7, [0.65, 0.8, 0.82]);

  p.textR("BOOKORA", MR, FTR_Y + 14, 14, C.accent, "F2");
  p.textR("bookora.com", MR, FTR_Y + 30, 7, [0.65, 0.8, 0.82]);

  p.textC("Page 1 of 1", ML, MR, FTR_Y + 50, 7, [0.5, 0.7, 0.75]);

  // ─────────────────────────────────────────────────────────────────────────
  // BUILD FINAL PDF BINARY (using raw concatenation for efficiency)
  const contentStream = p._content();
  const streamLen = Buffer.byteLength(contentStream, "latin1");
  let raw = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";

  const obj = (id, dict, stream = null) => {
    raw += `${id} 0 obj\n${dict}\n`;
    if (stream !== null) {
      raw += `stream\n${stream}\nendstream\n`;
    }
    raw += "endobj\n";
  };

  const offsets = [];
  const addObj = (id, dict, stream = null) => {
    offsets[id] = raw.length;
    obj(id, dict, stream);
  };

  addObj(1, "<< /Type /Catalog /Pages 2 0 R >>");
  addObj(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  addObj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`);
  addObj(4, `<< /Length ${streamLen} >>`, contentStream);
  addObj(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  addObj(6, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  const xrefOffset = raw.length;
  raw += "xref\n0 7\n0000000000 65535 f \n";
  for (let i = 1; i <= 6; i++) {
    raw += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  raw += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(raw, "latin1");
}

module.exports = { generatePDFInvoice };