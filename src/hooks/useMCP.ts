// Re-export MCP hooks for backward compatibility
export { 
  usePersonalizedMCP,
  usePersonalizedGitHubAnalysis,
  usePersonalizedSkillGapAnalysis,
  usePersonalizedLearningRoadmap,
  usePersonalizedResumeAnalysis as useResumeAnalysis,
  clearMCPCache
} from './usePersonalizedMCP';