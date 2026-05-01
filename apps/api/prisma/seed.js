import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(){
  await prisma.event.createMany({
    data:[
      {
        slug:'bollywood-rooftop-night-london',
        title:'Bollywood Rooftop Night',
        city:'London',
        category:'Desi Night',
        priceMinor:1200,
        image:'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4',
        venue:'Rooftop London',
        score:95,
        trending:true
      },
      {
        slug:'tamil-indie-showcase-london',
        title:'Tamil Indie Showcase',
        city:'London',
        category:'Music',
        priceMinor:800,
        image:'https://images.unsplash.com/photo-1492684223066-81342ee5ff30',
        venue:'Camden Arts',
        score:90,
        trending:true
      }
    ],
    skipDuplicates:true
  });

  await prisma.landingPage.createMany({
    data:[
      {
        slug:'london-bollywood-events',
        title:'Bollywood Events in London',
        seoTitle:'Bollywood Events London | LocalVibe',
        seoDescription:'Best Bollywood events in London',
        city:'London',
        content:'Find Bollywood events in London'
      }
    ],
    skipDuplicates:true
  });

  console.log('Seed complete');
}

main().finally(()=>prisma.$disconnect());