import { Link } from "react-router-dom";
import { TEMPLATES } from "@/lib/templates";

export default function TemplatesGallery() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Certificate Templates</h1>
        <p className="text-gray-500 mt-2">Select a design to customize and generate.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {TEMPLATES.map((t) => (
          <Link
            key={t.id}
            to={`/editor/${t.id}`}
            className="group relative block h-full"
          >
            <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 overflow-hidden flex flex-col">
              
              {/* Preview Area - CSS Generated Mini Certificate */}
              <div className="aspect-[4/3] bg-gray-50 relative p-6 flex items-center justify-center border-b border-gray-100">
                {/* The Mini Certificate Paper */}
                <div className="w-full h-full bg-white shadow-sm border flex flex-col items-center justify-center p-4 relative">
                  
                  {/* Decorative Border (Double Line) */}
                  <div 
                    className="absolute inset-2 border-2 border-double pointer-events-none"
                    style={{ borderColor: t.accentColor || '#e2e8f0' }} 
                  />

                  {/* Header Content */}
                  <div className="text-center z-10 space-y-2">
                    {/* Badge / Icon */}
                    <div 
                      className="w-8 h-8 mx-auto rounded-full flex items-center justify-center text-white text-xs font-bold mb-2"
                      style={{ backgroundColor: t.accentColor || '#6366f1' }}
                    >
                      ★
                    </div>

                    {/* Title Placeholder */}
                    <div className="h-2 w-24 bg-gray-800 mx-auto rounded-sm opacity-80"></div>
                    
                    {/* Subtitle Lines */}
                    <div className="space-y-1 mt-2">
                        <div className="h-1 w-32 bg-gray-300 mx-auto rounded-sm"></div>
                        <div className="h-1 w-20 bg-gray-300 mx-auto rounded-sm"></div>
                    </div>

                    {/* Name Placeholder (Larger) */}
                    <div 
                        className="h-3 w-40 mx-auto rounded-sm mt-3 opacity-40"
                        style={{ backgroundColor: t.accentColor || '#6366f1' }}
                    ></div>
                  </div>

                  {/* Signature Lines at Bottom */}
                  <div className="absolute bottom-5 w-full px-8 flex justify-between opacity-30">
                      <div className="h-0.5 w-12 bg-gray-600"></div>
                      <div className="h-0.5 w-12 bg-gray-600"></div>
                  </div>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {t.name}
                  </h3>
                  {/* Optional: Badge for your new template */}
                  {t.id.includes('new') || t.name.toLowerCase().includes('anjadhey') ? (
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                        New
                    </span>
                  ) : null}
                </div>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                   {t.previewText || "A professional layout suitable for workshops and awards."}
                </p>

                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-2 h-2 rounded-full" style={{ background: t.accentColor || '#6366f1' }}></span>
                        Landscape
                    </div>
                    <span className="text-sm font-medium text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Customize <span className="text-lg">→</span>
                    </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}