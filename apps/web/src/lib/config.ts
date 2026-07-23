import { env } from "@oreno-website.bts-migration/env/web";

export const siteConfig = {
  name: "Pranav Bobde",
  title: "CTO @Senslyze",
  location: "Nagpur, India",
  availability: "Available immediately",
  openTo: "Open to remote or Bangalore",
  bio: {
    main: `I'm a hands-on CTO who builds full-stack TypeScript / Node.js + AI products — with production experience shipping WhatsApp bots. Looking for founding-stage or small-team opportunities.`,
    secondaryTitle: "",
    secondary: "",
  },
  coreValues: [
    {
      title: "First principles",
      body: `"It works, leave it" isn't good enough. I trace things to the root before I trust them.`,
    },
    {
      title: "Curiosity & growth",
      body: `I go deep because I need to know exactly how stuff works — not because a ticket told me to.`,
    },
    {
      title: "Sharpen against the best",
      body: `I want to be the least experienced person on the team. I'm pulled forward by cracked developers who are better than me — I'd rather be catching up than coasting.`,
    },
    {
      title: "Founder energy",
      body: `Startups are my natural habitat — small teams, high ownership, no bureaucracy. The intensity and the hours aren't a con for me; they're a pro.`,
    },
  ],
  sections: {
    home: true,
    blogs: true,
    newsletter: true,
    projects: false,
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
    linkedin: "https://linkedin.com/in/pranav-bobde-b95010194",
    resume: "https://tinyurl.com/pranav-bobde-resume",
    email: "bobdep31@gmail.com",
  },
  accentColor: "teal",
} as const;
