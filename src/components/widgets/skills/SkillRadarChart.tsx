import React, { useMemo, useState, useRef } from 'react';
import { terminalLogger } from '../../../utils/terminalLogger';

interface SkillData {
  category: string;
  current: number;
  target: number;
  importance: number;
  trending: 'up' | 'down' | 'stable';
  subSkills?: Array<{
    name: string;
    level: number;
    experience: string;
  }>;
}

interface SkillRadarChartProps {
  data: SkillData[];
  width?: number;
  height?: number;
  className?: string;
  showTargetLayer?: boolean;
  showSubSkills?: boolean;
  onSkillClick?: (skill: SkillData) => void;
}

const RADAR_COLORS = {
  current: '#3b82f6',
  target: '#10b981',
  grid: '#e5e7eb',
  text: '#6b7280',
  highlight: '#f59e0b'
};

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  data,
  width = 400,
  height = 400,
  className = '',
  showTargetLayer = true,
  showSubSkills = false,
  onSkillClick
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const { center, radius, angleStep, skillPositions } = useMemo(() => {
    const center = { x: width / 2, y: height / 2 };
    const radius = Math.min(width, height) / 2 - 60; // Leave space for labels
    const angleStep = (2 * Math.PI) / data.length;
    
    const skillPositions = data.map((skill, index) => {
      const angle = (index * angleStep) - (Math.PI / 2); // Start from top
      return {
        ...skill,
        angle,
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      };
    });

    terminalLogger.debug('SkillRadarChart', 'Chart dimensions calculated', {
      center,
      radius,
      skillCount: data.length,
      angleStep: angleStep * (180 / Math.PI) // Convert to degrees for logging
    });

    return { center, radius, angleStep, skillPositions };
  }, [data, width, height]);

  const generateRadarPath = (values: number[], maxValue: number = 10): string => {
    if (values.length === 0) return '';

    const points = values.map((value, index) => {
      const angle = (index * angleStep) - (Math.PI / 2);
      const distance = (value / maxValue) * radius;
      const x = center.x + Math.cos(angle) * distance;
      const y = center.y + Math.sin(angle) * distance;
      return `${x},${y}`;
    });

    return `M${points.join('L')}Z`;
  };

  const handleSkillHover = (skillCategory: string | null) => {
    setHoveredSkill(skillCategory);
    if (skillCategory) {
      terminalLogger.debug('SkillRadarChart', 'Skill hovered', {
        category: skillCategory,
        skill: data.find(s => s.category === skillCategory)
      });
    }
  };

  const handleSkillClick = (skill: SkillData) => {
    setSelectedSkill(skill.category === selectedSkill ? null : skill.category);
    if (onSkillClick) {
      onSkillClick(skill);
    }
    
    terminalLogger.info('SkillRadarChart', 'Skill clicked', {
      category: skill.category,
      current: skill.current,
      target: skill.target,
      isSelected: skill.category !== selectedSkill
    });
  };

  const getSkillGapColor = (current: number, target: number): string => {
    const gap = target - current;
    if (gap <= 1) return '#10b981'; // Green - small gap
    if (gap <= 3) return '#f59e0b'; // Yellow - medium gap
    return '#ef4444'; // Red - large gap
  };

  const getTrendingIcon = (trending: string): string => {
    switch (trending) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '→';
      default: return '';
    }
  };

  return (
    <div className={`skill-radar-chart ${className}`}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Skill Assessment</h4>
        <div className="text-xs text-gray-500">
          Current vs Target skill levels • {data.length} categories
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Radar Chart */}
        <div className="flex-1">
          <svg
            ref={svgRef}
            width={width}
            height={height}
            className="overflow-visible"
          >
            {/* Grid circles */}
            {[2, 4, 6, 8, 10].map(level => (
              <circle
                key={level}
                cx={center.x}
                cy={center.y}
                r={(level / 10) * radius}
                fill="none"
                stroke={RADAR_COLORS.grid}
                strokeWidth={1}
                opacity={0.5}
              />
            ))}

            {/* Grid lines */}
            {skillPositions.map((skill, index) => (
              <line
                key={`grid-${index}`}
                x1={center.x}
                y1={center.y}
                x2={skill.x}
                y2={skill.y}
                stroke={RADAR_COLORS.grid}
                strokeWidth={1}
                opacity={0.5}
              />
            ))}

            {/* Level labels */}
            {[2, 4, 6, 8, 10].map(level => (
              <text
                key={`level-${level}`}
                x={center.x + 5}
                y={center.y - (level / 10) * radius}
                className="text-xs fill-gray-400"
                textAnchor="start"
                dominantBaseline="middle"
              >
                {level}
              </text>
            ))}

            {/* Target skill area (if enabled) */}
            {showTargetLayer && (
              <path
                d={generateRadarPath(data.map(s => s.target))}
                fill={RADAR_COLORS.target}
                fillOpacity={0.1}
                stroke={RADAR_COLORS.target}
                strokeWidth={2}
                strokeDasharray="5,5"
              />
            )}

            {/* Current skill area */}
            <path
              d={generateRadarPath(data.map(s => s.current))}
              fill={RADAR_COLORS.current}
              fillOpacity={0.2}
              stroke={RADAR_COLORS.current}
              strokeWidth={3}
            />

            {/* Skill points and labels */}
            {skillPositions.map((skill, index) => {
              const isHovered = hoveredSkill === skill.category;
              const isSelected = selectedSkill === skill.category;
              const currentDistance = (skill.current / 10) * radius;
              const targetDistance = (skill.target / 10) * radius;
              
              const currentX = center.x + Math.cos(skill.angle) * currentDistance;
              const currentY = center.y + Math.sin(skill.angle) * currentDistance;
              const targetX = center.x + Math.cos(skill.angle) * targetDistance;
              const targetY = center.y + Math.sin(skill.angle) * targetDistance;

              return (
                <g key={skill.category}>
                  {/* Target point */}
                  {showTargetLayer && (
                    <circle
                      cx={targetX}
                      cy={targetY}
                      r={4}
                      fill={RADAR_COLORS.target}
                      stroke="white"
                      strokeWidth={2}
                      opacity={0.8}
                    />
                  )}

                  {/* Current point */}
                  <circle
                    cx={currentX}
                    cy={currentY}
                    r={isHovered || isSelected ? 8 : 6}
                    fill={isSelected ? RADAR_COLORS.highlight : RADAR_COLORS.current}
                    stroke="white"
                    strokeWidth={2}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => handleSkillHover(skill.category)}
                    onMouseLeave={() => handleSkillHover(null)}
                    onClick={() => handleSkillClick(skill)}
                  />

                  {/* Skill label */}
                  <text
                    x={skill.x + (Math.cos(skill.angle) * 20)}
                    y={skill.y + (Math.sin(skill.angle) * 20)}
                    className={`text-xs cursor-pointer transition-all duration-200 ${
                      isHovered || isSelected ? 'fill-gray-900 font-medium' : 'fill-gray-600'
                    }`}
                    textAnchor={skill.angle > Math.PI / 2 && skill.angle < 3 * Math.PI / 2 ? 'end' : 'start'}
                    dominantBaseline="middle"
                    onMouseEnter={() => handleSkillHover(skill.category)}
                    onMouseLeave={() => handleSkillHover(null)}
                    onClick={() => handleSkillClick(skill)}
                  >
                    {skill.category} {getTrendingIcon(skill.trending)}
                  </text>

                  {/* Gap indicator line */}
                  {showTargetLayer && skill.target > skill.current && (
                    <line
                      x1={currentX}
                      y1={currentY}
                      x2={targetX}
                      y2={targetY}
                      stroke={getSkillGapColor(skill.current, skill.target)}
                      strokeWidth={2}
                      strokeDasharray="3,3"
                      opacity={0.7}
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Skill Details Panel */}
        <div className="flex-1 min-w-0">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data.map((skill) => {
              const isSelected = selectedSkill === skill.category;
              const gap = skill.target - skill.current;
              
              return (
                <div
                  key={skill.category}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSkillClick(skill)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {skill.category}
                      </span>
                      <span className="text-sm">
                        {getTrendingIcon(skill.trending)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      Gap: {gap.toFixed(1)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Current level bar */}
                    <div>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Current</span>
                        <span>{skill.current}/10</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(skill.current / 10) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Target level bar */}
                    {showTargetLayer && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Target</span>
                          <span>{skill.target}/10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(skill.target / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Importance indicator */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Importance:</span>
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map(level => (
                          <div
                            key={level}
                            className={`w-2 h-2 rounded-full ${
                              level <= skill.importance ? 'bg-yellow-400' : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sub-skills (if selected and available) */}
                  {isSelected && showSubSkills && skill.subSkills && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        Sub-skills:
                      </div>
                      <div className="space-y-1">
                        {skill.subSkills.map((subSkill, index) => (
                          <div key={index} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{subSkill.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">{subSkill.level}/10</span>
                              <span className="text-gray-400">({subSkill.experience})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Legend:</div>
            <div className="space-y-1 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Current Level</span>
              </div>
              {showTargetLayer && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Target Level</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div className="w-3 h-1 bg-red-400 rounded"></div>
                <span>Large Gap (3+)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};