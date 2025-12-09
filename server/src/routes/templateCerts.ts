import { Router } from "express";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import QRCode from "qrcode";
import { renderSvgTemplate } from "../templates/svgRenderer";
import { getTemplateSize } from "../templates/catalog";

// This creates the router that app.ts needs
const router = Router();

/**
 * Convert HTML (or an HTML wrapper that contains an inline SVG) to PDF at exact pixel size.
 * ⚡️ OPTIMIZED FOR RENDER (Docker)
 */
async function svgStringToPdf(svgString: string, widthPx: number, heightPx: number) {
  
  // 1. Launch with optimized flags for low-memory environments
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage', // critical for docker/render to prevent crashes
      '--disable-gpu'
    ],
    executablePath: await chromium.executablePath(),
    headless: true
  });

  try {
    const page = await browser.newPage();
    
    // 2. Set a generous timeout (2 minutes) for heavy operations
    page.setDefaultNavigationTimeout(120000); 

    await page.setViewport({ 
        width: Math.max(800, Math.round(widthPx)), 
        height: Math.max(600, Math.round(heightPx)), 
        deviceScaleFactor: 1 
    });

    const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;800&display=swap');
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        ${svgString}
      </body>
    </html>`;

    // ⚡️ CRITICAL FIX: Changed 'networkidle0' to 'load'
    // 'load' fires as soon as the HTML/CSS is ready. 
    // It is much faster and prevents "Navigation timeout" errors on heavy pages.
    await page.setContent(html, { waitUntil: "load", timeout: 120000 });

    const pdf = await page.pdf({
      printBackground: true,
      width: `${Math.round(widthPx)}px`,
      height: `${Math.round(heightPx)}px`,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      pageRanges: "1",
    });

    return pdf;
  } finally {
    // Ensure browser closes even if errors occur
    await browser.close();
  }
}

/**
 * POST /api/templates/generate-from-template
 */
router.post("/generate-from-template", async (req, res) => {
  try {
    const {
      templateId,
      values,
      options,
      signatureLeftDataUrl,
      signatureRightDataUrl,
    } = req.body as {
      templateId: string;
      values: Record<string, string>;
      options?: { accent?: string; logoDataUrl?: string; qrText?: string };
      signatureLeftDataUrl?: string;
      signatureRightDataUrl?: string;
    };

    if (!templateId || !values) {
      return res.status(400).json({ error: "templateId and values are required" });
    }

    const renderOpts: any = {
      accent: options?.accent,
      logoDataUrl: options?.logoDataUrl,
      signatureLeftDataUrl,
      signatureRightDataUrl,
    };

    if (options?.qrText) {
      renderOpts.qrDataUrl = await QRCode.toDataURL(options.qrText, { margin: 1, scale: 6 });
    }

    const svg = renderSvgTemplate(templateId, values, renderOpts);
    const { width, height } = getTemplateSize(templateId);
    const pdf = await svgStringToPdf(svg, width, height);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${templateId}-certificate.pdf"`);
    return res.status(200).send(pdf);
  } catch (err) {
    console.error("template PDF error:", err);
    return res.status(500).json({ error: "Failed to generate template PDF" });
  }
});

/**
 * POST /api/templates/preview
 */
router.post("/preview", async (req, res) => {
  try {
    const {
      templateId,
      values,
      options,
      signatureLeftDataUrl,
      signatureRightDataUrl,
    } = req.body as {
      templateId: string;
      values: Record<string, string>;
      options?: { accent?: string; logoDataUrl?: string; qrText?: string };
      signatureLeftDataUrl?: string;
      signatureRightDataUrl?: string;
    };

    if (!templateId || !values) {
      return res.status(400).json({ error: "templateId and values are required" });
    }

    const renderOpts: any = {
      accent: options?.accent,
      logoDataUrl: options?.logoDataUrl,
      signatureLeftDataUrl,
      signatureRightDataUrl,
    };

    if (options?.qrText) {
      renderOpts.qrDataUrl = await QRCode.toDataURL(options.qrText, { margin: 1, scale: 6 });
    }

    const svg = renderSvgTemplate(templateId, values, renderOpts);

    res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
    return res.status(200).send(svg);
  } catch (err: any) {
    console.error("DEV preview error (full):", err);
    return res.status(500).json({
      error: "Failed to render template SVG (dev details)",
      message: err?.message ?? String(err),
      stack: err?.stack?.split("\n").slice(0, 20) ?? null,
    });
  }
});

// This line fixes the 'no default export' error
export default router;