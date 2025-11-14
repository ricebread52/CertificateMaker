import { Router } from "express";
import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { renderSvgTemplate } from "../templates/svgRenderer";

const router = Router();

router.post("/generate", async (req, res) => {
  try {
    const {
      name = "Unknown",
      position = "Participant",
      competitionName = "Event",
      course,
      date = new Date().toLocaleDateString(),
      templateId = "anjadhey.svg"
    } = req.body;

    const certificateData = {
      name,
      position,
      competition: competitionName || course || "Event",
      date
    };

    // 1. Generate SVG
    const svgContent = renderSvgTemplate(templateId, certificateData);

    // 2. HTML Wrapper (THE NUCLEAR OPTION)
    // - Absolute positioning: 0,0
    // - Overflow hidden: prevents extra pages
    // - Explicit pixel sizes on BODY and SVG
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&display=swap');
            
            body, html {
              margin: 0;
              padding: 0;
              width: 1414px;
              height: 2000px;
              overflow: hidden; /* Stop scrollbars */
              background-color: #ffffff; /* Ensure white paper */
            }

            /* Force SVG to lock to top-left corner */
            svg {
              position: absolute;
              top: 0;
              left: 0;
              width: 1414px;
              height: 2000px;
              display: block;
            }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `;

    // 3. Launch Puppeteer
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true
    });
    
    const page = await browser.newPage();
    
    // Set Viewport exactly to certificate size
    await page.setViewport({ width: 1414, height: 2000 });

    // Set Content
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // ⚠️ IMPORTANT FIX: Force "Screen" media type
    // This tricks Puppeteer into rendering colors exactly like Chrome does
    await page.emulateMediaType('screen');

    // ⚠️ IMPORTANT FIX: Wait for the SVG to definitely be there
    await page.waitForSelector('svg');

    // 4. Generate PDF
    const pdfBuffer = await page.pdf({
      width: '1414px',
      height: '2000px',
      printBackground: true,
      pageRanges: '1',
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    await browser.close();

    // 5. Save Locally
    const fileName = `CERT-${Date.now()}.pdf`;
    const outputFolder = path.join(__dirname, '../../generated');
    
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    const savePath = path.join(outputFolder, fileName);
    fs.writeFileSync(savePath, pdfBuffer);

    console.log(`✅ PDF Saved at: ${savePath}`);

    res.status(200).json({ 
        message: "Certificate generated!", 
        filePath: savePath 
    });

  } catch (err: any) {
    console.error("❌ Error:", err);
    return res.status(500).json({ error: "Failed", details: err.message });
  }
});

export default router;