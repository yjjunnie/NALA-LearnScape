import React, { useState } from "react";
import Scheduler from "./Scheduler";
import LearningStyleOverview from "./LearningStyleOverview";

const Welcome: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="welcome">
      <div className="welcome__card">
        <div className="welcome__header">
          <button className="welcome__menu" aria-label="Open navigation menu">
            <span />
            <span />
            <span />
          </button>
          <div className="welcome__title-group">
            <h1>
              Welcome back,
              <span className="welcome__highlight"> John!</span>
            </h1>
            <button
              type="button"
              className="welcome__cta"
              onClick={() => setIsModalOpen(true)}
            >
              Find out why
            </button>
          </div>
        </div>
        <Scheduler />
      </div>
      <LearningStyleOverview />

      {isModalOpen && (
        <div className="welcome__modal" role="dialog" aria-modal="true">
          <div className="welcome__modal-content">
            <button
              type="button"
              className="welcome__modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Close explanation"
            >
              ×
            </button>
            <div className="welcome__modal-body" />
          </div>
          <div
            className="welcome__modal-backdrop"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />
        </div>
      )}
    </section>
  );
};

export default Welcome;
