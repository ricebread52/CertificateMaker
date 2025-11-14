import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps { pdfUrl: string; }

export default function PDFViewer({ pdfUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div className="flex flex-col items-center bg-gray-100 p-4 rounded-lg border w-full">
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div className="p-10 text-gray-500">Loading PDF...</div>}
        className="flex justify-center"
      >
        <Page 
            pageNumber={pageNumber} 
            renderTextLayer={false} 
            renderAnnotationLayer={false} 
            width={600} // Adjust width as needed
        />
      </Document>

      {numPages && numPages > 1 && (
        <div className="flex items-center gap-4 mt-4">
          <button 
            className="px-3 py-1 bg-white border rounded disabled:opacity-50 hover:bg-gray-50"
            disabled={pageNumber <= 1} 
            onClick={() => setPageNumber(p => p - 1)}
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {pageNumber} of {numPages}</span>
          <button 
            className="px-3 py-1 bg-white border rounded disabled:opacity-50 hover:bg-gray-50"
            disabled={pageNumber >= numPages} 
            onClick={() => setPageNumber(p => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}