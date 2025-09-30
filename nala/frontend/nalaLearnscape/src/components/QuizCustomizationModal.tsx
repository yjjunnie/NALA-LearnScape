import { useState } from "react";
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

interface QuizCustomizationModalProps {
  open: boolean;
  onClose: () => void;
  onStartQuiz: (numQuestions: number, selectedLevels: string[]) => void;
}

export default function QuizCustomizationModal({
  open,
  onClose,
  onStartQuiz,
}: QuizCustomizationModalProps) {
  const [numQuestions, setNumQuestions] = useState(10);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([
    "Remember",
    "Understand",
  ]);

  const handleLevelToggle = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  const handleStartQuiz = () => {
    onStartQuiz(numQuestions, selectedLevels);
  };

  const handleClose = () => {
    // Reset to defaults when closing
    setNumQuestions(10);
    setSelectedLevels(["Remember", "Understand"]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      {/* Dialog Header */}
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
            Customize Your Quiz
          </Box>
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 2 }}>
          
          {/* Number of Questions */}
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

          {/* Question Difficulty */}
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

            {/* Selected Levels Chips */}
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
        </Box>
      </DialogContent>

      {/* Dialog Actions */}
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
          disabled={selectedLevels.length === 0}
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
