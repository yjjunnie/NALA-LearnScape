import { useEffect, useState } from "react";
import { PieChart } from '@mui/x-charts/PieChart';
import { Tooltip } from '@mui/material';
import '../theme.ts';
import axios from "axios";

const LearningStyleOverview = () => {
  const [rawData, setRawData] = useState({});
  const [primaryStyle, setPrimaryStyle] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/student/1/`);
        setPrimaryStyle(response.data.learning_style_display || "");
        setRawData(response.data.learningStyleBreakdown || {});
      } catch (error) {
        console.error("Failed to fetch learning style", error);
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

  // Convert object to array (exclude total_user_messages)
  const data = Object.entries(rawData)
    .filter(([key]) => key !== 'total_user_messages')
    .map(([name, value]) => ({
      label: name,
      value: value,
      color: colors[name] || "#4C73FF"
    }));

  // Find highest value style

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
          {primaryStyle}
        </h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-center">
        <div className="flex-shrink-0">
          <PieChart
            series={[{
              data: data,
              innerRadius: 40,
              outerRadius: 85,
              paddingAngle: 2,
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
              <Tooltip title={item.label}>
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