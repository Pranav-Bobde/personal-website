export const realEstateStudy = {
  title: "Owning a real-estate WhatsApp backend",
  preview:
    "Owned the backend for configurable property Q&A, document ingestion, lead summaries and site-visit booking. Used the LLM for intent and explicit backend code for booking.",
  path: "/work/real-estate-whatsapp",
} as const;

export const gitReportingStudy = {
  title: "Generating project reports from Git history",
  preview:
    "Built a tool that turns structured Git history into project reports, with AI-assisted wording and human review.",
  path: "/work/git-reporting",
} as const;

export const workStudies = [realEstateStudy, gitReportingStudy] as const;
