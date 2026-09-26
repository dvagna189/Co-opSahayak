import { jsPDF } from 'jspdf';
import { GrievanceLetter } from '../types';

export function downloadLetterTxt(letter: GrievanceLetter): void {
  const textContent = formatLetterAsText(letter);
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Grievance_Letter_${letter.memberName.replace(/\s+/g, '_')}_${letter.generatedDate.replace(/[^\w]/g, '_')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const downloadGrievanceTxt = downloadLetterTxt;
export const downloadGrievancePdf = generateLetterPdf;

export function formatLetterAsText(letter: GrievanceLetter): string {
  return `================================================================================
FORMAL COOPERATIVE GRIEVANCE & PETITION UNDER APPLICABLE BYLAWS
================================================================================

Date: ${letter.generatedDate}

TO:
${letter.recipientTitle}
${letter.societyName}

FROM:
Complainant Member: ${letter.memberName}
Society: ${letter.societyName}

SUBJECT:
${letter.subject}

${letter.salutation}

${letter.bodyParagraphs.join('\n\n')}

APPLICABLE COOPERATIVE BYLAWS / STATUTORY PROVISIONS CITED:
${letter.bylawReferences.map((ref, i) => `  ${i + 1}. ${ref}`).join('\n')}

PRAYER / SPECIFIC RELIEF REQUESTED:
${letter.requestedActionList.map((act, i) => `  ${i + 1}. ${act}`).join('\n')}

${letter.closing}

Yours faithfully,


___________________________
Signature of Member: ${letter.memberName}

Enclosures / Evidentiary copies attached where applicable.
Acknowledgement Receipt requested under statutory 30-day resolution timeline.
================================================================================
Generated via Co-opSahayak - AI-Powered Cooperative & Legal Helpdesk
`;
}

export function generateLetterPdf(letter: GrievanceLetter): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = 20;

  // Header band
  doc.setFillColor(30, 64, 175); // Dark blue / civic theme
  doc.rect(margin, cursorY, contentWidth, 12, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('FORMAL COOPERATIVE GRIEVANCE PETITION', pageWidth / 2, cursorY + 8, { align: 'center' });
  
  cursorY += 18;

  // Metadata block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text(`Filing Date: ${letter.generatedDate}`, margin, cursorY);
  doc.text(`Reference: BYLAW-GRIEV-${Date.now().toString().slice(-6)}`, pageWidth - margin, cursorY, { align: 'right' });
  
  cursorY += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // Recipient Block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('TO:', margin, cursorY);
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(letter.recipientTitle, margin, cursorY);
  cursorY += 5;
  doc.text(letter.societyName, margin, cursorY);
  cursorY += 9;

  // Complainant info
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', margin, cursorY);
  cursorY += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Member Name: ${letter.memberName}`, margin, cursorY);
  cursorY += 9;

  // Subject line with box
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, cursorY - 2, contentWidth, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 24, 39);
  const subjectLines = doc.splitTextToSize(`SUBJECT: ${letter.subject}`, contentWidth - 6);
  doc.text(subjectLines, margin + 3, cursorY + 4);
  cursorY += 14;

  // Salutation
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 30, 30);
  doc.text(letter.salutation, margin, cursorY);
  cursorY += 7;

  // Body paragraphs
  letter.bodyParagraphs.forEach((para) => {
    const lines = doc.splitTextToSize(para, contentWidth);
    if (cursorY + lines.length * 5 > pageHeight - 30) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 4.8 + 4;
  });

  // Bylaw citations
  if (letter.bylawReferences && letter.bylawReferences.length > 0) {
    if (cursorY > pageHeight - 50) {
      doc.addPage();
      cursorY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 64, 175);
    doc.text('STATUTORY PROVISIONS & APPLICABLE BYLAWS CITED:', margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    letter.bylawReferences.forEach((ref) => {
      const refLines = doc.splitTextToSize(`• ${ref}`, contentWidth - 4);
      doc.text(refLines, margin + 4, cursorY);
      cursorY += refLines.length * 4.5 + 2;
    });
    cursorY += 3;
  }

  // Requested Action list
  if (letter.requestedActionList && letter.requestedActionList.length > 0) {
    if (cursorY > pageHeight - 45) {
      doc.addPage();
      cursorY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 83, 9); // amber/brown accent
    doc.text('PRAYER / RELIEF SOUGHT:', margin, cursorY);
    cursorY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 40);
    letter.requestedActionList.forEach((act, idx) => {
      const actLines = doc.splitTextToSize(`${idx + 1}. ${act}`, contentWidth - 4);
      doc.text(actLines, margin + 4, cursorY);
      cursorY += actLines.length * 4.5 + 2;
    });
    cursorY += 4;
  }

  // Closing & Signature line
  if (cursorY > pageHeight - 35) {
    doc.addPage();
    cursorY = 20;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(letter.closing, margin, cursorY);
  cursorY += 14;

  doc.setFont('helvetica', 'bold');
  doc.text('_____________________________________', margin, cursorY);
  cursorY += 5;
  doc.text(`Signature: ${letter.memberName}`, margin, cursorY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('(Mandatory statutory acknowledgement receipt requested upon presentation)', margin, cursorY + 4);

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130, 130, 130);
    doc.text(
      `Co-opSahayak • Page ${i} of ${totalPages} • Grounded Cooperative Redressal System`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  const filename = `Grievance_Letter_${letter.memberName.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}
