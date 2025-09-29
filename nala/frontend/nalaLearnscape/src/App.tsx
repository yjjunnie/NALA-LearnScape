import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ThreadMap_try from "./pages/ThreadMap";
import "./App.css";
import { Modules } from "./pages/Modules";
import ModuleInfo from "./pages/ModuleInfo";
import KnowledgeCapsule from "./pages/KnowledgeCapsule";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Modules" element={<Modules />} />
        <Route path="/Modules/:moduleId" element={<ModuleInfo />} />
        <Route path="/Modules/:moduleId/Topics/:topicId/Notes" element={<KnowledgeCapsule />} />
        <Route path="/threadmap" element={<ThreadMap_try />} />
      </Routes>
    </Router>
  );
}

export default App;
