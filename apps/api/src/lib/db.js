import { PrismaClient } from '@prisma/client';

let prisma = null;

export function getDb(){
  if(!process.env.DATABASE_URL){
    return null; // fallback mode
  }

  if(!prisma){
    prisma = new PrismaClient();
  }

  return prisma;
}
