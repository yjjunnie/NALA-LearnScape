import { useEffect, useState } from "react";
import { PieChart } from '@mui/x-charts/PieChart';
import { Tooltip } from '@mui/material';
import '../theme.ts';

const fetchLearningStyle = async () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        currentStyle: "Elaboration",
        slices: [
          {
            id: "elaboration",
            label: "Elaboration",
            value: 45,
            color: "#4C73FF",
            description: "Connecting new ideas to existing knowledge to deepen understanding.",
          },
          {
            id: "concrete",
            label: "Concrete Examples",
            value: 10,
            color: "#7EA8FF",
            description: "Grounding concepts with tangible, real-world examples.",
          },
          {
            id: "spaced",
            label: "Spaced Practice",
            value: 10,
            color: "#A0C1FF",
            description: "Breaking study time into multiple sessions to support long-term retention.",
          },
          {
            id: "dual",
            label: "Dual Coding",
            value: 15,
            color: "#2D4BB4",
            description: "Pairing visual elements with text to reinforce learning pathways.",
          },
          {
            id: "retrieval",
            label: "Retrieval Practice",
            value: 20,
            color: "#13338C",
            description: "Testing yourself to strengthen recall and expose knowledge gaps.",
          },
        ],
      });
    }, 400);
  });
};

const LearningStyleOverview = () => {
  const [data, setData] = useState([]);
  const [currentStyle, setCurrentStyle] = useState("-");

  useEffect(() => {
    fetchLearningStyle().then((response) => {
      setData(response.slices);
      setCurrentStyle(response.currentStyle);
    });
  }, []);

  const total = data.reduce((sum, slice) => sum + slice.value, 0) || 1;

  // Transform data for MUI PieChart
  const pieData = data.map((slice) => ({
    id: slice.id,
    value: slice.value,
    label: slice.label,
    color: slice.color,
  }));

  return (
    <div
      className="rounded-3xl px-6 py-4 md:px-8 md:py-5 w-full"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f3f6ff 100%)",
        border: "2px solid rgba(76,115,255,0.14)",
      }}
    >
      <div className="mb-4">
        <subtitle1 className="text-sm font-bold font-family-body tracking-wider uppercase text-[#4C73FF] mb-1">
          Current Learning Style
        </subtitle1>
        <h1 className="font-bold text-3xl md:text-3xl text-[#4C73FF]">
          {currentStyle}
        </h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-center">
        <div className="flex-shrink-0">
          <PieChart
            series={[
              {
                data: pieData,
                innerRadius: 40,
                outerRadius: 85,
                paddingAngle: 2,
                highlightScope: { fade: 'global', highlight: 'item' },
                faded: { innerRadius: 37, additionalRadius: -15 },
                valueFormatter: (item: {value: number}) => `${item.value}%`,
              },
            ]}
            width={170}
            height={170}
            slotProps={{
              legend: { hidden: true },
              tooltip: {
                sx: {
                  fontFamily: 'Times-New-Roman'
                }
              }
            }}
          />
        </div>
        
        <div className="flex-1 space-y-2 w-full min-w-0">
          {data.map((slice) => (
            <div
              key={slice.id}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 bg-[rgba(232,241,255,0.6)]"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="font-['GlacialIndifference',sans-serif] font-semibold text-base truncate">
                  {slice.label}
                </div>
                <div className="text-sm text-gray-600">
                  {Math.round((slice.value / total) * 100)}%
                </div>
              </div>
              <Tooltip 
                title={slice.description}
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