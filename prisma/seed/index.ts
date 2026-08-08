import { PrismaClient } from "@prisma/client";
import { siteConfig } from "@/lib/site-config";
import { defaultAboutPage } from "@/lib/about-defaults";
import { toPrismaJson } from "@/lib/prisma-json";

const prisma = new PrismaClient();

async function main() {
  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      name: siteConfig.name,
      role: siteConfig.role,
      tagline: siteConfig.tagline,
      email: siteConfig.email,
      githubUrl: siteConfig.social.github,
      linkedinUrl: siteConfig.social.linkedin,
      resumeUrl: siteConfig.resumeUrl,
      currentlyLearning: toPrismaJson([...siteConfig.currentlyLearning]),
      aboutPage: toPrismaJson(defaultAboutPage),
    },
    update: {},
  });

  console.log("Site settings initialized.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
