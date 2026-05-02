import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a professional PDF report for a specific vehicle and its fuel records.
 * @param {Object} car - The vehicle object.
 * @param {Array} records - Array of fuel record objects.
 * @param {Object} stats - Statistics object (totalCost, avgConsumption, etc).
 */
export const generateFuelReport = (car, records, stats) => {
  const doc = new jsPDF();
  const primaryColor = [168, 85, 247]; // Neon Violet / Purple

  // --- Header & Branding ---
  doc.setFillColor(30, 30, 30);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text("LUXEFUEL", 14, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text("TELEMETRY & FLEET INTELLIGENCE", 14, 32);
  
  doc.setFontSize(8);
  doc.text(`REPORT GENERATED: ${new Date().toLocaleString()}`, 140, 25);

  // --- Vehicle Details Section ---
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("VEHICLE PROFILE", 14, 55);
  
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 58, 196, 58);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${car.name}`, 14, 66);
  doc.text(`Brand/Model: ${car.brand} ${car.model}`, 14, 72);
  doc.text(`License Plate: ${car.licensePlate || 'N/A'}`, 14, 78);
  doc.text(`Current Tank Size: ${car.tankSize || 'N/A'} L`, 14, 84);

  // --- Statistics Summary ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("EFFICIENCY METRICS", 110, 55);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Fuel Spent: ${stats?.totalSpent || 0} ${stats?.currency || ''}`, 110, 66);
  doc.text(`Total Volume: ${stats?.totalLiters?.toFixed(2) || 0} L`, 110, 72);
  doc.text(`Avg Consumption: ${stats?.avgConsumption?.toFixed(2) || 0} L/100km`, 110, 78);
  doc.text(`Total Distance: ${stats?.totalDistance || 0} km`, 110, 84);

  // --- Fuel Log Table ---
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("FUEL LOG HISTORY", 14, 100);

  const tableRows = records.map(r => [
    new Date(r.date).toLocaleDateString(),
    `${r.odometer} km`,
    `${r.litresRefueled?.toFixed(2) || 0} L`,
    `${r.fuelCost} ${stats?.currency || ''}`,
    `${r.pricePerLitre || (r.fuelCost / r.litresRefueled).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 105,
    head: [['Date', 'Odometer', 'Liters', 'Total Cost', 'Price/L']],
    body: tableRows,
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 105 },
    styles: { font: 'helvetica', fontSize: 10 }
  });

  // --- Footer ---
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    doc.text("LuxeFuel Intelligence Engine // Secure Telemetry Output", 14, 285);
  }

  // --- Download ---
  const fileName = `${car.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
