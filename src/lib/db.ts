import prisma from './prisma';

export type TaxRegime = 'old' | 'new';

export type Employee = {
  id: string; name: string; email: string; role: string; location: string;
  salary: number; avatarUrl?: string; pan?: string; aadhar?: string;
  uan?: string; taxRegime?: TaxRegime; state?: string;
};

export type Activity = { id: string; employeeId: string; action: string; status: 'Done' | 'Pending' | 'Alert'; time: string };

export type CandidateScore = {
  technical: number; culture: number; communication: number; leadership: number; adaptability: number;
};

export type AcademicQuestion = {
  id: string; question: string; type: 'mcq' | 'text'; options?: string[]; correctAnswer: string;
};

export type AcademicSubmission = {
  questionId: string; answer: string; isCorrect?: boolean; score?: number;
};

export type AcademicAssessment = {
  id: string; questions: AcademicQuestion[]; submissions: AcademicSubmission[];
  totalScore: number; completedAt?: string;
};

export type Candidate = {
  id: string; name: string; role: string;
  status: 'Applied' | 'Screened' | 'Interview' | 'Offer' | 'Rejected';
  score: CandidateScore; matchPercent: number; matchTags: string[];
  phone?: string; education?: string; institute?: string;
  aiInterviewScore?: number; academiaScore?: number; salaryExpectation?: number;
  source?: string; gender?: string;
  interviewLogs?: InterviewLog[];
  assessments?: CandidateAssessment[];
  academicAssessment?: AcademicAssessment;
  recruiterRating?: number;
  recruiterFeedback?: string;
  aiSummary?: string;
};

export type JobDescription = {
  id: string; title: string; department: string | null; salaryBudget: number | null;
  mustHave: string[]; niceToHave: string[]; 
  softSkills: string[]; futureProof: string[];
  createdAt: Date; active: boolean;
};

export type CandidateAssessment = {
  id: string; candidateId: string; question: string; answer: string;
  sentiment: 'positive' | 'neutral' | 'negative'; technicalScore: number; timestamp: string;
};

export type InterviewLog = {
  id: string; candidateId: string; scheduledAt: string; istTime: string;
  method: 'video' | 'phone' | 'in-person'; status: 'scheduled' | 'completed' | 'cancelled';
  notificationSent: boolean;
};

export type PayrollRecord = {
  id: string; employeeId: string; month: string;
  basic: number; hra: number; specialAllowance: number;
  gross: number; epf: number; pt: number; tds: number; net: number;
};

export type TaxDeclaration = {
  id: string; employeeId: string; section80C: number; section80D: number; hraRent: number;
};

export type Settings = {
  gstin: string; tan: string; companyName: string; defaultState: string;
  academiaPromotionThreshold: number;
};

export type DBSchema = {
  employees: Employee[]; activities: Activity[]; candidates: Candidate[];
  jobDescriptions: JobDescription[]; payroll: PayrollRecord[];
  taxDeclarations: TaxDeclaration[]; settings: Settings;
};

const defaultData: DBSchema = {
  employees: [], activities: [], candidates: [], jobDescriptions: [],
  payroll: [], taxDeclarations: [],
  settings: { gstin: '', tan: '', companyName: 'NexusHR Global', defaultState: 'Maharashtra', academiaPromotionThreshold: 200 }
};

export async function getDb(): Promise<DBSchema> {
  try {
    const [employees, activities, candidates, jobDescriptions, payroll, taxDeclarations, config] = await Promise.all([
      prisma.employee.findMany(),
      prisma.activity.findMany(),
      prisma.candidate.findMany(),
      prisma.jobDescription.findMany(),
      prisma.payrollRecord.findMany(),
      prisma.taxDeclaration.findMany(),
      prisma.globalConfig.findMany(),
    ]);

    const settings: Settings = {
      gstin: config.find((c: { key: string; value: string }) => c.key === 'gstin')?.value || '',
      tan: config.find((c: { key: string; value: string }) => c.key === 'tan')?.value || '',
      companyName: config.find((c: { key: string; value: string }) => c.key === 'companyName')?.value || 'NexusHR Global',
      defaultState: config.find((c: { key: string; value: string }) => c.key === 'defaultState')?.value || 'Maharashtra',
      academiaPromotionThreshold: Number(config.find((c: { key: string; value: string }) => c.key === 'academiaPromotionThreshold')?.value) || 200,
    };

    return {
      employees: employees.map((e: any) => ({ ...e, taxRegime: e.taxRegime as TaxRegime })) as Employee[],
      activities: activities as unknown as Activity[],
      candidates: candidates.map((c: any) => ({
        ...c,
        score: c.score as unknown as CandidateScore,
        academicAssessment: c.academicAssessment as unknown as AcademicAssessment,
        status: c.status as any,
      })) as Candidate[],
      jobDescriptions: jobDescriptions as unknown as JobDescription[],
      payroll: payroll as unknown as PayrollRecord[],
      taxDeclarations: taxDeclarations as unknown as TaxDeclaration[],
      settings,
    };
  } catch (error) {
    console.error("Database fetch failed, falling back to default:", error);
    return defaultData;
  }
}

