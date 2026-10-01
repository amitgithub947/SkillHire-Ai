export const INTERVIEW_TYPES = ['Online', 'InPerson', 'Phone'] as const
export type InterviewType = (typeof INTERVIEW_TYPES)[number]

export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled'

export interface Interview {
  id: number
  applicationId: number
  jobId: number
  jobTitle: string
  companyName: string
  candidateName: string
  /** UTC ISO string. */
  interviewDate: string
  type: InterviewType
  meetingLink: string | null
  notes: string | null
  status: InterviewStatus
  /** Candidates only receive this once the interview is completed. */
  feedback: string | null
  createdAt: string
  /** Only in the response to scheduling or cancelling: whether the candidate was emailed. */
  candidateNotified?: boolean
}

export interface ScheduleInterviewInput {
  /** ISO string with offset. */
  interviewDate: string
  type: InterviewType
  meetingLink: string | null
  notes: string | null
}

export interface UpdateInterviewStatusInput {
  status: 'Completed' | 'Cancelled'
  feedback: string | null
}
