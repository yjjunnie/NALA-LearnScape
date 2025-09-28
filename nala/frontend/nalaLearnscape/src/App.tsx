import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ThreadMap from "./pages/ThreadMap";
import "./App.css";
import { Modules } from "./pages/Modules";
import ModuleInfo from "./pages/ModuleInfo";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Modules" element={<Modules />} />
        <Route path="/Modules/:moduleId" element={<ModuleInfo />} />
        <Route path="/threadmap" element={<ThreadMap_try />} />
      </Routes>
    </Router>
  );
}

export default App;
