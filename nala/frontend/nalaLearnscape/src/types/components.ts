export interface LearningStyleProps {
  studentId: number;
  showDescription?: boolean;
  onStyleLoad?: (style: string, description: string) => void;
}
