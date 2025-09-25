import React from "react";
import Welcome from "../components/welcome";
import ThreadMapSection from "../components/ThreadMapSection";
import "./Home.css";

const Home: React.FC = () => {
  return (
    <main className="home">
      <Welcome />
      <div className="home__below">
        <ThreadMapSection />
        <aside className="home__side-card" aria-hidden="true" />
      </div>
    </main>
  );
};

export default Home;
