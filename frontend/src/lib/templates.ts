export type TemplateField = {
  key: string;
  label: string;
  type: "text" | "date";
  default: string;
};

export type TemplateDef = {
  id: string;
  name: string;
  previewText: string;
  accentColor: string;
  fields: TemplateField[];
  layout: {
    width: number;
    height: number;
    textAlign: "left" | "center";
    fontFamily: string;
  };
};

export const TEMPLATES: TemplateDef[] = [
  {
    id: "anjadhey", // <--- MATCHES FILENAME anjadhey.svg
    name: "Anjadhey Foundation",
    previewText: "Official Certificate",
    accentColor: "#ea580c", // Orange/Red style
    fields: [
      { key: "NAME", label: "Recipient Name", type: "text", default: "Jeneil" },
      { key: "COURSE", label: "Course/Event", type: "text", default: "Web Development Workshop" },
      { key: "DATE", label: "Date", type: "date", default: new Date().toISOString().slice(0, 10) },
      { key: "ID_NO", label: "Certificate ID", type: "text", default: "ANJ-2025-001" },
    ],
    layout: { width: 1414, height: 2000, textAlign: "center", fontFamily: "serif" }
  },
  {
    id: "code-red",
    name: "Code Red",
    previewText: "Hackathon Special",
    accentColor: "#8b2d85",
    fields: [
      { key: "BRAND_NAME", label: "Brand Name", type: "text", default: "Your Brand" },
      { key: "TITLE", label: "Title", type: "text", default: "Certificate of Achievement" },
      { key: "PRESENTED_TO", label: "Presented To", type: "text", default: "Presented To" },
      { key: "NAME", label: "Recipient Name", type: "text", default: "Mason Parker" },
      { key: "DESCRIPTION", label: "Description", type: "text", default: "Has Achieved Excellence" },
      { key: "DATE", label: "Date", type: "date", default: new Date().toISOString().slice(0,10) },
      { key: "EMPLOYEE_NAME", label: "Left Signer", type: "text", default: "Signer One" },
      { key: "GENERAL_NAME", label: "Right Signer", type: "text", default: "Signer Two" },
    ],
    layout: { width: 900, height: 631, textAlign: "center", fontFamily: "Playfair Display, serif" }
  },
];