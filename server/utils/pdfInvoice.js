// server/utils/pdfInvoice.js
// SIMPLIFIED WORKING VERSION

const PDFDocument = require('pdfkit');

const generatePDFInvoice = (bookingData, guestDetails, hotelDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      const checkInDate = new Date(bookingData.checkIn);
      const checkOutDate = new Date(bookingData.checkOut);
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      
      const formatDate = (date) => {
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      };
      
      const bookingId = bookingData.bookingId || `BOOK${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const roomPricePerNight = bookingData.roomPrice || (bookingData.roomTotal / nights) || 5000;
      const roomTotal = bookingData.roomTotal || (roomPricePerNight * nights);
      const breakfastTotal = bookingData.breakfastCost || 0;
      const taxAmount = bookingData.tax || (roomTotal * 0.18);
      const grandTotal = bookingData.totalAmount || (roomTotal + breakfastTotal + taxAmount);
      
      // Colors
      const primaryColor = '#1a1a2e';
      const accentColor = '#eab308';
      
     // Header
doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

// BOOKORA Logo Text
doc.fillColor(accentColor)
   .fontSize(30)
   .font('Helvetica-Bold')
   .text('BOOKORA', 50, 28);

// Tagline
doc.fillColor('#ffffff')
   .fontSize(10)
   .font('Helvetica')
   .text('Premium Hotel Booking Platform', 52, 62);

// Right Side Invoice Label
doc.fillColor(accentColor)
   .fontSize(11)
   .font('Helvetica-Bold')
   .text('HOTEL BOOKING INVOICE', doc.page.width - 180, 35);

// Decorative Line
doc.moveTo(50, 88)
   .lineTo(doc.page.width - 50, 88)
   .strokeColor(accentColor)
   .lineWidth(1.5)
   .stroke();
    
      // Voucher Badge
      doc.fillColor(accentColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('HOTELIER VOUCHER', doc.page.width - 130, 40);
      
      // Hotel Name
      doc.fillColor('#333333')
         .fontSize(18)
         .font('Helvetica-Bold')
         .text(bookingData.hotelName, 50, 130);
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#666666')
         .text(hotelDetails.address || bookingData.city || 'India', 50, 155);
      
      // Booking ID
      doc.fillColor(accentColor)
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(`Booking ID: ${bookingId}`, doc.page.width - 130, 130);
      
      // Guest Details Section
      doc.fillColor('#333333')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PRIMARY GUEST DETAILS', 50, 200);
      
      doc.moveTo(50, 210)
         .lineTo(200, 210)
         .strokeColor(accentColor)
         .lineWidth(2)
         .stroke();
      
      doc.fontSize(10)
         .font('Helvetica-Bold')
         .fillColor('#555555')
         .text('Guest Name:', 50, 225);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(guestDetails.fullName, 150, 225);
      
      doc.fillColor('#555555')
         .font('Helvetica-Bold')
         .text('Email:', 50, 245);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(guestDetails.email, 150, 245);
      
      doc.fillColor('#555555')
         .font('Helvetica-Bold')
         .text('Phone:', 50, 265);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(guestDetails.phone, 150, 265);
      
      // Dates Section
      doc.fillColor('#f8f9fa')
         .rect(50, 290, 500, 80)
         .fill();
      
      doc.fillColor('#555555')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('CHECK-IN', 80, 305);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(`${formatDate(checkInDate)} | 12:00 PM`, 80, 320);
      
      doc.fillColor('#555555')
         .font('Helvetica-Bold')
         .text('CHECK-OUT', 280, 305);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(`${formatDate(checkOutDate)} (${nights} Nights) | 12:00 PM`, 280, 320);
      
      doc.fillColor('#555555')
         .font('Helvetica-Bold')
         .text('TOTAL GUESTS', 450, 305);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(`${bookingData.guests || 1} Adults | 1 Room`, 450, 320);
      
      // Room Details
      doc.fillColor('#333333')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('ROOM DETAILS', 50, 400);
      doc.moveTo(50, 410)
         .lineTo(180, 410)
         .stroke();
      
      doc.fillColor('#555555')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Room Type:', 50, 425);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(bookingData.roomType || 'Deluxe Twin Double', 150, 425);
      
      doc.fillColor('#555555')
         .font('Helvetica-Bold')
         .text('Board Basis:', 50, 445);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(bookingData.includeBreakfast ? 'Breakfast Included' : 'Room Only', 150, 445);
      
      // Price Breakdown on Page 2
      doc.addPage();
      
      doc.fillColor('#333333')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PRICE BREAKDOWN', 50, 50);
      doc.moveTo(50, 60)
         .lineTo(180, 60)
         .stroke();
      
      let y = 80;
      
      // Table Header
      doc.fillColor('#f0f0f0')
         .rect(50, y, 500, 25)
         .fill();
      doc.fillColor('#333333')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Description', 65, y + 7);
      doc.text('Amount (₹)', 450, y + 7);
      
      y += 30;
      
      // Room Charges
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(`Room Charges (${nights} nights x ₹${roomPricePerNight})`, 65, y);
      doc.text(`₹${roomTotal.toFixed(2)}`, 450, y);
      y += 25;
      
      // Breakfast
      if (breakfastTotal > 0) {
        doc.text('Breakfast', 65, y);
        doc.text(`₹${breakfastTotal.toFixed(2)}`, 450, y);
        y += 25;
      }
      
      // Taxes
      doc.text('Taxes (18% GST)', 65, y);
      doc.text(`₹${taxAmount.toFixed(2)}`, 450, y);
      y += 30;
      
      // Grand Total
      doc.fillColor(accentColor)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text('GRAND TOTAL', 65, y);
      doc.text(`₹${grandTotal.toFixed(2)}`, 450, y);
      
      // Payment Details
      y += 50;
      doc.fillColor('#333333')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PAYMENT DETAILS', 50, y);
      doc.moveTo(50, y + 10)
         .lineTo(180, y + 10)
         .stroke();
      
      y += 30;
      doc.fillColor('#555555')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Payment Method:', 50, y);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(bookingData.paymentMethod || 'Pay at Hotel', 180, y);
      
      y += 20;
      doc.fillColor('#555555')
         .font('Helvetica-Bold')
         .text('Payment Status:', 50, y);
      doc.fillColor('#333333')
         .font('Helvetica')
         .text(bookingData.paymentStatus || 'Pending', 180, y);
      
      // Cancellation Policy
      y += 50;
      doc.fillColor('#fff3cd')
         .rect(50, y, 500, 60)
         .fill();
      doc.fillColor('#856404')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text('⚠️ CANCELLATION POLICY', 60, y + 10);
      doc.fillColor('#856404')
         .fontSize(8)
         .font('Helvetica')
         .text('• Free cancellation up to 7 days before check-in', 60, y + 25);
      doc.text('• 50% cancellation fee between 3-7 days before check-in', 60, y + 38);
      doc.text('• 100% cancellation fee for no-show or cancellation within 3 days', 60, y + 51);
      
      // Footer
      const footerY = doc.page.height - 60;
      doc.fillColor('#1a1a2e')
         .rect(0, footerY, doc.page.width, 60)
         .fill();
      
      doc.fillColor('#ffffff')
         .fontSize(9)
         .font('Helvetica')
         .text('Bookora - Luxury Hotel Booking Platform', 50, footerY + 15, { align: 'center', width: doc.page.width - 100 });
      doc.text('support@bookora.com | +91 98765 43210', 50, footerY + 30, { align: 'center', width: doc.page.width - 100 });
      
      doc.end();
      
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generatePDFInvoice };