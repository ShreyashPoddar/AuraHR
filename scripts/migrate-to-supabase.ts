import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const DB_PATH = path.join(process.cwd(), 'dev-db.json');

async function migrate() {
  try {
    const data = JSON.parse(await fs.readFile(DB_PATH, 'utf-8'));
    console.log('--- Starting Migration ---');

    // 1. Job Descriptions
    console.log(`Migrating ${data.jobDescriptions?.length || 0} Job Descriptions...`);
    for (const jd of (data.jobDescriptions || [])) {
      await prisma.jobDescription.upsert({
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
          createdAt: new Date(jd.createdAt),
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
          createdAt: new Date(jd.createdAt),
        }
      });
    }

    // 2. Employees
    console.log(`Migrating ${data.employees?.length || 0} Employees...`);
    for (const emp of (data.employees || [])) {
      await prisma.employee.upsert({
        where: { id: emp.id },
        update: {
          name: emp.name,
          email: emp.email,
          role: emp.role,
          location: emp.location,
          salary: emp.salary,
          avatarUrl: emp.avatarUrl,
          pan: emp.pan,
          aadhar: emp.aadhar,
          uan: emp.uan,
          taxRegime: emp.taxRegime,
          state: emp.state,
        },
        create: {
          id: emp.id,
          name: emp.name,
          email: emp.email,
          role: emp.role,
          location: emp.location,
          salary: emp.salary,
          avatarUrl: emp.avatarUrl,
          pan: emp.pan,
          aadhar: emp.aadhar,
          uan: emp.uan,
          taxRegime: emp.taxRegime,
          state: emp.state,
        }
      });
    }

    // 3. Candidates
    console.log(`Migrating ${data.candidates?.length || 0} Candidates...`);
    for (const c of (data.candidates || [])) {
      await prisma.candidate.upsert({
        where: { id: c.id },
        update: {
          name: c.name,
          email: c.email,
          skills: c.skills || [],
          experience: c.experience,
          education: c.education,
          location: c.location,
          resumeUrl: c.resumeUrl,
          matchPercent: c.matchPercent,
          matchTags: c.matchTags,
          status: c.status,
          phone: c.phone,
          institute: c.institute,
          score: c.score,
          aiInterviewScore: c.aiInterviewScore,
          academiaScore: c.academiaScore,
          salaryExpectation: c.salaryExpectation,
          source: c.source,
          gender: c.gender,
          academicAssessment: c.academicAssessment,
          recruiterRating: c.recruiterRating,
          recruiterFeedback: c.recruiterFeedback,
          aiSummary: c.aiSummary,
          jdId: c.jdId,
        },
        create: {
          id: c.id,
          name: c.name,
          email: c.email,
          skills: c.skills || [],
          experience: c.experience,
          education: c.education,
          location: c.location,
          resumeUrl: c.resumeUrl,
          matchPercent: c.matchPercent,
          matchTags: c.matchTags,
          status: c.status,
          phone: c.phone,
          institute: c.institute,
          score: c.score,
          aiInterviewScore: c.aiInterviewScore,
          academiaScore: c.academiaScore,
          salaryExpectation: c.salaryExpectation,
          source: c.source,
          gender: c.gender,
          academicAssessment: c.academicAssessment,
          recruiterRating: c.recruiterRating,
          recruiterFeedback: c.recruiterFeedback,
          aiSummary: c.aiSummary,
          jdId: c.jdId,
        }
      });
    }

    // 4. Activities
    console.log(`Migrating ${data.activities?.length || 0} Activities...`);
    for (const act of (data.activities || [])) {
      await prisma.activity.upsert({
        where: { id: act.id },
        update: {
          employeeId: act.employeeId,
          action: act.action,
          status: act.status,
          time: act.time,
        },
        create: {
          id: act.id,
          employeeId: act.employeeId,
          action: act.action,
          status: act.status,
          time: act.time,
        }
      });
    }

    // 5. Payroll
    console.log(`Migrating ${data.payroll?.length || 0} Payroll Records...`);
    for (const p of (data.payroll || [])) {
      await prisma.payrollRecord.upsert({
        where: { id: p.id },
        update: {
          employeeId: p.employeeId,
          month: p.month,
          basic: p.basic,
          hra: p.hra,
          specialAllowance: p.specialAllowance,
          gross: p.gross,
          epf: p.epf,
          pt: p.pt,
          tds: p.tds,
          net: p.net,
        },
        create: {
          id: p.id,
          employeeId: p.employeeId,
          month: p.month,
          basic: p.basic,
          hra: p.hra,
          specialAllowance: p.specialAllowance,
          gross: p.gross,
          epf: p.epf,
          pt: p.pt,
          tds: p.tds,
          net: p.net,
        }
      });
    }

    // 6. Settings (GlobalConfig)
    console.log('Migrating Settings...');
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        await prisma.globalConfig.upsert({
          where: { key: key },
          update: { value: String(value) },
          create: { key: key, value: String(value) }
        });
      }
    }

    console.log('--- Migration Completed Successfully ---');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
