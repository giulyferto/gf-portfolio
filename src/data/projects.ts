// Every project — public or private — is described the same way. The only
// thing that differs is whether `githubUrl` is set: omit it (or leave it
// undefined) for a private/proprietary project and it just won't render a
// code link. Everything else (description, media, tech stack, your role)
// works identically for both.

export type Locale = "en" | "es";

export type LocalizedText = {
  en: string;
  es: string;
};

export type ProjectMedia = {
  type: "image" | "video";
  src: string; // path under /public, e.g. "/media/my-project/hero.png"
  alt: LocalizedText;
};

export interface Project {
  slug: string; // used in the URL: /en/projects/<slug>
  title: string; // project names generally aren't translated
  role: LocalizedText;
  summary: LocalizedText; // one or two sentences, shown on the project card
  description: LocalizedText; // full case-study copy for the project page
  techStack: string[];
  year: string; // e.g. "2023" or "2022–2023"
  githubUrl?: string; // omit for private/proprietary projects
  liveUrl?: string;
  media: ProjectMedia[];
  featured?: boolean; // true = show near the top of the grid
}

// TODO(Giuliana): replace these with your real projects. These entries are
// only here to show the expected shape — delete them once you've added your
// own. Up to 3 keeps the racket carousel's "01/03, 02/03, 03/03" counter
// from ever running past a single digit.
export const projects: Project[] = [
  {
    slug: "example-project",
    title: "Example Project",
    role: {
      en: "Full-stack engineer",
      es: "Ingeniera full-stack",
    },
    summary: {
      en: "A one or two sentence hook — what it is and why it mattered.",
      es: "Un gancho de una o dos oraciones — qué es y por qué importó.",
    },
    description: {
      en: "The full case-study copy goes here: the problem, your role, key decisions, and the outcome.",
      es: "Acá va el copy completo del caso de estudio: el problema, tu rol, decisiones clave y el resultado.",
    },
    techStack: ["Next.js", "TypeScript", "PostgreSQL"],
    year: "2024",
    githubUrl: "https://github.com/your-handle/example-project",
    media: [],
    featured: true,
  },
  {
    slug: "second-example-project",
    title: "Second Example Project",
    role: {
      en: "Backend engineer",
      es: "Ingeniera backend",
    },
    summary: {
      en: "A one or two sentence hook — what it is and why it mattered.",
      es: "Un gancho de una o dos oraciones — qué es y por qué importó.",
    },
    description: {
      en: "The full case-study copy goes here: the problem, your role, key decisions, and the outcome.",
      es: "Acá va el copy completo del caso de estudio: el problema, tu rol, decisiones clave y el resultado.",
    },
    techStack: ["Node.js", "GraphQL", "Redis"],
    year: "2023",
    liveUrl: "https://example.com",
    media: [],
  },
  {
    slug: "third-example-project",
    title: "Third Example Project",
    role: {
      en: "Mobile engineer",
      es: "Ingeniera mobile",
    },
    summary: {
      en: "A one or two sentence hook — what it is and why it mattered.",
      es: "Un gancho de una o dos oraciones — qué es y por qué importó.",
    },
    description: {
      en: "The full case-study copy goes here: the problem, your role, key decisions, and the outcome.",
      es: "Acá va el copy completo del caso de estudio: el problema, tu rol, decisiones clave y el resultado.",
    },
    techStack: ["React Native", "TypeScript"],
    year: "2022–2023",
    media: [],
  },
];
