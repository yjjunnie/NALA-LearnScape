import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ThreadMap_try from "./pages/ThreadMap";
import "./App.css";
import { Modules } from "./pages/Modules";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Modules" element={<Modules />} />
        <Route path="/threadmap" element={<ThreadMap_try />} />
      </Routes>
    </Router>
  );
}

export default App;
