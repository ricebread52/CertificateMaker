export type RenderOptions = {
  accent?: string;
  logoDataUrl?: string;
  signatureDataUrl?: string;
  qrDataUrl?: string;
};

export function getTemplateSize(templateId: string): { width: number; height: number } {
  // Normalize: remove .svg extension and make lowercase to prevent mismatches
  const cleanId = templateId.replace('.svg', '').toLowerCase().trim();

  switch (cleanId) {
    case "code-red":
      return { width: 842, height: 595 }; 
      
    case "anjadhey": 
    case "anjadhey event": // <--- ADDED: Fixes the chopped PDF issue!
      return { width: 1414, height: 2000 }; 
      
    default:
      return { width: 842, height: 595 };
  }
}

// Add "anjadhey event" to this array
export const AVAILABLE_TEMPLATES = ["code-red", "anjadhey", "anjadhey event"];