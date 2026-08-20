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
    slug: "metafit",

    title: "MetaFit",

    role: {
      en: "Full-stack mobile engineer",
      es: "Ingeniera full-stack mobile",
    },

    summary: {
      en: "An AI-powered nutrition tracker that turns food photos into detailed macronutrient estimates and personalized feedback.",
      es: "Una app de seguimiento nutricional con IA que convierte fotos de comida en estimaciones detalladas de macronutrientes y feedback personalizado.",
    },

    description: {
      en: "MetaFit is a React Native / Expo app for tracking meals through four input methods: food photos, barcode scanning, nutrition-label photos, or manual entry. Meals are analyzed to produce an instant macronutrient breakdown, while AI-generated feedback adapts to the user's profile and eating patterns. The application uses TypeScript, Expo Router, and Firebase Auth, Firestore, and Storage on the mobile side, with Firebase Cloud Functions powering the backend. GPT-4o handles image and nutrition-label analysis, while GPT-4o-mini generates personalized feedback and analyzes patterns across date ranges. Barcode lookups use Open Food Facts, and meal history can be exported to PDF. One of the main engineering challenges was prompt design: producing structured, consistent, and well-calibrated nutrition estimates from inherently ambiguous food images. AI calls are handled server-side through Firebase Cloud Functions, with API credentials secured using Firebase Secret Manager.",

      es: "MetaFit es una app en React Native / Expo para registrar comidas mediante cuatro métodos: fotos de comida, escaneo de códigos de barras, fotos de etiquetas nutricionales o carga manual. Las comidas se analizan para generar un desglose instantáneo de macronutrientes, mientras que la IA adapta el feedback al perfil y los patrones alimentarios del usuario. La aplicación utiliza TypeScript, Expo Router y Firebase Auth, Firestore y Storage en el cliente mobile, con Firebase Cloud Functions como backend. GPT-4o se encarga del análisis de imágenes y etiquetas nutricionales, mientras que GPT-4o-mini genera feedback personalizado y analiza patrones a lo largo de distintos períodos. Las búsquedas por código de barras utilizan Open Food Facts y el historial de comidas puede exportarse a PDF. Uno de los principales desafíos de ingeniería fue el diseño de prompts: conseguir estimaciones nutricionales estructuradas, consistentes y bien calibradas a partir de imágenes de comida, que por naturaleza contienen información ambigua. Las llamadas a la IA se realizan desde Firebase Cloud Functions y las credenciales de la API se mantienen protegidas mediante Firebase Secret Manager.",
    },

    techStack: [
      "React Native",
      "Expo",
      "TypeScript",
      "Firebase",
      "OpenAI GPT-4o",
    ],

    year: "2025",

    githubUrl: "https://github.com/giulyferto/TFG-MetaFit",

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
