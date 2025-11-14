import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import GenerateCertificate from "@/pages/GenerateCertificate";
import TemplatesGallery from "@/pages/TemplatesGallery";
import TemplateEditor from "@/pages/TemplateEditor";

export default function App() {
  return (
    <Router>
      <nav className="p-3 border-b bg-white">
        <div className="max-w-6xl mx-auto flex gap-4">
          <Link to="/">Generate</Link>
          <Link to="/templates">Templates</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<GenerateCertificate />} />
        <Route path="/templates" element={<TemplatesGallery />} />
        <Route path="/editor/:id" element={<TemplateEditor />} />
      </Routes>
    </Router>
  );
}
