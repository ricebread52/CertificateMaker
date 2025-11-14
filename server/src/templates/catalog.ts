export type RenderOptions = {
  accent?: string;
  logoDataUrl?: string;
  signatureDataUrl?: string;
  qrDataUrl?: string;
};

export function getTemplateSize(templateId: string): { width: number; height: number } {
  switch (templateId) {
    case "code-red":
      return { width: 842, height: 595 }; 
    case "anjadhey": // <--- ADD THIS
      return { width: 1414, height: 2000 }; // Standard A4 Landscape
    default:
      return { width: 842, height: 595 };
  }
}

// Add "anjadhey" to this array
export const AVAILABLE_TEMPLATES = ["code-red", "anjadhey"];