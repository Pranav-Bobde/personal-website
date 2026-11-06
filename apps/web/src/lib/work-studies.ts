export const realEstateStudy = {
  title: "WhatsApp AI agent platform for real-estate businesses",
  preview:
    "Built the whole backend myself after the MVP deadline moved from three months to one: property Q&A, document ingestion, lead summaries and site-visit booking, configurable per business. Got PgBouncer and Hatchet durable workflows into sprints alongside features.",
  path: "/work/real-estate-whatsapp",
} as const;

export const leaseQaStudy = {
  title: "Lease Q&A: answer accuracy from 40-50% to 80%+",
  preview:
    "Took over a client RAG project stuck at 40-50% answer accuracy and lifted it to 80%+ on the client's own test questions, using an eval set to score every change and a multimodal LLM to check lease tables against page images.",
  path: "/work/lease-qa",
} as const;

export const persistentStudy = {
  title: "Multi-agent COBOL-to-Java migration prototype",
  preview:
    "Prototyped the migration with coder, reviewer and user-proxy agents on AutoGen, work that helped the company pursue multi-million-dollar deals.",
  href: "https://www.persistent.com/blogs/pioneering-cobol-to-java-migration-unleashing-the-power-of-multi-agent-frameworks/",
} as const;

export const gitReportingStudy = {
  title: "Client reports from Git history: days to minutes",
  preview:
    "Used AI to automate monthly client task sheets from standardized Git commit details. This removed separate work logs and cut preparation from days to a few minutes.",
  path: "/work/git-reporting",
} as const;

export const workStudies = [realEstateStudy, leaseQaStudy, persistentStudy, gitReportingStudy] as const;
