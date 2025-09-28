import React, { useState, useEffect } from "react";
import type { Student } from "../types/models";
import type { LearningStyleProps } from "../types/components";

const LearningStyle: React.FC<LearningStyleProps> = ({
  studentId,
  showDescription = true,
  onStyleLoad,
}) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudent = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/student/${studentId}/`);

        if (!response.ok) {
          throw new Error(`Failed to fetch student: ${response.status}`);
        }

        const data: Student = await response.json();
        setStudent(data);

        // Call parent callback if provided
        if (onStyleLoad && data.learningStyle) {
          onStyleLoad(data.learningStyle, data.learning_style_description);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load student data"
        );
        console.error("Error fetching student:", err);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchStudent();
    }
  }, [studentId, onStyleLoad]);

  if (loading) {
    return <div className="loading">Loading learning style...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!student) {
    return <div className="error">Student not found</div>;
  }

  if (!student.learningStyle) {
    return (
      <div className="learning-style no-style">
        <h3>Learning Style</h3>
        <p>No learning style selected for {student.name}</p>
      </div>
    );
  }

  return (
    <div className="learning-style">
      <h3>Learning Style</h3>
      <div className="style-info">
        <h4 className="style-name">{student.learning_style_display}</h4>
        {showDescription && (
          <p className="style-description">
            {student.learning_style_description}
          </p>
        )}
      </div>
    </div>
  );
};

export default LearningStyle;
