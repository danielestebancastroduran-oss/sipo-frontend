import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCOP } from './format';

// A4: 210mm ancho. Margenes 12mm c/lado = 186mm usables
const MARGIN = 12;
const PAGE_W = 210;
const USABLE = PAGE_W - MARGIN * 2; // 186mm

// Helpers para no usar spread (compatibilidad jsPDF v4)
const setFill   = (doc, r, g, b) => doc.setFillColor(r, g, b);
const setStroke = (doc, r, g, b) => doc.setDrawColor(r, g, b);
const setTxt    = (doc, r, g, b) => doc.setTextColor(r, g, b);

// Paleta
const orange    = () => [234, 88,  12];
const dark      = () => [30,  30,  30];
const grayC     = () => [110, 110, 110];
const lightGray = () => [245, 245, 245];
const white     = () => [255, 255, 255];

export const generateProfessionalPDF = (obra, totales, detailLevel, empresa = null) => {
  console.log("🚀 [PDF] Iniciando generación con empresa:", empresa?.nombre_empresa);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ─── ENCABEZADO ─────────────────────────────────────────────────────────────
  setFill(doc, 30, 30, 30);
  doc.rect(0, 0, PAGE_W, 42, 'F');

  // Banda naranja izquierda
  setFill(doc, 234, 88, 12);
  doc.rect(0, 0, 4, 42, 'F');

  // Logo de la empresa (si existe y es una imagen válida)
  if (empresa?.logo_url && empresa.logo_url.startsWith('data:image')) {
    try {
      console.log("🖼️ [PDF] Intentando agregar logo proporcional...");
      const match = empresa.logo_url.match(/^data:image\/(.*?);base64/);
      let format = match ? match[1].toUpperCase() : 'PNG';
      if (format.includes('SVG')) format = 'PNG';
      if (format.includes('JPG')) format = 'JPEG';
      
      const props = doc.getImageProperties(empresa.logo_url);
      const ratio = props.width / props.height;
      
      // Box máximo: 35mm ancho x 25mm alto
      let logoW = 35;
      let logoH = logoW / ratio;
      
      if (logoH > 25) {
        logoH = 25;
        logoW = logoH * ratio;
      }
      
      const logoX = PAGE_W - MARGIN - logoW;
      const logoY = (42 - logoH) / 2 - 2; // Centrado vertical en el header
      
      doc.addImage(empresa.logo_url, format, logoX, logoY, logoW, logoH, undefined, 'FAST');
      console.log(`✅ [PDF] Logo ${format} renderizado: ${logoW.toFixed(1)}x${logoH.toFixed(1)}mm`);
    } catch (e) {
      console.error('❌ [PDF] Error agregando logo:', e);
    }
  }

  // Nombre de empresa (o título genérico)
  const empresaNombre = (empresa?.nombre_empresa || 'PRESUPUESTO DE OBRA').toUpperCase();
  setTxt(doc, 234, 88, 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(empresa?.nombre_empresa ? 14 : 16);
  
  // Fecha (esquina derecha, abajo del logo si existe)
  const fechaStr = new Date().toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric'
  });
  setTxt(doc, 200, 200, 200);
  doc.setFontSize(7.5);
  // Alinear fecha en la base del header para que no choque
  doc.text(`Fecha: ${fechaStr}`, PAGE_W - MARGIN, 38, { align: 'right' });
  doc.text(empresaNombre, MARGIN + 6, 13);

  if (empresa?.nombre_empresa) {
    setTxt(doc, 200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    if (empresa.nit) {
      doc.text(`NIT: ${empresa.nit}`, MARGIN + 6, 20);
      doc.text('PRESUPUESTO DE OBRA', MARGIN + 6, 26);
    } else {
      doc.text('PRESUPUESTO DE OBRA', MARGIN + 6, 20);
    }
  }

  // Nombre de la obra
  setTxt(doc, 255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text((obra?.nombre || 'PROYECTO SIN NOMBRE').toUpperCase(), MARGIN + 6, 35);



  // ─── INFORMACIÓN DEL CLIENTE ─────────────────────────────────────────────
  let curY = 52;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, 234, 88, 12);
  doc.text('INFORMACIÓN DEL CLIENTE', MARGIN, curY);
  setStroke(doc, 234, 88, 12);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, curY + 1.5, PAGE_W - MARGIN, curY + 1.5);

  curY += 7;
  doc.setFont('helvetica', 'normal');
  setTxt(doc, 30, 30, 30);
  doc.setFontSize(9);

  const clienteNombre = obra?.cliente
    ? `${obra.cliente.nombre || ''} ${obra.cliente.apellido || ''}`.trim()
    : 'Particular';

  doc.text(`Nombre: ${clienteNombre}`, MARGIN, curY);
  if (obra?.cliente?.telefono) doc.text(`Tel: ${obra.cliente.telefono}`, MARGIN + 110, curY);
  if (obra?.cliente?.correo) {
    curY += 5;
    doc.text(`Correo: ${obra.cliente.correo}`, MARGIN, curY);
  }

  curY += 8;

  // ─── TABLA DE PARTIDAS ───────────────────────────────────────────────────
  const tableBody = [];

  if (detailLevel === 'ejecutivo') {
    tableBody.push([
      '01',
      'COSTOS DIRECTOS TOTALES (Agrupado)',
      'GLB',
      '1.00',
      formatCOP(totales.costoDirecto),
      formatCOP(totales.costoDirecto),
    ]);
  } else {
    (obra?.partidas || []).forEach((p, index) => {
      tableBody.push([
        (index + 1).toString().padStart(2, '0'),
        (p.nombre || '').toUpperCase(),
        p.unidad || 'Und',
        (p.cantidad || 0).toString(),
        formatCOP(p.valor_unitario || 0),
        formatCOP(p.total || 0),
      ]);

      if (detailLevel === 'apu' && p.apu_detalle?.length > 0) {
        p.apu_detalle.forEach(d => {
          const recName = d.recursos?.nombre || d.cuadrillas?.nombre || 'Recurso';
          const recTipo = d.recursos?.tipo || 'Mano de Obra';
          const recUnd  = d.recursos?.unidad || 'h';
          const recSubt = (d.cantidad || 0) * (d.precio_unitario || 0);

          tableBody.push([
            '',
            `   ↳ ${recName}  [${recTipo.toUpperCase()}]`,
            recUnd,
            (d.cantidad || 0).toString(),
            formatCOP(d.precio_unitario || 0),
            formatCOP(recSubt),
          ]);
        });
      }
    });
  }

  // ─── AUTOTABLE ───────────────────────────────────────────────────────────
  autoTable(doc, {
    startY: curY,
    head: [['#', 'Descripción del Concepto', 'Und.', 'Cant.', 'V. Unitario', 'Subtotal']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 12,  halign: 'center' },
      1: { cellWidth: 67 },
      2: { cellWidth: 14,  halign: 'center' },
      3: { cellWidth: 20,  halign: 'right' },
      4: { cellWidth: 37,  halign: 'right' },
      5: { cellWidth: 36,  halign: 'right' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.1,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { top: 15, left: MARGIN, right: MARGIN, bottom: 20 },
    didParseCell: (data) => {
      // Número de partida en naranja
      if (data.column.index === 0 && data.section === 'body' && data.cell.text[0] !== '') {
        data.cell.styles.textColor = [234, 88, 12];
        data.cell.styles.fontStyle = 'bold';
      }
      // Subtotal de partida en negrita
      if (data.column.index === 5 && data.section === 'body' && data.row.cells[0].text[0] !== '') {
        data.cell.styles.fontStyle = 'bold';
      }
      // Filas de APU: texto gris
      if (data.section === 'body' && data.row.cells[0].text[0] === '' && data.column.index !== 0) {
        data.cell.styles.textColor = [110, 110, 110];
        data.cell.styles.fontStyle = 'italic';
        data.cell.styles.fontSize = 7;
        data.cell.styles.fillColor = [248, 248, 248];
      }
    },
  });

  // ─── DESGLOSE DE ADMINISTRACIÓN (NUEVO) ──────────────────────────────────
  const adminItems = obra?.costos_indirectos?.filter(ci => ci.tipo === 'administracion') || [];
  if (adminItems.length > 0) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setTxt(doc, 30, 30, 30);
    doc.text('DESGLOSE DE ADMINISTRACIÓN DETALLADA', MARGIN, doc.lastAutoTable.finalY + 12);
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [['Descripción / Concepto Administrativo', 'Porcentaje (%)', 'Valor Total']],
      body: adminItems.map(item => [
        item.descripcion.toUpperCase(),
        item.porcentaje ? `${item.porcentaje}%` : 'N/A',
        formatCOP(item.valor)
      ]),
      theme: 'grid',
      headStyles: { fillColor: [60, 60, 60], fontSize: 8 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 120 },
        1: { cellWidth: 33, halign: 'center' },
        2: { cellWidth: 33, halign: 'right' }
      },
      margin: { left: MARGIN, right: MARGIN }
    });
  }

  // ─── RESUMEN DE TOTALES ────────────────────────────────────────────────────
  const afterTableY = doc.lastAutoTable.finalY + 10;

  // La tabla de totales se alinea con las columnas V. Unitario + Subtotal
  const sumX = MARGIN + 12 + 67 + 14 + 20; // = MARGIN + 113
  const sumW = 37 + 36;                     // = 73mm

  const totalRows = [
    { label: 'SUBTOTAL COSTOS DIRECTOS',             value: totales.costoDirecto,     accent: false },
    { label: 'ADMINISTRACIÓN DETALLADA',             value: totales.adminVal,          accent: true  },
    { label: `IMPREVISTOS (${totales.pImp}%)`,       value: totales.imprevistos,       accent: false },
    { label: `UTILIDAD (${totales.pUtil}%)`,         value: totales.utilidad,          accent: false },
    { label: `IVA SOBRE UTILIDAD (${totales.ivaCalc}%)`, value: totales.ivaSobreUtilidad, accent: false },
  ];

  let rowY = afterTableY;
  const rowH = 7;

  totalRows.forEach((row, i) => {
    const bgR = i % 2 === 0 ? 245 : 255;
    setFill(doc, bgR, bgR, bgR);
    doc.rect(sumX, rowY, sumW, rowH, 'F');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    if (row.accent) setTxt(doc, 234, 88, 12);
    else setTxt(doc, 110, 110, 110);
    doc.text(row.label, sumX + 2, rowY + 4.8);

    doc.setFont('helvetica', 'normal');
    setTxt(doc, 30, 30, 30);
    doc.text(formatCOP(row.value), sumX + sumW - 2, rowY + 4.8, { align: 'right' });

    rowY += rowH;
  });

  // Fila total final
  setFill(doc, 30, 30, 30);
  doc.rect(sumX, rowY, sumW, rowH + 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setTxt(doc, 255, 255, 255);
  doc.text('PRESUPUESTO TOTAL PROYECTO', sumX + 2, rowY + 5.8);
  doc.setFontSize(9);
  setTxt(doc, 234, 88, 12);
  doc.text(formatCOP(totales.totalGral), sumX + sumW - 2, rowY + 5.8, { align: 'right' });

  rowY += rowH + 3;

  // Retenciones informativas
  if (totales.icaCalc > 0 || totales.reteCalc > 0) {
    rowY += 5;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    setTxt(doc, 150, 150, 150);
    let txt = 'Valores informativos (retenciones estimadas): ';
    if (totales.icaCalc > 0)  txt += `ICA ${totales.icaCalc}‰ → -${formatCOP(totales.valorICA)}.  `;
    if (totales.reteCalc > 0) txt += `Retefuente ${totales.reteCalc}% → -${formatCOP(totales.valorRetefuente)}.`;
    doc.text(txt, MARGIN, rowY, { maxWidth: USABLE });
  }

  // ─── PIE DE PÁGINA ────────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const ph = doc.internal.pageSize.height;

    setFill(doc, 30, 30, 30);
    doc.rect(0, ph - 12, PAGE_W, 12, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    setTxt(doc, 150, 150, 150);
    const footerEmpresa = empresa?.nombre_empresa || 'SIPO - Sistema de Presupuestación';
    doc.text(`Generado por ${footerEmpresa}`, MARGIN, ph - 4);
    setTxt(doc, 234, 88, 12);
    doc.text(`Página ${i} / ${pageCount}`, PAGE_W - MARGIN, ph - 4, { align: 'right' });
  }

  doc.save(`Presupuesto_${(obra?.nombre || 'Proyecto').replace(/\s+/g, '_')}.pdf`);
};
