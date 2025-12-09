import { useState } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { TEMPLATES } from '@/lib/templates';

export default function GenerateCertificate() {
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState("");

  // 1. Handle File Upload (FIXED DATE LOGIC)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const rawData = XLSX.utils.sheet_to_json(ws);

      const normalizedData = rawData.map((row: any) => {
        const newRow: any = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.trim().toUpperCase().replace(/\s+/g, '_');
          
          let val = row[key];
          
          // 🛠️ FIX: Add 12 hours to prevent timezone rollback
          if (val instanceof Date) {
             const safeDate = new Date(val.getTime() + 43200000); // +12 hours
             // Format as DD-MM-YYYY (or DD/MM/YYYY)
             val = safeDate.toLocaleDateString('en-GB').replace(/\//g, '-'); 
          }
          
          newRow[cleanKey] = val;
        });
        return newRow;
      });

      setExcelData(normalizedData);
    };
    reader.readAsBinaryString(file);
  };


  // 2. Generate & Zip Logic
  const handleBulkGenerateAndZip = async () => {
    setIsProcessing(true);
    setStatus("Initializing ZIP archive...");

    // Matches your setup for Vercel env vars
    const apiUrl = import.meta.env.VITE_API_URL || '';
    
    const zip = new JSZip(); 
    let successCount = 0;

    for (let i = 0; i < excelData.length; i++) {
      const row = excelData[i];
      
      // Try to find a good name for the status update
      const displayName = row.NAME || row.STUDENT_NAME || row.PARTICIPANT || `Person ${i+1}`;
      setStatus(`Generating ${i + 1} of ${excelData.length}: ${displayName}...`);

      try {
        const values = { ...row }; 

        if (values['COMPETITION']) values['COURSE'] = values['COMPETITION'];
        if (values['EVENT']) values['COURSE'] = values['EVENT'];
        if (values['WORKSHOP']) values['COURSE'] = values['WORKSHOP'];

        const templateDef = TEMPLATES.find(t => t.id === selectedTemplate);
        templateDef?.fields.forEach(f => {
           if (!values[f.key]) values[f.key] = f.default;
        });

        const resp = await fetch(`${apiUrl}/api/templates/generate-from-template`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: selectedTemplate,
            values: values,
          }),
        });

        if (!resp.ok) throw new Error("Server Error");

        const blob = await resp.blob();
        
        const safeName = (displayName)
          .replace(/[^a-z0-9]/gi, '_'); 
          
        const fileName = `${safeName}.pdf`;

        zip.file(fileName, blob);
        successCount++;

      } catch (err) {
        console.error(`Failed row ${i}:`, err);
      }

      await new Promise(r => setTimeout(r, 200));
    }

    setStatus("Compressing files into ZIP...");
    const zipContent = await zip.generateAsync({ type: "blob" });
    
    const zipName = `Certificates_Batch_${new Date().toISOString().slice(0,10)}.zip`;
    saveAs(zipContent, zipName);

    setStatus(`Success! Downloaded ${successCount} certificates in ${zipName}`);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Bulk Certificate Generator</h1>

      {/* Step 1: Template */}
      <div className="mb-6 p-4 bg-white border rounded shadow-sm">
        <label className="block font-semibold mb-2">1. Select Template</label>
        <select 
          className="w-full p-2 border rounded"
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          {TEMPLATES.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Step 2: Upload */}
      <div className="mb-6 p-4 bg-white border rounded shadow-sm">
        <label className="block font-semibold mb-2">2. Upload Excel File</label>
        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
        
        {/* ✅ DYNAMIC LABEL CHANGE HERE */}
        <p className="text-sm text-gray-500 mt-2">
          Required columns:{" "}
          <strong className="text-indigo-600">
            {TEMPLATES.find((t) => t.id === selectedTemplate)
              ?.fields.map((f) => f.key)
              .join(", ") || "NAME, COMPETITION, DATE"}
          </strong>
        </p>
      </div>

      {/* Step 3: Generate ZIP */}
      {excelData.length > 0 && (
        <div className="p-4 bg-white border rounded shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Preview Data ({excelData.length} rows)</h2>
            
            <button 
              onClick={handleBulkGenerateAndZip}
              disabled={isProcessing}
              className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? (
                <>Processing...</>
              ) : (
                <>
                   <span>Download All as ZIP</span>
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </>
              )}
            </button>
          </div>

          {/* Progress Status Bar */}
          {status && (
             <div className={`mb-4 p-3 rounded text-sm font-medium ${status.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-blue-50 text-blue-800'}`}>
                {status}
             </div>
          )}

          <div className="overflow-auto max-h-60 border rounded">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  {Object.keys(excelData[0]).map(key => (
                    <th key={key} className="p-2 border-b">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="p-2 border-b">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}