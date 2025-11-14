import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { TEMPLATES, type TemplateDef } from "@/lib/templates";
// IMPORT THE VIEWER HERE
import PDFViewer from "../components/PDFViewer";

type Values = Record<string, string>;

export default function TemplateEditor() {
  const { id } = useParams();
  const template = useMemo<TemplateDef | undefined>(
    () => TEMPLATES.find((t) => t.id === id),
    [id]
  );

  const [values, setValues] = useState<Values>({});
  const [accent, setAccent] = useState<string>("#8b2d85");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [signatureLeftDataUrl, setSignatureLeftDataUrl] = useState<string | null>(null);
  const [signatureRightDataUrl, setSignatureRightDataUrl] = useState<string | null>(null);
  const [qrText, setQrText] = useState<string>("");
  
  // NEW: State for the PDF Viewer
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // init defaults
  useEffect(() => {
    if (!template) return;
    const v: Values = {};
    template.fields.forEach((f) => (v[f.key] = f.default));
    setValues(v);
    setAccent((template as any).accentColor ?? "#8b2d85");
    setLogoDataUrl(null);
    setSignatureLeftDataUrl(null);
    setSignatureRightDataUrl(null);
    setQrText("");
    setPdfUrl(null); // Reset PDF on template switch
    if (iframeRef.current) iframeRef.current.srcdoc = "";
  }, [template]);

  if (!template) return <div className="p-6">Template not found.</div>;

  const { layout } = template;

  function handleChange(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
    // setPdfUrl(null); // Optional: Hide PDF if user changes text
  }

  function readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  // Preview (SVG)
  const doPreview = useCallback(async () => {
    // Switch off PDF view when updating preview
    setPdfUrl(null);

    try {
      const payload: any = {
        templateId: template.id,
        values,
        options: {
          accent,
          logoDataUrl: logoDataUrl ?? undefined,
          qrText: qrText || undefined,
        },
        signatureLeftDataUrl: signatureLeftDataUrl ?? undefined,
        signatureRightDataUrl: signatureRightDataUrl ?? undefined,
      };

      const resp = await fetch("/api/templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) throw new Error(await resp.text());

      const svgText = await resp.text();
      const iframe = iframeRef.current;
      if (iframe) iframe.srcdoc = svgText;

    } catch (err) {
      console.error("Preview error:", err);
    }
  }, [template, values, accent, logoDataUrl, signatureLeftDataUrl, signatureRightDataUrl, qrText]);

  // Generate PDF (for Viewer)
  async function handleGeneratePdf() {
    setIsGenerating(true);
    try {
      const resp = await fetch("/api/templates/generate-from-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template!.id,
          values,
          options: { accent, logoDataUrl: logoDataUrl ?? undefined, qrText: qrText || undefined },
          signatureLeftDataUrl: signatureLeftDataUrl ?? undefined,
          signatureRightDataUrl: signatureRightDataUrl ?? undefined,
        }),
      });

      if (!resp.ok) throw new Error(await resp.text());

      // Get Blob and create URL for the viewer
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);

    } catch (e) {
      console.error(e);
      alert("Export failed — check console.");
    } finally {
      setIsGenerating(false);
    }
  }

  // Helper to download
  function downloadCurrentPdf() {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${template!.id}-certificate.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // Scale Iframe Logic
  useEffect(() => {
    const container = containerRef.current;
    const iframe = iframeRef.current;
    if (!container || !iframe) return;

    function applyScale() {
      if (!container || !iframe) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const svgW = layout.width;
      const svgH = layout.height;
      const scale = Math.min(1, cw / svgW, ch / svgH);

      iframe.style.width = `${svgW}px`;
      iframe.style.height = `${svgH}px`;
      iframe.style.transform = `scale(${scale})`;
      iframe.style.transformOrigin = "top left";
      
      const displayedW = svgW * scale;
      const displayedH = svgH * scale;
      iframe.style.position = "absolute";
      iframe.style.left = `${Math.max(0, (cw - displayedW) / 2)}px`;
      iframe.style.top = `${Math.max(0, (ch - displayedH) / 2)}px`;
      container.style.overflow = "hidden";
    }

    applyScale();
    const ro = new ResizeObserver(applyScale);
    ro.observe(container);
    window.addEventListener("orientationchange", applyScale);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", applyScale);
    };
  }, [layout.width, layout.height, pdfUrl]); // Recalc when PDF view toggles

  // Auto-preview on load
  useEffect(() => {
    const t = setTimeout(() => doPreview(), 150);
    return () => clearTimeout(t);
  }, [doPreview]);

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* LEFT COLUMN: Controls */}
      <div className="lg:col-span-2 bg-white rounded-lg border p-4 h-fit">
        <h2 className="text-lg font-semibold mb-4">Customize</h2>
        
        <div className="space-y-3">
          {template.fields.map((f) => (
            <label key={f.key} className="block">
              <span className="text-sm font-medium text-gray-700">{f.label}</span>
              <input
                type={f.type === "date" ? "date" : "text"}
                value={values[f.key] ?? ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm px-3 py-2 border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </label>
          ))}
          
          {/* Accent Color */}
          <label className="block">
            <span className="text-sm font-medium">Accent color</span>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="color" 
                value={accent} 
                onChange={(e) => setAccent(e.target.value)} 
                className="h-8 w-12 p-0 border rounded cursor-pointer" 
              />
              <span className="text-xs text-gray-500">{accent}</span>
            </div>
          </label>

          {/* FILE INPUTS (Simplified for brevity, add yours back if needed) */}
          {/* ... Add your Logo/Signature inputs here if they were working fine ... */}
          
        </div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button 
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition-colors text-sm font-medium" 
            onClick={doPreview}
          >
            Update Preview
          </button>

          <button 
            className="px-4 py-2 rounded bg-violet-600 text-white hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2" 
            onClick={handleGeneratePdf}
            disabled={isGenerating}
          >
             {isGenerating ? "Generating..." : "Generate PDF"}
          </button>

          <button
            className="px-3 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
            onClick={() => {
                setPdfUrl(null);
                // Reset logic here...
                setTimeout(doPreview, 50);
            }}
          >
            Reset
          </button>
        </div>

        {/* Download Section (Only appears if PDF exists) */}
        {pdfUrl && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-center animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-green-700 mb-2 font-medium">PDF Generated!</p>
                <button 
                    onClick={downloadCurrentPdf}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-bold shadow-sm"
                >
                    Download File
                </button>
            </div>
        )}
      </div>

      {/* RIGHT COLUMN: Preview Area */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="flex justify-between items-center pb-2 border-b">
            <h3 className="font-bold text-gray-700">
                {pdfUrl ? "Final PDF Preview" : "Live Draft Preview"}
            </h3>
            {pdfUrl && (
                <button onClick={() => setPdfUrl(null)} className="text-xs text-blue-600 hover:underline">
                    Back to Edit Mode
                </button>
            )}
        </div>

        {/* CONDITIONAL RENDER: PDF Viewer vs SVG Iframe */}
        {pdfUrl ? (
            <div className="animate-in zoom-in-95 duration-300">
                <PDFViewer pdfUrl={pdfUrl} />
            </div>
        ) : (
            <div
              ref={containerRef}
              className="relative bg-white shadow-md rounded overflow-hidden"
              style={{
                width: "100%",
                minHeight: `${layout.height}px`, // ensure container has height
                border: "1px solid #e5e7eb",
                background: "#f3f1ef",
              }}
            >
              <iframe
                ref={iframeRef}
                title="SVG preview"
                sandbox="allow-same-origin allow-scripts"
                style={{
                  border: "none",
                  position: "absolute",
                  top: "0",
                  left: "0",
                  pointerEvents: "none", // Prevents iframe capturing scroll
                }}
              />
            </div>
        )}
      </div>

    </div>
  );
}