import { Hono } from 'hono';
import puppeteer from 'puppeteer';

const exportRoutes = new Hono();

// Mermaid rendering HTML template
const getMermaidHtml = (code: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    #container {
      display: inline-block;
    }
  </style>
</head>
<body>
  <div id="container">
    <pre class="mermaid">${escapeHtml(code)}</pre>
  </div>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'dark',
      themeVariables: {
        primaryColor: '#2d2d2d',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#404040',
        lineColor: '#a0a0a0',
        secondaryColor: '#363636',
        tertiaryColor: '#1a1a1a',
        background: 'transparent',
        mainBkg: '#2d2d2d',
        nodeBorder: '#d4ff00',
        clusterBkg: '#2d2d2d',
        clusterBorder: '#404040',
        titleColor: '#d4ff00',
        edgeLabelBackground: '#2d2d2d',
      },
      fontFamily: "'IBM Plex Sans', sans-serif",
    });
  </script>
</body>
</html>
`;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface ExportRequest {
  code: string;
  format: 'png' | 'svg' | 'pdf';
}

exportRoutes.post('/export', async (c) => {
  let browser = null;
  
  try {
    const body = await c.req.json<ExportRequest>();
    const { code, format } = body;

    if (!code || !code.trim()) {
      return c.json({ error: 'No code provided' }, 400);
    }

    if (format !== 'png' && format !== 'svg' && format !== 'pdf') {
      return c.json({ error: 'Invalid format. Use "png", "svg", or "pdf"' }, 400);
    }

    // Launch puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Set content
    await page.setContent(getMermaidHtml(code), {
      waitUntil: 'networkidle0',
    });

    // Wait for mermaid to render
    await page.waitForSelector('.mermaid svg', { timeout: 10000 });

    // Get the rendered SVG element
    const svgElement = await page.$('.mermaid svg');
    
    if (!svgElement) {
      throw new Error('Failed to render diagram');
    }

    if (format === 'svg') {
      // Get SVG content
      const svgContent = await page.evaluate(() => {
        const svg = document.querySelector('.mermaid svg');
        if (!svg) return null;
        
        // Add XML declaration and namespace
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(svg);
        
        // Ensure proper SVG namespace
        if (!svgString.includes('xmlns=')) {
          svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        return '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
      });

      if (!svgContent) {
        throw new Error('Failed to extract SVG content');
      }

      return new Response(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': 'attachment; filename="diagram.svg"',
        },
      });
    } else if (format === 'pdf') {
      const boundingBox = await svgElement.boundingBox();

      if (!boundingBox) {
        throw new Error('Could not get diagram dimensions');
      }

      const padding = 20;
      const width = Math.ceil(boundingBox.width + padding * 2);
      const height = Math.ceil(boundingBox.height + padding * 2);

      await page.setViewport({
        width,
        height,
        deviceScaleFactor: 2,
      });

      const pdfBuffer = await page.pdf({
        width: `${width}px`,
        height: `${height}px`,
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
        pageRanges: '1',
      });

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="diagram.pdf"',
        },
      });
    } else {
      // Export as PNG
      const boundingBox = await svgElement.boundingBox();
      
      if (!boundingBox) {
        throw new Error('Could not get diagram dimensions');
      }

      // Add some padding
      const padding = 20;
      await page.setViewport({
        width: Math.ceil(boundingBox.width + padding * 2),
        height: Math.ceil(boundingBox.height + padding * 2),
        deviceScaleFactor: 2, // For better quality
      });

      // Take screenshot of the SVG element
      const pngBuffer = await svgElement.screenshot({
        type: 'png',
        omitBackground: true,
      });

      return new Response(pngBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': 'attachment; filename="diagram.png"',
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : 'Export failed';
    return c.json({ error: message }, 500);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

export default exportRoutes;
