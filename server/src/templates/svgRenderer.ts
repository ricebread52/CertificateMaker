import fs from "fs";
import path from "path";

/**
 * HELPER: Wraps text into SVG <tspan> lines so it fits neatly.
 * Returns lines centered at x="50%" (which inherits
 * the 'x' center point from your <text> tag).
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
  // Handle if user passes "anjadhey event" or "anjadhey event.svg"
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

  // --- LOGIC 1: EXISTING TEMPLATES (Preserved) ---
  if (svg.includes('id="CONTENT_GOES_HERE"')) {
    
    const name = lowerMap['name'] || lowerMap['studentname'] || "Participant";
    const position = lowerMap['position'] || "Student";
    const competition = lowerMap['course'] || lowerMap['competitionname'] || lowerMap['competition'] || "Event";
    const date = lowerMap['date'] || new Date().toLocaleDateString();

    const fullMessage = `This certificate is awarded to ${name} of ${position} for outstanding participation in ${competition}. It serves as proof of competence and excellent application of skills and knowledge. This certificate was awarded on ${date}.`;

    const wrappedContent = wrapTextToSVG(fullMessage, 45);

    const replaceRegex = /(<text id="CONTENT_GOES_HERE"[^>]*>)([\s\S]*?)(<\/text>)/;

    svg = svg.replace(replaceRegex, (match, startTag, oldContent, endTag) => {
        // Safety: Ensure text is center-anchored so x="50%" works correctly
        let newStartTag = startTag;
        if (!newStartTag.includes('text-anchor="middle"')) {
             newStartTag = newStartTag.replace('>', ' text-anchor="middle">');
        }
        return `${newStartTag}${wrappedContent}${endTag}`;
    });
  }

  // --- LOGIC 2: NEW ANJADHEY EVENT TEMPLATE (Added) ---
  if (svg.includes('id="cert_body_text"')) {
    
    const name = lowerMap['name'] || "Participant";
    // NOTE: Removed 'position' as requested.
    const competition = lowerMap['course'] || lowerMap['competition'] || "Event";
    const date = lowerMap['date'] || new Date().toLocaleDateString();

    // Specific sentence for Anjadhey Event
    const fullMessage = `We Anjadhey Helping Hands Foundation is to certify that ${name} has actively participated in Children’s Day 2025 ${competition} on ${date}.`;

    // Wrap text (40 chars works best for this large font)
    const wrappedContent = wrapTextToSVG(fullMessage, 40);

    const replaceRegex = /(<text id="cert_body_text"[^>]*>)([\s\S]*?)(<\/text>)/;

    svg = svg.replace(replaceRegex, (match, startTag, oldContent, endTag) => {
        // Safety: Ensure text is center-anchored
        let newStartTag = startTag;
        if (!newStartTag.includes('text-anchor="middle"')) {
             newStartTag = newStartTag.replace('>', ' text-anchor="middle">');
        }
        return `${newStartTag}${wrappedContent}${endTag}`;
    });
  }

  // 4. Standard Placeholder Replacement
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

  return svg;
}

/**
 * Updated to include the new template size
 */
export function getTemplateSize(templateId: string): { width: number; height: number } {
  const cleanId = templateId.replace('.svg', '').toLowerCase(); // Normalize case
  switch (cleanId) {
    case "code-red":
      return { width: 842, height: 595 }; 
    case "anjadhey":
    case "anjadhey event": // Added new case
      return { width: 1414, height: 2000 }; 
    default:
      return { width: 842, height: 595 };
  }
}