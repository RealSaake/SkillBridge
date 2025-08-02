import React, { useMemo, useState } from 'react';
import { terminalLogger } from '../../../utils/terminalLogger';

interface ContributionDay {
  date: string;
  count: number;
  level: number;
}

interface ContributionGraphProps {
  data: ContributionDay[];
  width?: number;
  height?: number;
  className?: string;
}

const CELL_SIZE = 12;
const CELL_SPACING = 2;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
  width = 800,
  height = 150,
  className = ''
}) => {
  const [hoveredDay, setHoveredDay] = useState<ContributionDay | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const { weeks, monthLabels, maxCount } = useMemo(() => {
    terminalLogger.debug('ContributionGraph', 'Processing contribution data', {
      dataLength: data.length,
      dateRange: data.length > 0 ? {
        start: data[0]?.date,
        end: data[data.length - 1]?.date
      } : null
    });

    if (!data.length) {
      return { weeks: [], monthLabels: [], maxCount: 0 };
    }

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate max count for color scaling
    const maxCount = Math.max(...sortedData.map(d => d.count));
    
    // Group data into weeks
    const weeks: ContributionDay[][] = [];
    let currentWeek: ContributionDay[] = [];
    let currentWeekStart: Date | null = null;

    sortedData.forEach(day => {
      const date = new Date(day.date);
      const dayOfWeek = date.getDay();

      // Start a new week on Sunday or if it's the first day
      if (dayOfWeek === 0 || currentWeekStart === null) {
        if (currentWeek.length > 0) {
          weeks.push([...currentWeek]);
        }
        currentWeek = [];
        currentWeekStart = date;
      }

      currentWeek.push(day);
    });

    // Add the last week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Generate month labels
    const monthLabels: { month: string; x: number }[] = [];
    let currentMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      if (week.length > 0) {
        const firstDay = new Date(week[0].date);
        const month = firstDay.getMonth();
        
        if (month !== currentMonth) {
          monthLabels.push({
            month: MONTHS[month],
            x: weekIndex * (CELL_SIZE + CELL_SPACING)
          });
          currentMonth = month;
        }
      }
    });

    return { weeks, monthLabels, maxCount };
  }, [data]);

  const getContributionLevel = (count: number): number => {
    if (count === 0) return 0;
    if (maxCount === 0) return 1;
    
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const getContributionColor = (level: number): string => {
    const colors = [
      '#ebedf0', // Level 0 - no contributions
      '#9be9a8', // Level 1 - low
      '#40c463', // Level 2 - medium-low
      '#30a14e', // Level 3 - medium-high
      '#216e39'  // Level 4 - high
    ];
    return colors[level] || colors[0];
  };

  const handleMouseEnter = (day: ContributionDay, event: React.MouseEvent) => {
    setHoveredDay(day);
    setMousePosition({ x: event.clientX, y: event.clientY });
    
    terminalLogger.debug('ContributionGraph', 'Day hovered', {
      date: day.date,
      count: day.count,
      level: day.level
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatContributionText = (count: number): string => {
    if (count === 0) return 'No contributions';
    if (count === 1) return '1 contribution';
    return `${count} contributions`;
  };

  return (
    <div className={`contribution-graph ${className}`}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Contribution Activity</h4>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Less</span>
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getContributionColor(level) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="relative">
        <svg width={width} height={height} className="overflow-visible">
          {/* Month labels */}
          {monthLabels.map((label, index) => (
            <text
              key={index}
              x={label.x}
              y={12}
              className="text-xs fill-gray-500"
              textAnchor="start"
            >
              {label.month}
            </text>
          ))}

          {/* Day labels */}
          {DAYS.map((day, index) => (
            <text
              key={day}
              x={-8}
              y={30 + (index * (CELL_SIZE + CELL_SPACING)) + CELL_SIZE / 2}
              className="text-xs fill-gray-500"
              textAnchor="end"
              dominantBaseline="middle"
            >
              {index % 2 === 1 ? day : ''}
            </text>
          ))}

          {/* Contribution cells */}
          <g transform="translate(0, 20)">
            {weeks.map((week, weekIndex) => (
              <g key={weekIndex} transform={`translate(${weekIndex * (CELL_SIZE + CELL_SPACING)}, 0)`}>
                {week.map((day, dayIndex) => {
                  const date = new Date(day.date);
                  const dayOfWeek = date.getDay();
                  const level = getContributionLevel(day.count);
                  
                  return (
                    <rect
                      key={day.date}
                      x={0}
                      y={dayOfWeek * (CELL_SIZE + CELL_SPACING)}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={2}
                      fill={getContributionColor(level)}
                      stroke="rgba(27, 31, 35, 0.06)"
                      strokeWidth={1}
                      className="cursor-pointer transition-all duration-200 hover:stroke-gray-400"
                      onMouseEnter={(e) => handleMouseEnter(day, e)}
                      onMouseLeave={handleMouseLeave}
                    />
                  );
                })}
              </g>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredDay && (
          <div
            className="fixed z-50 bg-gray-900 text-white text-xs rounded px-2 py-1 pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 30,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-medium">{formatContributionText(hoveredDay.count)}</div>
            <div className="text-gray-300">{formatDate(hoveredDay.date)}</div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="mt-4 flex justify-between text-xs text-gray-600">
        <span>
          Total: {data.reduce((sum, day) => sum + day.count, 0)} contributions
        </span>
        <span>
          Streak: {calculateCurrentStreak(data)} days
        </span>
      </div>
    </div>
  );
};

function calculateCurrentStreak(data: ContributionDay[]): number {
  if (!data.length) return 0;

  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  
  for (const day of sortedData) {
    if (day.count > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}