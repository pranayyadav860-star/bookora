// client/src/utils/exportUtils.js
// EXCEL COMPATIBLE VERSION

const formatDateForExcel = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    // Format as YYYY-MM-DD (Excel recognizes this format)
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return 'N/A';
  }
};

export const exportToCSV = (bookings) => {
  if (!bookings || bookings.length === 0) {
    alert("No bookings to export");
    return;
  }

  console.log("Exporting", bookings.length, "bookings to CSV");

  // Use YYYY-MM-DD format for Excel compatibility
  let csvContent = "Hotel,Guest Email,Check In,Check Out,Guests,Room,Amount,Status,Payment\n";
  
  bookings.forEach(booking => {
    const row = [
      `"${(booking.hotelName || 'N/A').replace(/"/g, '""')}"`,
      `"${(booking.userEmail || 'N/A').replace(/"/g, '""')}"`,
      formatDateForExcel(booking.checkIn),  // YYYY-MM-DD for Excel
      formatDateForExcel(booking.checkOut), // YYYY-MM-DD for Excel
      booking.guests || 1,
      `"${(booking.roomType || 'Standard').replace(/"/g, '""')}"`,
      booking.amount || 0,
      booking.status || 'Pending',
      `"${(booking.paymentMethod || 'Card').replace(/"/g, '""')}"`
    ].join(',');
    
    csvContent += row + "\n";
  });

  // Add BOM for UTF-8 to handle special characters
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `bookings_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  alert(`✅ Exported ${bookings.length} bookings to CSV!`);
};

export const exportToPDF = (bookings, title = "Bookings Report") => {
  if (!bookings || bookings.length === 0) {
    alert("No bookings to export");
    return;
  }

  const totalRevenue = bookings.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const confirmedCount = bookings.filter(b => b.status === "Confirmed").length;
  const pendingCount = bookings.filter(b => b.status === "Pending").length;
  const cancelledCount = bookings.filter(b => b.status === "Cancelled").length;

  let html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <meta charset="UTF-8">
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { color: #eab308; text-align: center; }
      .header { text-align: center; margin-bottom: 30px; }
      .stats { display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 10px; }
      .stat-card { background: #f5f5f5; padding: 15px; border-radius: 8px; text-align: center; flex: 1; min-width: 100px; }
      .stat-card .number { font-size: 24px; font-weight: bold; color: #eab308; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      th { background: #eab308; color: white; }
      .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
      @media print { body { margin: 0; padding: 10px; } }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>📋 ${title}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card"><div class="number">${bookings.length}</div><div>Total Bookings</div></div>
      <div class="stat-card"><div class="number">${confirmedCount}</div><div>Confirmed</div></div>
      <div class="stat-card"><div class="number">${pendingCount}</div><div>Pending</div></div>
      <div class="stat-card"><div class="number">${cancelledCount}</div><div>Cancelled</div></div>
      <div class="stat-card"><div class="number">₹${totalRevenue.toLocaleString()}</div><div>Revenue</div></div>
    </div>
    
    <table>
      <thead>
        <tr><th>#</th><th>Hotel</th><th>Guest Email</th><th>Check In</th><th>Check Out</th><th>Amount</th><th>Status</th></tr>
      </thead>
      <tbody>`;

  bookings.forEach((booking, index) => {
    html += `<tr>
      <td>${index + 1}</td>
      <td>${booking.hotelName || 'N/A'}</td>
      <td>${booking.userEmail || 'N/A'}</td>
      <td>${formatDateForDisplay(booking.checkIn)}</td>
      <td>${formatDateForDisplay(booking.checkOut)}</td>
      <td>₹${Number(booking.amount || 0).toLocaleString()}</td>
      <td style="color: ${booking.status === 'Confirmed' ? 'green' : booking.status === 'Pending' ? 'orange' : 'red'}">${booking.status || 'Pending'}</td>
    </tr>`;
  });

  html += `</tbody>
    </table>
    <div class="footer">
      <p>Bookora - Hotel Booking Platform</p>
    </div>
    <div style="text-align:center; margin-top:20px;">
      <button onclick="window.print()" style="padding:10px 20px; background:#eab308; border:none; border-radius:5px; cursor:pointer;">🖨️ Save as PDF</button>
    </div>
    <script>setTimeout(() => { window.print(); }, 500);</script>
  </body>
  </html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
};