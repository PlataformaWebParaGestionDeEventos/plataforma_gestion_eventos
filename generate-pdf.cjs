const fs = require('fs');
const path = require('path');

// Leer el archivo Markdown
const markdownPath = path.join(__dirname, 'INFORME_PRUEBAS_UNITARIAS.md');
const markdownContent = fs.readFileSync(markdownPath, 'utf8');

// Convertir Markdown a HTML básico
function markdownToHTML(markdown) {
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      return '<pre><code>' + match.slice(3, -3) + '</code></pre>';
    })
    // Inline code
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // Tables (basic)
    .replace(/\|(.*?)\|/g, (match, content) => {
      const cells = content.split('|').map(cell => `<td>${cell.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    })
    // Lists
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap in basic HTML structure
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Informe de Pruebas Unitarias</title>
    <style>
        body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 210mm; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
        }
        h1 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 10px;
            text-align: center;
        }
        h2 { 
            color: #34495e; 
            border-left: 4px solid #3498db; 
            padding-left: 15px;
            margin-top: 30px;
        }
        h3 { 
            color: #2980b9; 
            margin-top: 25px;
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 15px 0;
        }
        th, td { 
            border: 1px solid #ddd; 
            padding: 8px 12px; 
            text-align: left;
        }
        th { 
            background-color: #3498db; 
            color: white;
        }
        tr:nth-child(even) { 
            background-color: #f2f2f2;
        }
        code { 
            background: #f4f4f4; 
            padding: 2px 6px; 
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        pre { 
            background: #f8f8f8; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto;
            border-left: 4px solid #3498db;
        }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        .warning { color: #f39c12; }
        .info { color: #3498db; }
        hr { 
            border: none; 
            height: 2px; 
            background: #3498db; 
            margin: 30px 0;
        }
        @media print {
            body { padding: 10px; }
            h1, h2 { page-break-after: avoid; }
            pre { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="content">
        ${html}
    </div>
    <footer style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666;">
        <p><small>Documento generado automáticamente - Plataforma de Gestión de Eventos UPAO 2025.2</small></p>
    </footer>
</body>
</html>`;
}

// Generar HTML
const htmlContent = markdownToHTML(markdownContent);

// Guardar archivo HTML
const htmlPath = path.join(__dirname, 'INFORME_PRUEBAS_UNITARIAS.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');

console.log('✅ Informe HTML generado exitosamente:', htmlPath);
console.log('📄 Para convertir a PDF, abra el archivo HTML en su navegador y use Ctrl+P > Guardar como PDF');
console.log('🎯 Configuración recomendada: Tamaño A4, márgenes normales, incluir gráficos de fondo');