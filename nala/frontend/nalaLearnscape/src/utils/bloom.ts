const TAXONOMY_LEVELS = {
    Remember: 1,
    Understand: 2,
    Apply: 3,
    Analyze: 4,
    Evaluate: 5,
    Create: 6,
  };
  
  const TAXONOMY_DESCRIPTIONS = {
    1: "Recall facts and basic concepts",
    2: "Explain ideas or concepts",
    3: "Use information in new situations",
    4: "Draw connections among ideas",
    5: "Justify a stand or decision",
    6: "Produce new or original work",
  };

// Returns overall taxonomy info and a filled-dot array for display
export const calculateOverallBloomLevel = (bloomSummary: Record<string, Record<string, number>>) => {
    const topicMaxLevels: number[] = [];
  
    for (const topicId in bloomSummary) {
      const topicData = bloomSummary[topicId];
  
      // Pick the level with the highest count
      let maxLevelName = "Remember";
      let maxCount = -1;
  
      for (const [levelName, count] of Object.entries(topicData)) {
        if (count > maxCount) {
          maxCount = count;
          maxLevelName = levelName;
        }
      }
  
      // Map level name to numeric value
      const levelNum = TAXONOMY_LEVELS[maxLevelName as keyof typeof TAXONOMY_LEVELS];
      topicMaxLevels.push(levelNum);
    }
  
    if (topicMaxLevels.length === 0) {
      return {
        level: "N/A",
        description: "No Bloom data available",
        dots: [],
      };
    }
  
    // Average across topics and round
    const avgLevelNum = Math.round(topicMaxLevels.reduce((sum, l) => sum + l, 0) / topicMaxLevels.length);
  
    // Map back to taxonomy name
    const levelName =
      Object.keys(TAXONOMY_LEVELS).find((k) => TAXONOMY_LEVELS[k as keyof typeof TAXONOMY_LEVELS] === avgLevelNum) ||
      "Remember";
  
    // Create dots array
    const totalLevels = Object.keys(TAXONOMY_LEVELS).length;
    const dots = Array.from({ length: totalLevels }, (_, i) => i < avgLevelNum);
  
    return {
      level: levelName,
      description: TAXONOMY_DESCRIPTIONS[avgLevelNum as keyof typeof TAXONOMY_DESCRIPTIONS],
      dots,
    };
  };
  