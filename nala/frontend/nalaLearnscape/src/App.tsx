import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ThreadMap from "./pages/ThreadMap";
import "./App.css";
import { Modules } from "./pages/Modules";
import ModuleInfo from "./pages/ModuleInfo";
import KnowledgeCapsule from "./pages/KnowledgeCapsule";
import Quiz from "./pages/Quiz";
import Chatbot from "./pages/Chatbot";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Modules" element={<Modules />} />
        <Route path="/Modules/:moduleId" element={<ModuleInfo />} />
        <Route path="/threadmap" element={<ThreadMap />} />
        <Route path="/Modules/:moduleId/Topics/:topicId/Notes" element={<KnowledgeCapsule />} />
        <Route path="/Modules/:moduleId/quiz" element={<Quiz />} />
        <Route path="/Modules/:moduleId/chatbot" element={<Chatbot />} />
      </Routes>
    </Router>
  );
}

export default App;
