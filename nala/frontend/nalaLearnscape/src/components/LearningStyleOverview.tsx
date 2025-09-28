import { useEffect, useState } from "react";
import { PieChart } from '@mui/x-charts/PieChart';
import { Tooltip } from '@mui/material';
import '../theme.ts';
import axios from "axios";

const LearningStyleOverview = () => {
  const [rawData, setRawData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/student/1/`);
        console.log("Full API Response:", response.data); // Debug log
        console.log("learningStyleBreakdown:", response.data.learningStyleBreakdown); // Debug log
        setRawData(response.data.learningStyleBreakdown || {});
      } catch (error) {
        console.error("Failed to fetch learning style", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Colors for each style
  const colors = {
    "Elaboration": "#4C73FF",
    "Concrete Examples": "#7EA8FF", 
    "Interleaving": "#A0C1FF",
    "Dual Coding": "#2D4BB4",
    "Retrieval Practice": "#13338C"
  };

  // Descriptions for each learning style
  const descriptions = {
    "Elaboration": "Connecting new ideas to existing knowledge to deepen understanding.",
    "Concrete Examples": "Grounding concepts with tangible, real-world examples.",
    "Interleaving": "Mixing different topics or skills during study sessions.",
    "Dual Coding": "Pairing visual elements with text to reinforce learning pathways.",
    "Retrieval Practice": "Testing yourself to strengthen recall and expose knowledge gaps."
  };

  // Convert object to array (exclude total_user_messages)
  const data = Object.entries(rawData)
    .filter(([key]) => key !== 'total_user_messages')
    .map(([name, value]) => ({
      label: name,
      value: value,
      color: colors[name] || "#4C73FF"
    }));

  console.log("Raw data:", rawData); // Debug log
  console.log("Processed data:", data); // Debug log

  // Show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Show no data state with more info
  if (data.length === 0) {
    return (
      <div className="p-4 border rounded">
        <p>No learning style data available</p>
        <p>Raw data keys: {Object.keys(rawData).join(', ')}</p>
        <p>Raw data: {JSON.stringify(rawData)}</p>
      </div>
    );
  }

  // Find highest value style
  const currentStyle = data.length > 0 
    ? data.reduce((max, item) => item.value > max.value ? item : max).label
    : "-";

  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <div
      className="rounded-3xl px-6 py-4 md:px-8 md:py-5 w-full"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        border: "2px solid rgba(76,115,255,0.14)",
      }}
    >
      <div className="mb-4">
        <h2 className="text-sm font-bold font-family-body tracking-wider uppercase text-[#4C73FF] mb-1">
          Current Learning Style
        </h2>
        <h1 className="font-bold font-['Fredoka'] text-3xl md:text-3xl text-[#4C73FF]">
          {currentStyle}
        </h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-center">
        <div className="flex-shrink-0">
          <PieChart
            series={[{
                data,
                innerRadius: 40,
                outerRadius: 85,
                paddingAngle: 2,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 37, additionalRadius: -15 },
                valueFormatter: (item) => `${item.value}%`,
            }]}
            width={170}
            height={170}
            slotProps={{
              legend: { hidden: true },
              tooltip: {
                sx: {
                  '& *': {
                    fontFamily: '"GlacialIndifference", sans-serif !important',
                  }
                }
              }
            }}
          />
        </div>
        
        <div className="flex-1 space-y-2 w-full min-w-0">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 bg-[rgba(232,241,255,0.6)]"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-['GlacialIndifference',sans-serif] font-semibold text-base truncate">
                  {item.label}
                </div>
                <div className="text-sm text-gray-600">
                  {Math.round((item.value / total) * 100)}%
                </div>
              </div>
              <Tooltip 
                title={descriptions[item.label] || item.label}
                arrow
                placement="top"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: 'rgba(40,72,209,0.95)',
                      fontSize: '12px',
                      fontFamily: '"GlacialIndifference", sans-serif',
                      maxWidth: '250px',
                      '& .MuiTooltip-arrow': {
                        color: 'rgba(40,72,209,0.95)',
                      },
                      padding: '8px 12px',
                      textAlign: 'center',
                      borderRadius: '8px',
                      marginRight: '8px',
                    }
                  }
                }}
              >
                <div className="flex-shrink-0 w-6 h-6 bg-[#e1e9ff] text-[#1b46d1] rounded-full flex items-center justify-center text-sm font-['Fredoka',sans-serif] font-bold cursor-help">
                  ?
                </div>
              </Tooltip>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningStyleOverview;