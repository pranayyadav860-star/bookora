// server/utils/pdfInvoice.js
// Premium Invoice using PDFKit — MakeMyTrip/Booking.com style
"use strict";

const PDFDocument = require("pdfkit");

function fmtDate(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtCurrency(n) {
  if (!n && n !== 0) return "—";
  return `Rs. ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(checkIn), b = new Date(checkOut);
  if (isNaN(a) || isNaN(b)) return 1;
  return Math.max(1, Math.round((b - a) / 86400000));
}

async function generatePDFInvoice(bookingData, guestDetails, hotelDetails) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 0, info: { Title: `Invoice - ${bookingData.bookingId}`, Author: "Bookora" } });
      const chunks = [];
      doc.on("data", chunk => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const W = 595.28;
      const ML = 40, MR = W - 40, CW = MR - ML;

      // ── BRAND COLORS ─────────────────────────────────────────────────────
      const BRAND     = "#1a3c5e";   // dark navy
      const BRAND2    = "#2563eb";   // blue accent
      const GOLD      = "#f59e0b";   // amber
      const SUCCESS   = "#16a34a";   // green
      const DANGER    = "#dc2626";   // red
      const LIGHT_BG  = "#f0f7ff";   // light blue bg
      const BORDER    = "#cbd5e1";
      const TEXT      = "#1e293b";
      const MUTED     = "#64748b";
      const WHITE     = "#ffffff";

      const nights      = nightsBetween(bookingData.checkIn, bookingData.checkOut);
      const totalAmt    = Number(bookingData.amount) || 0;
      const gstRate     = 0.12;
      const baseAmt     = Math.round(totalAmt / (1 + gstRate));
      const gstAmt      = totalAmt - baseAmt;
      const perNight    = nights > 0 ? Math.round(baseAmt / nights) : baseAmt;
      const discount    = Number(bookingData.couponDiscount) || 0;
      const status      = (bookingData.status || "Confirmed").toUpperCase();
      const payStatus   = (bookingData.paymentStatus || "Paid").toUpperCase();
      const statusColor = status === "CONFIRMED" ? SUCCESS : status === "CANCELLED" ? DANGER : MUTED;
      const payColor    = payStatus === "PAID" ? SUCCESS : payStatus === "FAILED" ? DANGER : GOLD;

      // ═══════════════════════════════════════════════════════════════════
      // 1. HEADER
      // ═══════════════════════════════════════════════════════════════════
      doc.rect(0, 0, W, 110).fill(BRAND);

      // Gold accent bar at bottom of header
      doc.rect(0, 107, W, 3).fill(GOLD);

      // Logo text
      doc.fontSize(28).font("Helvetica-Bold").fillColor(WHITE).text("BOOKORA", ML, 22, { lineBreak: false });
      doc.fontSize(9).font("Helvetica").fillColor("#94b8d8").text("Luxury Hotel Booking Platform", ML, 56, { lineBreak: false });
      doc.fontSize(8).fillColor("#7aa3c4").text("support@bookora.com  |  +91 93468 26589  |  bookora.com", ML, 72, { lineBreak: false });

      // TAX INVOICE badge
      doc.roundedRect(MR - 130, 20, 130, 34, 6).fill(GOLD);
      doc.fontSize(13).font("Helvetica-Bold").fillColor(BRAND).text("TAX INVOICE", MR - 126, 30, { lineBreak: false, width: 122, align: "center" });

      // Invoice meta right side
      doc.fontSize(8).font("Helvetica").fillColor("#94b8d8")
        .text(`Invoice No: ${bookingData.bookingId || "—"}`, MR - 180, 60, { lineBreak: false, align: "right", width: 180 })
        .text(`Date: ${fmtDate(bookingData.createdAt || new Date())}`, MR - 180, 72, { lineBreak: false, align: "right", width: 180 });

      // ═══════════════════════════════════════════════════════════════════
      // 2. STATUS BAR
      // ═══════════════════════════════════════════════════════════════════
      let Y = 120;
      doc.rect(ML, Y, CW, 38).fill(LIGHT_BG).stroke(BORDER);
      doc.rect(ML, Y, CW, 38).stroke(BORDER);

      doc.fontSize(8).font("Helvetica").fillColor(MUTED).text("BOOKING STATUS", ML + 14, Y + 8, { lineBreak: false });
      doc.roundedRect(ML + 110, Y + 6, 80, 20, 4).fill(statusColor);
      doc.fontSize(9).font("Helvetica-Bold").fillColor(WHITE).text(status, ML + 112, Y + 12, { lineBreak: false, width: 76, align: "center" });

      doc.fontSize(8).font("Helvetica").fillColor(MUTED).text(`Booking ID: ${bookingData.bookingId || "—"}`, ML + 210, Y + 8, { lineBreak: false });
      doc.fontSize(8).fillColor(MUTED).text("PAYMENT", MR - 160, Y + 8, { lineBreak: false });
      doc.roundedRect(MR - 100, Y + 6, 60, 20, 4).fill(payColor);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE).text(payStatus, MR - 98, Y + 12, { lineBreak: false, width: 56, align: "center" });

      // ═══════════════════════════════════════════════════════════════════
      // 3. GUEST & HOTEL INFO BOXES
      // ═══════════════════════════════════════════════════════════════════
      Y += 52;
      const BOX_W = (CW - 14) / 2;
      const BOX_H = 118;

      // Guest box
      doc.roundedRect(ML, Y, BOX_W, BOX_H, 6).fill(WHITE).stroke(BORDER);
      doc.rect(ML, Y, BOX_W, 26).fill(BRAND2);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE).text("GUEST DETAILS", ML + 12, Y + 9, { lineBreak: false });

      const gRows = [
        ["Name",    guestDetails.fullName || bookingData.userName || "—"],
        ["Email",   guestDetails.email    || bookingData.userEmail || "—"],
        ["Phone",   guestDetails.phone    || bookingData.userPhone || "—"],
        ["Guests",  String(bookingData.guests || 1) + " Guest(s)"],
      ];
      let gy = Y + 34;
      for (const [lbl, val] of gRows) {
        doc.fontSize(7.5).font("Helvetica").fillColor(MUTED).text(lbl, ML + 12, gy, { lineBreak: false, width: 50 });
        doc.fontSize(7.5).fillColor(TEXT).text(String(val).slice(0, 36), ML + 65, gy, { lineBreak: false });
        gy += 16;
      }

      // Hotel box
      const hx = ML + BOX_W + 14;
      doc.roundedRect(hx, Y, BOX_W, BOX_H, 6).fill(WHITE).stroke(BORDER);
      doc.rect(hx, Y, BOX_W, 26).fill(BRAND2);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE).text("PROPERTY DETAILS", hx + 12, Y + 9, { lineBreak: false });

      const hRows = [
        ["Hotel",   bookingData.hotelName || "—"],
        ["City",    hotelDetails.city || bookingData.city || "—"],
        ["Address", (hotelDetails.address || "—").slice(0, 32)],
        ["Room",    bookingData.roomType || "Standard Room"],
      ];
      let hy = Y + 34;
      for (const [lbl, val] of hRows) {
        doc.fontSize(7.5).font("Helvetica").fillColor(MUTED).text(lbl, hx + 12, hy, { lineBreak: false, width: 50 });
        doc.fontSize(7.5).fillColor(TEXT).text(String(val).slice(0, 36), hx + 65, hy, { lineBreak: false });
        hy += 16;
      }

      // ═══════════════════════════════════════════════════════════════════
      // 4. STAY TIMELINE BAR
      // ═══════════════════════════════════════════════════════════════════
      Y += BOX_H + 16;
      doc.roundedRect(ML, Y, CW, 60, 6).fill(LIGHT_BG).stroke(BORDER);

      const third = CW / 3;

      // Check-in
      doc.fontSize(7).font("Helvetica-Bold").fillColor(MUTED).text("CHECK-IN", ML + 18, Y + 10, { lineBreak: false });
      doc.fontSize(13).font("Helvetica-Bold").fillColor(BRAND).text(fmtDate(bookingData.checkIn), ML + 18, Y + 22, { lineBreak: false });
      doc.fontSize(7).font("Helvetica").fillColor(MUTED).text("From 2:00 PM", ML + 18, Y + 40, { lineBreak: false });

      // Divider
      doc.moveTo(ML + third, Y + 10).lineTo(ML + third, Y + 50).stroke(BORDER);

      // Nights circle
      doc.circle(ML + third + third / 2, Y + 30, 20).fill(BRAND2);
      doc.fontSize(16).font("Helvetica-Bold").fillColor(WHITE)
        .text(String(nights), ML + third + third / 2 - 12, Y + 20, { lineBreak: false, width: 24, align: "center" });
      doc.fontSize(6).font("Helvetica").fillColor(WHITE)
        .text(nights === 1 ? "NIGHT" : "NIGHTS", ML + third + third / 2 - 16, Y + 40, { lineBreak: false, width: 32, align: "center" });

      // Divider
      doc.moveTo(ML + 2 * third, Y + 10).lineTo(ML + 2 * third, Y + 50).stroke(BORDER);

      // Check-out
      const cox = ML + 2 * third + 18;
      doc.fontSize(7).font("Helvetica-Bold").fillColor(MUTED).text("CHECK-OUT", cox, Y + 10, { lineBreak: false });
      doc.fontSize(13).font("Helvetica-Bold").fillColor(BRAND).text(fmtDate(bookingData.checkOut), cox, Y + 22, { lineBreak: false });
      doc.fontSize(7).font("Helvetica").fillColor(MUTED).text("Until 11:00 AM", cox, Y + 40, { lineBreak: false });

      // ═══════════════════════════════════════════════════════════════════
      // 5. CHARGES TABLE
      // ═══════════════════════════════════════════════════════════════════
      Y += 76;
      doc.fontSize(10).font("Helvetica-Bold").fillColor(BRAND).text("CHARGES BREAKDOWN", ML, Y, { lineBreak: false });
      Y += 16;

      // Table header
      const ROW_H = 26;
      doc.rect(ML, Y, CW, ROW_H).fill(BRAND);
      const C1 = ML + 10, C2 = ML + 260, C3 = ML + 340, C4 = ML + 420;
      doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE);
      doc.text("Description", C1, Y + 9, { lineBreak: false });
      doc.text("Nights", C2, Y + 9, { lineBreak: false });
      doc.text("Rate/Night", C3, Y + 9, { lineBreak: false });
      doc.text("Amount", C4, Y + 9, { lineBreak: false });
      Y += ROW_H;

      // Table rows
      const tableRows = [
        [`${bookingData.roomType || "Standard Room"} — ${bookingData.hotelName || "Hotel"}`, String(nights), fmtCurrency(perNight), fmtCurrency(baseAmt)],
      ];
      if (bookingData.breakfastCost > 0) tableRows.push(["Breakfast Package", String(nights), fmtCurrency(bookingData.breakfastCost / nights), fmtCurrency(bookingData.breakfastCost)]);
      if (discount > 0) tableRows.push([`Coupon Discount (${bookingData.couponCode || ""})`, "", "", `-${fmtCurrency(discount)}`]);

      tableRows.forEach((row, i) => {
        const bg = i % 2 === 0 ? WHITE : LIGHT_BG;
        doc.rect(ML, Y, CW, ROW_H).fill(bg).stroke(BORDER);
        doc.fontSize(8).font("Helvetica").fillColor(TEXT);
        doc.text(row[0], C1, Y + 9, { lineBreak: false, width: 240 });
        doc.text(row[1], C2, Y + 9, { lineBreak: false });
        doc.text(row[2], C3, Y + 9, { lineBreak: false });
        doc.fontSize(8).font(i === 0 ? "Helvetica" : "Helvetica").fillColor(discount > 0 && i === tableRows.length - 1 ? DANGER : TEXT)
          .text(row[3], C4, Y + 9, { lineBreak: false });
        Y += ROW_H;
      });

      // ═══════════════════════════════════════════════════════════════════
      // 6. TOTALS BOX
      // ═══════════════════════════════════════════════════════════════════
      Y += 10;
      const TOT_W = 210, TOT_X = MR - TOT_W;

      const totals = [
        ["Subtotal (excl. GST)", fmtCurrency(baseAmt - discount),     TEXT,  false],
        ["GST @ 12%",            fmtCurrency(gstAmt),                  TEXT,  false],
      ];
      if (discount > 0) totals.splice(0, 0, [`Coupon (${bookingData.couponCode})`, `-${fmtCurrency(discount)}`, DANGER, false]);

      for (const [lbl, val, color, bold] of totals) {
        doc.fontSize(8.5).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(MUTED).text(lbl, TOT_X, Y, { lineBreak: false, width: 120 });
        doc.fontSize(8.5).font(bold ? "Helvetica-Bold" : "Helvetica").fillColor(color).text(val, TOT_X + 120, Y, { lineBreak: false, width: TOT_W - 120, align: "right" });
        Y += 16;
      }

      // Total amount highlighted box
      doc.roundedRect(TOT_X - 6, Y, TOT_W + 6, 32, 5).fill(BRAND);
      doc.fontSize(11).font("Helvetica-Bold").fillColor(WHITE).text("TOTAL AMOUNT", TOT_X, Y + 10, { lineBreak: false, width: 120 });
      doc.fontSize(13).font("Helvetica-Bold").fillColor(GOLD).text(fmtCurrency(totalAmt), TOT_X + 120, Y + 8, { lineBreak: false, width: TOT_W - 120, align: "right" });
      Y += 42;

      // Payment method
      doc.fontSize(8).font("Helvetica").fillColor(MUTED)
        .text(`Payment Method: ${bookingData.paymentMethod || "Online"}`, TOT_X, Y, { lineBreak: false });
      Y += 14;
      if (bookingData.paymentId) {
        doc.fontSize(7.5).fillColor(MUTED).text(`Transaction ID: ${bookingData.paymentId}`, TOT_X, Y, { lineBreak: false });
        Y += 14;
      }

      // ═══════════════════════════════════════════════════════════════════
      // 7. LOYALTY POINTS BANNER
      // ═══════════════════════════════════════════════════════════════════
      if (bookingData.loyaltyPointsEarned > 0) {
        Y += 8;
        doc.roundedRect(ML, Y, CW, 36, 5).fill("#fffbeb").stroke(GOLD);
        doc.fontSize(8).font("Helvetica-Bold").fillColor(GOLD).text("🏅 LOYALTY POINTS EARNED", ML + 14, Y + 8, { lineBreak: false });
        doc.fontSize(8).font("Helvetica").fillColor("#92400e")
          .text(`+${bookingData.loyaltyPointsEarned} points added to your Bookora wallet  (1 point = Rs. 1 discount on next booking)`, ML + 14, Y + 22, { lineBreak: false });
        Y += 46;
      }

      // ═══════════════════════════════════════════════════════════════════
      // 8. CANCELLATION POLICY
      // ═══════════════════════════════════════════════════════════════════
      Y += 14;
      doc.fontSize(9).font("Helvetica-Bold").fillColor(BRAND).text("CANCELLATION POLICY", ML, Y, { lineBreak: false });
      Y += 14;
      const policies = [
        "Free cancellation up to 48 hours before check-in.",
        "50% charge for cancellations between 24–48 hours before check-in.",
        "No refund for cancellations within 24 hours of check-in.",
      ];
      for (const pol of policies) {
        doc.fontSize(8).font("Helvetica").fillColor(MUTED).text(`• ${pol}`, ML + 8, Y, { lineBreak: false });
        Y += 13;
      }

      // ═══════════════════════════════════════════════════════════════════
      // 9. FOOTER
      // ═══════════════════════════════════════════════════════════════════
      const FTR_Y = 755;
      doc.rect(0, FTR_Y, W, 87).fill(BRAND);
      doc.rect(0, FTR_Y, W, 3).fill(GOLD);

      // Left — contact
      doc.fontSize(8).font("Helvetica-Bold").fillColor(WHITE).text("BOOKORA", ML, FTR_Y + 14, { lineBreak: false });
      doc.fontSize(7.5).font("Helvetica").fillColor("#94b8d8")
        .text("support@bookora.com", ML, FTR_Y + 26, { lineBreak: false })
        .text("+91 93468 26589", ML, FTR_Y + 38, { lineBreak: false })
        .text("bookora.com", ML, FTR_Y + 50, { lineBreak: false });

      // Center — legal
      doc.fontSize(7).fillColor("#7aa3c4")
        .text("This is a computer-generated invoice and does not require a signature.", 0, FTR_Y + 18, { lineBreak: false, width: W, align: "center" })
        .text("GSTIN: 22AAAAA0000A1Z5  |  CIN: U63090MH2020PTC123456", 0, FTR_Y + 30, { lineBreak: false, width: W, align: "center" })
        .text("Registered Office: 123 Tech Park, Hyderabad, Telangana - 500081", 0, FTR_Y + 42, { lineBreak: false, width: W, align: "center" });

      // Right — page
      doc.fontSize(7.5).font("Helvetica").fillColor("#7aa3c4")
        .text("Page 1 of 1", MR - 60, FTR_Y + 60, { lineBreak: false });

      // Bottom strip
      doc.rect(0, FTR_Y + 66, W, 21).fill("#0f2744");
      doc.fontSize(7).fillColor("#4a7fa5")
        .text("Thank you for choosing Bookora. We hope you enjoy your stay!", 0, FTR_Y + 72, { lineBreak: false, width: W, align: "center" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePDFInvoice };