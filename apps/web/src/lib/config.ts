import { env } from "@oreno-website.bts-migration/env/web";

export const siteConfig = {
  name: "Pranav Bobde",
  title: "TypeScript engineer with end-to-end backend ownership.",
  location: "Nagpur, India",
  availability: "Available immediately",
  openTo: "Open to remote or Bangalore",
  bio: {
    main: "I've built and deployed client backends, AI applications and integrations, led small teams, and handled the operational work around delivery.",
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
    linkedin: "https://linkedin.com/in/pranav-bobde-b95010194",
    resume: "https://drive.google.com/file/d/199FikT8Ntn-D2nVHzHbgtaJExQOkLweY/view?usp=sharing",
    email: "bobdep31@gmail.com",
  },
  accentColor: "teal",
} as const;
