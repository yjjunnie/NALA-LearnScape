// src/pages/Home.jsx
import { Link, useNavigate } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Home Page</h1>
      <p>This is just a test page for navigation.</p>
      <Link
        to="/threadmap"
        style={{
          display: "inline-block",
          marginTop: "20px",
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          textDecoration: "none",
          borderRadius: "5px",
        }}
      >
        Go to Thread Map
      </Link>
    </div>
  );
}
