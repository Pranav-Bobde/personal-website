export interface Project {
  id: string;
  title: string;
  description: string;
  role: string;
  period: string;
  link: string;
  achievements: string[];
  technologies: string[];
}

export const projects: Project[] = [];
