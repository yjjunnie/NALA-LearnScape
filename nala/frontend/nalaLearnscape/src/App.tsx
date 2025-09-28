import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import ThreadMap_try from "./pages/ThreadMap_try";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/threadmap" element={<ThreadMap_try />} />
      </Routes>
    </Router>
  );
}

export default App;
