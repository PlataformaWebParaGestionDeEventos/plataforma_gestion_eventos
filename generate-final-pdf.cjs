const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

async function generatePDF() {
  console.log('🚀 Iniciando generación de PDF...');

  // Leer archivo HTML
  const htmlPath = path.join(__dirname, 'INFORME_PRUEBAS_UNITARIAS.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  // Crear navegador
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Cargar contenido HTML
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });

    console.log('📄 Generando PDF...');

    // Generar PDF
    const pdfPath = path.join(__dirname, 'INFORME_PRUEBAS_UNITARIAS.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          <span>Informe Técnico de Pruebas Unitarias - Plataforma de Gestión de Eventos UPAO 2025.2</span>
        </div>
      `,
      footerTemplate: `
        <div style="font-size: 9px; width: 100%; text-align: center; color: #666;">
          <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span> - Generado el ${new Date().toLocaleDateString('es-ES')}</span>
        </div>
      `
    });

    console.log('✅ PDF generado exitosamente:', pdfPath);
    console.log('📁 Archivo guardado como:', 'INFORME_PRUEBAS_UNITARIAS.pdf');
    console.log('📊 El informe incluye:');
    console.log('   • Resumen ejecutivo completo');
    console.log('   • 82% de éxito en pruebas (82/100)');
    console.log('   • Análisis detallado de fallos');
    console.log('   • Correcciones implementadas');
    console.log('   • Recomendaciones técnicas');
    console.log('   • Estado de calidad del sistema');

    return pdfPath;

  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Ejecutar generación
generatePDF()
  .then((pdfPath) => {
    console.log('🎯 ¡Proceso completado exitosamente!');
    console.log('📥 Su informe PDF está listo para descarga en:', path.basename(pdfPath));
  })
  .catch((error) => {
    console.error('💥 Error en el proceso:', error.message);
    process.exit(1);
  });