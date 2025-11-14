import fs from "fs";
import path from "path";

/**
 * HELPER: Wraps text into SVG <tspan> lines so it fits neatly.
 * ✅ FIX: This is the correct center-aligning version.
 * It returns lines centered at x="50%" (which inherits
 * the 'x="707"' from your <text> tag).
 */
const wrapTextToSVG = (text: string, maxCharsPerLine: number) => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if (currentLine.length + 1 + words[i].length <= maxCharsPerLine) {
      currentLine += ' ' + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  // Returns lines centered (x="50%") with spacing (dy="1.4em")
  return lines.map((line, index) => 
    `<tspan x="50%" dy="${index === 0 ? 0 : '1.4em'}">${line}</tspan>`
  ).join('');
};

/**
 * Render an SVG template by replacing placeholders or Dynamic Anchors.
 */
export function renderSvgTemplate(
  templateId: string,
  values: Record<string, string>,
  opts?: {
    accent?: string;
    logoDataUrl?: string;
    signatureLeftDataUrl?: string;
    signatureRightDataUrl?: string;
    qrDataUrl?: string;
  }
): string {
  // 1. Load the file
  const svgPath = path.join(__dirname, "assets", `${templateId}`); 
  const finalPath = svgPath.endsWith('.svg') ? svgPath : `${svgPath}.svg`;

  if (!fs.existsSync(finalPath)) {
    throw new Error(`SVG template not found: ${finalPath}`);
  }

  let svg = fs.readFileSync(finalPath, "utf8");

  // 2. Normalize incoming values keys
  const lowerMap: Record<string, string> = {};
  Object.keys(values || {}).forEach((k) => {
    lowerMap[k.trim().toLowerCase()] = values[k];
  });

  // --- 3. SMART LOGIC: (FIXED TO CENTER-ALIGN) ---
  // ✅ FIX 1: Changed ID to "CONTENT_GOES_HERE" to match your SVG
  if (svg.includes('id="CONTENT_GOES_HERE"')) {
    
    const name = lowerMap['name'] || lowerMap['studentname'] || "Participant";
    const position = lowerMap['position'] || "Student";
    const competition = lowerMap['course'] || lowerMap['competitionname'] || lowerMap['competition'] || "Event";
    const date = lowerMap['date'] || new Date().toLocaleDateString();

    const fullMessage = `This certificate is awarded to ${name} of ${position} for outstanding participation in ${competition}. It serves as proof of competence and excellent application of skills and knowledge. This certificate was awarded on ${date}.`;

    // ✅ FIX 2: Set a good wrap limit (45) and call the correct function
    const wrappedContent = wrapTextToSVG(fullMessage, 45);

    // ✅ FIX 3: Regex looks for your ID and respects your SVG styles
    const replaceRegex = /(<text id="CONTENT_GOES_HERE"[^>]*>)([\s\S]*?)(<\/text>)/;

    svg = svg.replace(replaceRegex, (match, startTag, oldContent, endTag) => {
        return `${startTag}${wrappedContent}${endTag}`;
    });
  }
  // --- END SMART LOGIC ---

  // 4. Standard Placeholder Replacement (This will fix {{NAME}})
  svg = svg.replace(/{{\s*(.*?)\s*}}/g, (_match, keyRaw: string) => {
    const key = String(keyRaw || "").trim();
    if (!key) return "";
    const vExact = values?.[key];
    const vLower = lowerMap[key.toLowerCase()];
    const vUpper = values?.[key.toUpperCase()];
    return (vExact ?? vLower ?? vUpper ?? "") as string;
  });

  // 5. Options Replacements
  if (opts?.accent) svg = svg.replace(/{{\s*ACCENT\s*}}/g, opts.accent);
  // ... (rest of options)

  return svg;
}

export function getTemplateSize(templateId: string): { width: number; height: number } {
  const cleanId = templateId.replace('.svg', '');
  switch (cleanId) {
    case "code-red":
      return { width: 842, height: 595 }; 
    case "anjadhey":
      return { width: 1414, height: 2000 }; 
    default:
      return { width: 842, height: 595 };
  }
}