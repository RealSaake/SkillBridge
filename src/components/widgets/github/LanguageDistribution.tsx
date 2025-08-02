import React, { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { terminalLogger } from '../../../utils/terminalLogger';

interface LanguageData {
  name: string;
  value: number;
  color: string;
  bytes: number;
  percentage: number;
  skillLevel?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  trending?: 'up' | 'down' | 'stable';
}

interface LanguageDistributionProps {
  data: LanguageData[];
  width?: number;
  height?: number;
  className?: string;
  showSkillLevels?: boolean;
  showTrending?: boolean;
}

const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#2b7489',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  'C#': '#239120',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Go: '#00ADD8',
  Rust: '#dea584',
  Swift: '#ffac45',
  Kotlin: '#F18E33',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#1572B6',
  Shell: '#89e051',
  Other: '#8e8e93'
};

export const LanguageDistribution: React.FC<LanguageDistributionProps> = ({
  data,
  width = 400,
  height = 300,
  className = '',
  showSkillLevels = true,
  showTrending = true
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Set<string>>(new Set());

  const processedData = useMemo(() => {
    terminalLogger.debug('LanguageDistribution', 'Processing language data', {
      dataLength: data.length,
      totalBytes: data.reduce((sum, lang) => sum + lang.bytes, 0)
    });

    // Sort by percentage and take top languages
    const sortedData = [...data]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8); // Show top 8 languages

    // Group smaller languages into "Other"
    const otherLanguages = data.slice(8);
    if (otherLanguages.length > 0) {
      const otherTotal = otherLanguages.reduce((sum, lang) => sum + lang.bytes, 0);
      const otherPercentage = otherLanguages.reduce((sum, lang) => sum + lang.percentage, 0);
      
      sortedData.push({
        name: 'Other',
        value: otherTotal,
        color: LANGUAGE_COLORS.Other,
        bytes: otherTotal,
        percentage: otherPercentage
      });
    }

    return sortedData.map(lang => ({
      ...lang,
      color: lang.color || LANGUAGE_COLORS[lang.name] || LANGUAGE_COLORS.Other
    }));
  }, [data]);

  const handlePieEnter = (_: any, index: number) => {
    setActiveIndex(index);
    terminalLogger.debug('LanguageDistribution', 'Language segment hovered', {
      language: processedData[index]?.name,
      percentage: processedData[index]?.percentage
    });
  };

  const handlePieLeave = () => {
    setActiveIndex(null);
  };

  const toggleLanguageFilter = (languageName: string) => {
    const newSelected = new Set(selectedLanguages);
    if (newSelected.has(languageName)) {
      newSelected.delete(languageName);
    } else {
      newSelected.add(languageName);
    }
    setSelectedLanguages(newSelected);
    
    terminalLogger.info('LanguageDistribution', 'Language filter toggled', {
      language: languageName,
      isSelected: newSelected.has(languageName),
      totalSelected: newSelected.size
    });
  };

  const getSkillLevelColor = (level?: string): string => {
    switch (level) {
      case 'Expert': return 'text-green-600 bg-green-100';
      case 'Advanced': return 'text-blue-600 bg-blue-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Beginner': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getTrendingIcon = (trending?: string): string => {
    switch (trending) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <div className="font-medium text-gray-900">{data.name}</div>
          <div className="text-sm text-gray-600">
            {data.percentage.toFixed(1)}% ({(data.bytes / 1024).toFixed(1)} KB)
          </div>
          {showSkillLevels && data.skillLevel && (
            <div className={`text-xs px-2 py-1 rounded mt-1 ${getSkillLevelColor(data.skillLevel)}`}>
              {data.skillLevel}
            </div>
          )}
          {showTrending && data.trending && (
            <div className="text-xs text-gray-500 mt-1">
              {getTrendingIcon(data.trending)} Trending {data.trending}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const filteredData = selectedLanguages.size > 0 
    ? processedData.filter(lang => selectedLanguages.has(lang.name))
    : processedData;

  return (
    <div className={`language-distribution ${className}`}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Language Distribution</h4>
        <div className="text-xs text-gray-500">
          Based on repository analysis • {processedData.length} languages detected
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Pie Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="percentage"
                onMouseEnter={handlePieEnter}
                onMouseLeave={handlePieLeave}
              >
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke={activeIndex === index ? '#374151' : 'none'}
                    strokeWidth={activeIndex === index ? 2 : 0}
                    style={{
                      filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Language List */}
        <div className="flex-1 min-w-0">
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {processedData.map((lang, index) => (
              <div
                key={lang.name}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedLanguages.has(lang.name) 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleLanguageFilter(lang.name)}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: lang.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {lang.name}
                      </span>
                      {showTrending && lang.trending && (
                        <span className="text-xs">
                          {getTrendingIcon(lang.trending)}
                        </span>
                      )}
                    </div>
                    {showSkillLevels && lang.skillLevel && (
                      <div className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${getSkillLevelColor(lang.skillLevel)}`}>
                        {lang.skillLevel}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">
                    {lang.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500">
                    {(lang.bytes / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedLanguages.size > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => setSelectedLanguages(new Set())}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Clear filters ({selectedLanguages.size} selected)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {processedData.length}
            </div>
            <div className="text-xs text-gray-500">Languages</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {processedData.filter(l => l.skillLevel === 'Expert' || l.skillLevel === 'Advanced').length}
            </div>
            <div className="text-xs text-gray-500">Proficient</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {processedData.filter(l => l.trending === 'up').length}
            </div>
            <div className="text-xs text-gray-500">Trending Up</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {((processedData.reduce((sum, l) => sum + l.bytes, 0)) / 1024 / 1024).toFixed(1)}M
            </div>
            <div className="text-xs text-gray-500">Total Code</div>
          </div>
        </div>
      </div>
    </div>
  );
};