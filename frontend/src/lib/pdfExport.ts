import jsPDF from 'jspdf';
import { Task } from './types';

export const exportToPDF = (tasks: Task[], goalTitle: string) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const margin = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = margin;

  // Title (bold, colored)
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 110);
  doc.text('Smart Task Plan', margin, y);
  y += 26;

  // Goal (normal)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Goal: ${goalTitle}`, margin, y);

  const dateStr = `Generated on ${new Date().toLocaleDateString()}`;
  const dateWidth = doc.getTextWidth ? doc.getTextWidth(dateStr) : (doc as any).getStringUnitWidth(dateStr) * doc.getFontSize();
  doc.text(dateStr, pageWidth - margin - dateWidth, y);
  y += 18;

  // Simple divider
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Tasks: plain text, bold titles, colored priority lines
  const maxWidth = pageWidth - margin * 2;
  tasks.forEach((task, idx) => {
    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 90);
    const title = `${idx + 1}. ${task.title}`;
    const titleLines = doc.splitTextToSize(title, maxWidth);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 14;

    // Description (if any)
    if (task.description) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const descLines = doc.splitTextToSize(task.description, maxWidth);
      doc.text(descLines, margin, y);
      y += descLines.length * 12;
    }

    // Deadline / Category
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    if (task.deadline) {
      doc.text(`Deadline: ${task.deadline}`, margin, y);
      y += 12;
    }
    if (task.category) {
      doc.text(`Category: ${task.category}`, margin, y);
      y += 12;
    }

    // Priority: make this bold and colored
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    // color by priority label words (high -> red, medium -> orange, low -> green)
    const p = (task.priority || '').toLowerCase();
    if (p.includes('high')) doc.setTextColor(190, 35, 35);
    else if (p.includes('med') || p.includes('medium')) doc.setTextColor(220, 120, 20);
    else doc.setTextColor(30, 130, 30);
    doc.text(`Priority: ${task.priority}`, margin, y);
    y += 14;

    // Dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Dependencies: ${task.dependencies.join(', ')}`, margin, y);
      y += 12;
    }

    y += 6; // spacing between tasks

    // Page break handling
    const bottomLimit = doc.internal.pageSize.getHeight() - margin - 40;
    if (y > bottomLimit) {
      doc.addPage();
      y = margin;
    }
  });

  // Footer with page number(s)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyDoc = doc as any;
  const pageCount = typeof anyDoc.getNumberOfPages === 'function'
    ? anyDoc.getNumberOfPages()
    : (anyDoc.internal && Array.isArray(anyDoc.internal.pages) ? anyDoc.internal.pages.length : 1);

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footer = `Generated on ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`;
    doc.setFontSize(9);
    doc.setTextColor(140, 140, 140);
    doc.text(footer, margin, doc.internal.pageSize.getHeight() - 20);
  }

  // Save
  try {
    doc.save(`task-plan-${Date.now()}.pdf`);
  } catch (err) {
    // fallback: open blob in new tab
    try {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `task-plan-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // Last resort: throw so caller can surface an error
      throw e;
    }
  }
};
