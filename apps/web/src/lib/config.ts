import { env } from "@oreno-website.bts-migration/env/web";

export const siteConfig = {
  name: "Pranav Bobde",
  title: "AI Engineer | LLM Systems, RAG & Claude Code",
  location: "Nagpur, India",
  current: "Software Engineer at Suzega",
  bio: {
    main: "I've spent nearly 3 years building LLM systems: RAG, tool calling, evals and the backends behind them. As Head of Technology at Senslyze, I led 8-10 developers across client projects and built the whole backend of a WhatsApp AI agent platform myself. I also took over a client RAG project stuck at 40-50% accuracy and lifted it to 80%+ on the client's own test questions.",
    secondaryTitle: "",
    secondary: "",
  },
  sections: {
    home: true,
    blogs: true,
    newsletter: true,
    projects: true,
  },
  newsletter: {
    name: "Pranav's Notes",
    url: env.VITE_NEWSLETTER_URL,
    description:
      "A weekly-ish note for tech launches, important AI/dev news, good reads, and things I'm building or thinking through.",
  },
  social: {
    github: "https://github.com/Pranav-Bobde",
    twitter: "https://x.com/PranavBobde",
    twitterDm: "https://twitter.com/messages/compose?recipient_id=835557109592829952",
    youtube: "https://www.youtube.com/@pranavb-dot-xyz",
    linkedin: "https://linkedin.com/in/pranavbobde",
    resume: "https://drive.google.com/file/d/1A-vGJPMl__JTKzBEiTRaqRcop2q5Vsgr/view?usp=sharing",
    email: "pranav@pranavb.xyz",
  },
  accentColor: "teal",
} as const;
