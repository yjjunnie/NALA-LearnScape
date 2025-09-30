import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Chip,
  Input,
  Box,
  Divider,
} from "@mui/material";
import QuizIcon from "@mui/icons-material/Quiz";

const bloomLevels = [
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
];

interface Topic {
  id: string;
  name: string;
}

interface QuizCustomizationModalProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: (numQuestions: number, selectedLevels: string[], selectedTopicIds: string[], quizType: string) => void;
  topics: Topic[];
  quizType: "weekly" | "custom";
}

export default function QuizCustomizationModal({
  open,
  onClose,
  onStartQuiz,
  topics,
  quizType,
}: QuizCustomizationModalProps) {
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([
    "Remember",
    "Understand",
  ]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // Auto-select all topics when modal opens
  useEffect(() => {
    if (open && topics.length > 0) {
      setSelectedTopicIds(topics.map(t => t.id));
    }
  }, [open, topics]);

  const handleLevelToggle = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopicIds((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    );
  };

  const handleSelectAllTopics = () => {
    setSelectedTopicIds(topics.map(t => t.id));
  };

  const handleDeselectAllTopics = () => {
    setSelectedTopicIds([]);
  };

  const handleStartQuiz = () => {
    onStartQuiz(numQuestions, selectedLevels, selectedTopicIds, quizType);
  };

  const handleClose = () => {
    // Reset to defaults
    setNumQuestions(10);
    setSelectedLevels(["Remember", "Understand"]);
    setSelectedTopicIds(topics.map(t => t.id));
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <QuizIcon sx={{ color: "#004aad" }} />
          <Box
            component="span"
            sx={{
              fontFamily: "Fredoka",
              fontWeight: "bold",
              fontSize: 24,
              color: "#004aad",
            }}
          >
            {quizType === "weekly" ? "Weekly Review Quiz" : "Customize Your Quiz"}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
          
          {/* Topic Selection */}
          <FormControl fullWidth>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <InputLabel
                shrink
                sx={{
                  fontFamily: "GlacialIndifference",
                  fontSize: 22,
                  fontWeight: "bold",
                  color: "gray",
                  position: "relative",
                  transform: "none",
                }}
              >
                Select Topics to Test
              </InputLabel>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  onClick={handleSelectAllTopics}
                  sx={{ color: "#004aad", fontSize: 12 }}
                >
                  Select All
                </Button>
                <Button
                  size="small"
                  onClick={handleDeselectAllTopics}
                  sx={{ color: "#004aad", fontSize: 12 }}
                >
                  Deselect All
                </Button>
              </Box>
            </Box>

            <FormGroup sx={{ mt: 2, ml: 2, maxHeight: 200, overflowY: "auto" }}>
              {topics.map((topic, index) => (
                <FormControlLabel
                  key={topic.id}
                  control={
                    <Checkbox
                      checked={selectedTopicIds.includes(topic.id)}
                      onChange={() => handleTopicToggle(topic.id)}
                      sx={{
                        color: "#004aad",
                        "&.Mui-checked": { color: "#004aad" },
                      }}
                    />
                  }
                  label={`Week ${index + 1}: ${topic.name}`}
                  sx={{ marginY: -0.5 }}
                  componentsProps={{
                    typography: {
                      sx: { fontFamily: "GlacialIndifference" },
                    },
                  }}
                />
              ))}
            </FormGroup>

            {selectedTopicIds.length > 0 && (
              <Box sx={{ mt: 2, ml: 2, color: "gray", fontSize: 14 }}>
                {selectedTopicIds.length} topic(s) selected
              </Box>
            )}
          </FormControl>

          <Divider />

          {/* Number of Questions - Only show for custom quiz */}
          {quizType === "custom" && (
            <FormControl fullWidth>
              <InputLabel
                shrink
                sx={{
                  fontFamily: "GlacialIndifference",
                  fontSize: 22,
                  fontWeight: "bold",
                  color: "gray",
                }}
              >
                Number of Questions
              </InputLabel>
              <Input
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(Number(e.target.value))}
                inputProps={{ min: 1, max: 30 }}
                sx={{ width: 100, mt: 1, ml: 2, mb: 2 }}
              />
            </FormControl>
          )}

          {/* Question Difficulty - Only show for custom quiz */}
          {quizType === "custom" && (
            <FormControl fullWidth>
              <InputLabel
                shrink
                sx={{
                  fontFamily: "GlacialIndifference",
                  fontSize: 22,
                  fontWeight: "bold",
                  color: "gray",
                }}
              >
                Question Difficulty (Based on Bloom's Taxonomy Levels)
              </InputLabel>

              <FormGroup sx={{ mt: 2, ml: 2 }}>
                {bloomLevels.map((level) => (
                  <FormControlLabel
                    key={level}
                    control={
                      <Checkbox
                        checked={selectedLevels.includes(level)}
                        onChange={() => handleLevelToggle(level)}
                        sx={{
                          color: "#004aad",
                          "&.Mui-checked": { color: "#004aad" },
                        }}
                      />
                    }
                    label={level}
                    sx={{ marginY: -0.5 }}
                    componentsProps={{
                      typography: {
                        sx: { fontFamily: "GlacialIndifference" },
                      },
                    }}
                  />
                ))}
              </FormGroup>

              {selectedLevels.length > 0 && (
                <Box sx={{ mt: 2, ml: 2, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {selectedLevels.map((level) => (
                    <Chip
                      key={level}
                      label={level}
                      size="medium"
                      onDelete={() => handleLevelToggle(level)}
                      sx={{
                        backgroundColor: "#004aad",
                        color: "white",
                        fontFamily: "GlacialIndifference",
                        padding: 2,
                        "& .MuiChip-deleteIcon": { color: "white" },
                      }}
                    />
                  ))}
                </Box>
              )}
            </FormControl>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          sx={{ color: "#004aad", fontFamily: "Fredoka" }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleStartQuiz}
          disabled={
            selectedTopicIds.length === 0 ||
            (quizType === "custom" && selectedLevels.length === 0)
          }
          sx={{
            backgroundColor: "#004aad",
            fontFamily: "Fredoka",
            "&:hover": { backgroundColor: "#003580" },
            "&:disabled": { backgroundColor: "#cddcf7", color: "#888" },
          }}
        >
          Start Quiz
        </Button>
      </DialogActions>
    </Dialog>
  );
}