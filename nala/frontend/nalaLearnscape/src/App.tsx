import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ThreadMap from './pages/ThreadMap';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/threadmap" element={<ThreadMap />} />
      </Routes>
    </Router>
  );
}

export default App;
