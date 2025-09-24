// src/pages/Home.jsx
import { Link, useNavigate } from "react-router-dom";
import learningStyle from "../components/learningStyle";

export default function Home() {
  const DEMO_STUDENT_ID = 1;

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
