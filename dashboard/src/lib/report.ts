import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Reading, AlgaeEvent } from '../types';

interface ReportData {
  readings: Reading[];
  events: AlgaeEvent[];
  sessionStart: number;
}

export function generateSessionReport({ readings, events, sessionStart }: ReportData) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();

  // -------- Header --------
  doc.setFillColor(10, 14, 26);
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setTextColor(0, 229, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('AEROAQUA TELEMETRY', 40, 45);

  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Session Report', 40, 65);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text(`Generated: ${now.toLocaleString('en-IN')}`, pageWidth - 40, 45, { align: 'right' });
  doc.text(
    `Session: ${new Date(sessionStart).toLocaleString('en-IN')}`,
    pageWidth - 40,
    60,
    { align: 'right' }
  );

  // -------- Summary stats --------
  const temps = readings.map((r) => r.temperature).filter(Boolean) as number[];
  const dos = readings.map((r) => r.max_do).filter(Boolean) as number[];
  const phs = readings.map((r) => r.ph).filter(Boolean) as number[];
  const clarity = readings.map((r) => r.light_transmission).filter(Boolean) as number[];

  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const min = (arr: number[]) => (arr.length ? Math.min(...arr) : 0);
  const max = (arr: number[]) => (arr.length ? Math.max(...arr) : 0);

  const bloomEvents = events.filter((e) => e.event_type === 'bloom_start');
  const pumpEvents = events.filter((e) => e.event_type === 'pump_on');
  const sessionMinutes = Math.max(1, Math.round((Date.now() - sessionStart) / 60000));

  doc.setTextColor(10, 14, 26);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 40, 130);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryY = 155;
  const colW = (pageWidth - 80) / 2;

  const lines: Array<[string, string]> = [
    ['Session Duration', `${sessionMinutes} minute${sessionMinutes === 1 ? '' : 's'}`],
    ['Total Readings', String(readings.length)],
    ['Algae Bloom Events', String(bloomEvents.length)],
    ['Pump Activations', String(pumpEvents.length)],
    ['Temperature (avg / min / max)', `${avg(temps).toFixed(1)} / ${min(temps).toFixed(1)} / ${max(temps).toFixed(1)} °C`],
    ['Max DO (avg / min / max)', `${avg(dos).toFixed(1)} / ${min(dos).toFixed(1)} / ${max(dos).toFixed(1)} mg/L`],
    ['pH (avg / min / max)', `${avg(phs).toFixed(2)} / ${min(phs).toFixed(2)} / ${max(phs).toFixed(2)}`],
    ['Clarity (avg / min / max)', `${avg(clarity).toFixed(0)} / ${min(clarity).toFixed(0)} / ${max(clarity).toFixed(0)} %`],
  ];

  lines.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 40 + col * colW;
    const y = summaryY + row * 22;

    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, y);

    doc.setTextColor(10, 14, 26);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x, y + 12);
  });

  // -------- Event table --------
  const tableStartY = summaryY + Math.ceil(lines.length / 2) * 22 + 30;

  doc.setTextColor(10, 14, 26);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Log', 40, tableStartY);

  autoTable(doc, {
    startY: tableStartY + 12,
    head: [['Time', 'Event', 'Temp (°C)', 'DO (mg/L)', 'pH', 'Clarity (%)', 'Note']],
    body: events
      .slice()
      .reverse()
      .map((e) => [
        new Date(e.created_at).toLocaleTimeString('en-IN'),
        e.event_type.toUpperCase(),
        e.temperature?.toFixed(1) ?? '--',
        e.max_do?.toFixed(1) ?? '--',
        e.ph?.toFixed(2) ?? '--',
        e.light_transmission?.toFixed(0) ?? '--',
        e.note ?? '',
      ]),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [10, 14, 26], textColor: [0, 229, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 248, 252] },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 80, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 55 },
      4: { cellWidth: 40 },
      5: { cellWidth: 55 },
      6: { cellWidth: 'auto' },
    },
  });

  // -------- Footer --------
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `AeroAqua v2 · Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
  }

  doc.save(`aeroaqua-report-${Date.now()}.pdf`);
}
