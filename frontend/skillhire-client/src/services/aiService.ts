import type { JobMatch, ResumeAnalysis, SkillMatch } from '../types/ai'
import { api } from './api'

/** AI features. All AI calls happen on the server; the browser never sees the API key. */
export const aiService = {
  /** Analyzes the given PDF, or the saved resume when no file is passed. */
  async analyzeResume(file?: File): Promise<ResumeAnalysis> {
    const form = new FormData()
    if (file) form.append('File', file)
    const { data } = await api.post<ResumeAnalysis>('/api/ai/analyze-resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async getLatestAnalysis(): Promise<ResumeAnalysis> {
    const { data } = await api.get<ResumeAnalysis>('/api/ai/resume-analysis')
    return data
  },

  async getSkillMatch(jobId: number): Promise<SkillMatch> {
    const { data } = await api.post<SkillMatch>('/api/ai/skill-match', { jobId })
    return data
  },

  async getJobMatches(count = 4): Promise<JobMatch[]> {
    const { data } = await api.get<JobMatch[]>('/api/ai/job-matches', { params: { count } })
    return data
  },
}