export async function saveDb(data: DBSchema) {
  // Bridge implementation: update high-priority entities (Settings, Candidates)
  // Granular Prisma calls should be used for production performance.
  
  try {
    // 1. Settings (GlobalConfig)
    if (data.settings) {
      await Promise.all(Object.entries(data.settings).map(([key, value]) => 
        prisma.globalConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) }
        })
      ));
    }

    // 2. Job Descriptions (Upsert)
    if (data.jobDescriptions) {
      await Promise.all(data.jobDescriptions.map(jd => 
        prisma.jobDescription.upsert({
          where: { id: jd.id },
          update: {
            title: jd.title,
            department: jd.department,
            salaryBudget: jd.salaryBudget,
            mustHave: jd.mustHave,
            niceToHave: jd.niceToHave,
            softSkills: jd.softSkills,
            futureProof: jd.futureProof,
            active: jd.active,
          },
          create: {
            id: jd.id,
            title: jd.title,
            department: jd.department,
            salaryBudget: jd.salaryBudget,
            mustHave: jd.mustHave,
            niceToHave: jd.niceToHave,
            softSkills: jd.softSkills,
            futureProof: jd.futureProof,
            active: jd.active,
            createdAt: jd.createdAt,
          }
        })
      ));
    }

    // 3. Candidates (Update match scores)
    if (data.candidates) {
      // For performance, we only update critical match metadata
      await Promise.all(data.candidates.map(candidate => 
        prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            role: candidate.role || 'Applicant',
            status: candidate.status || 'Applied',
            matchPercent: Math.round(candidate.matchPercent || 0),
            matchTags: candidate.matchTags || [],
            phone: candidate.phone || '',
            education: candidate.education || '',
            institute: candidate.institute || '',
            academiaScore: Math.round(candidate.academiaScore || 0),
            aiInterviewScore: candidate.aiInterviewScore || 0,
          }
        })
      ));
    }
    
  } catch (error) {
    console.error("Database save failed:", error);
  }
}

/**
 * Shared Scoring Logic for Recruitment
 */
export function calculateMatchScore(
  candidateSkills: string[],
  jd: JobDescription,
  allCandidatesSkills: string[][] = []
) {
  const lowerCandidate = candidateSkills.map(s => s.toLowerCase());
  
  const matchedMust = jd.mustHave.filter(m => 
    lowerCandidate.some(s => s.includes(m.toLowerCase()) || m.toLowerCase().includes(s))
  );
  const missingMust = jd.mustHave.filter(m => !matchedMust.includes(m));
  
  const matchedNice = (jd.niceToHave || []).filter(m => 
    lowerCandidate.some(s => s.includes(m.toLowerCase()) || m.toLowerCase().includes(s))
  );
  
  const matchedFuture = (jd.futureProof || []).filter(m => 
    lowerCandidate.some(s => s.includes(m.toLowerCase()) || m.toLowerCase().includes(s))
  );

  const mustScore = jd.mustHave.length > 0 ? (matchedMust.length / jd.mustHave.length) * 50 : 50;
  const niceScore = (jd.niceToHave && jd.niceToHave.length > 0) ? (matchedNice.length / jd.niceToHave.length) * 25 : 25;
  const futureScore = (jd.futureProof && jd.futureProof.length > 0) ? (matchedFuture.length / jd.futureProof.length) * 25 : 25;

  let totalScore = Math.round(mustScore + niceScore + futureScore);

  if (missingMust.length > 0 && jd.mustHave.length > 0) {
    totalScore = Math.min(totalScore, 50);
  }

  if (allCandidatesSkills.length > 0 && matchedMust.length > 0) {
    const hasUniqueSkill = matchedMust.some(skill => {
      const skillLower = skill.toLowerCase();
      const othersHaveIt = allCandidatesSkills.some(otherSkills => {
        if (otherSkills === candidateSkills) return false;
        return otherSkills.some(s => s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase()));
      });
      return !othersHaveIt;
    });
    
    if (hasUniqueSkill) {
      totalScore = Math.min(100, totalScore + 5);
    }
  }

  return {
    score: totalScore,
    matchedMust,
    missingMust,
    matchedNice,
    matchedFuture,
    matchRank: totalScore >= 80 ? 'Strong' : totalScore >= 50 ? 'Partial' : 'Weak'
  };
}
