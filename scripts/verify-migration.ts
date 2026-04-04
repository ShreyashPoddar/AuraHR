import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function verify() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const candidateCount = await prisma.candidate.count();
    const jdCount = await prisma.jobDescription.count();
    const configCount = await prisma.globalConfig.count();

    const configs = await prisma.globalConfig.findMany();

    console.log(`--- Migration Verification ---`);
    console.log(`Candidates: ${candidateCount}`);
    console.log(`Job Descriptions: ${jdCount}`);
    console.log(`Global Configs: ${configCount}`);
    configs.forEach(c => console.log(`  - ${c.key}: ${c.value}`));
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
