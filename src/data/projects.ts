// Every project — public or private — is described the same way. The only
// thing that differs is whether `githubUrl` is set: omit it (or leave it
// undefined) for a private/proprietary project and it just won't render a
// code link. Everything else (description, media, tech stack) works
// identically for both.

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
  summary: LocalizedText; // one or two sentences, shown on the project card
  description: LocalizedText; // full case-study copy for the project page
  techStack: string[];
  year: string; // e.g. "2023" or "2022–2023"
  githubUrl?: string; // omit for private/proprietary projects
  liveUrl?: string;
  demoUrl?: string; // walkthrough video (e.g. Loom) — useful when there's no live/app-store link
  media: ProjectMedia[];
  featured?: boolean; // true = show near the top of the grid
}

export const projects: Project[] = [
  {
    slug: "metafit",

    title: "MetaFit",

    summary: {
      en: "An AI-powered nutrition tracker that turns food photos into detailed macronutrient estimates and personalized feedback.",
      es: "Una app de seguimiento nutricional con IA que convierte fotos de comida en estimaciones detalladas de macronutrientes y feedback personalizado.",
    },

    description: {
      en: "MetaFit is a React Native / Expo app for tracking meals through four input methods: food photos, barcode scanning, nutrition-label photos, or manual entry. Meals are analyzed to produce an instant macronutrient breakdown, while AI-generated feedback adapts to the user's profile and eating patterns. The application uses TypeScript, Expo Router, and Firebase Auth, Firestore, and Storage on the mobile side, with Firebase Cloud Functions powering the backend. GPT-4o handles image and nutrition-label analysis, while GPT-4o-mini generates personalized feedback and analyzes patterns across date ranges. Barcode lookups use Open Food Facts, and meal history can be exported to PDF. AI calls are handled server-side through Firebase Cloud Functions, with API credentials secured using Firebase Secret Manager.",

      es: "MetaFit es una app en React Native / Expo para registrar comidas mediante cuatro métodos: fotos de comida, escaneo de códigos de barras, fotos de etiquetas nutricionales o carga manual. Las comidas se analizan para generar un desglose instantáneo de macronutrientes, mientras que la IA adapta el feedback al perfil y los patrones alimentarios del usuario. La aplicación utiliza TypeScript, Expo Router y Firebase Auth, Firestore y Storage en el cliente mobile, con Firebase Cloud Functions como backend. GPT-4o se encarga del análisis de imágenes y etiquetas nutricionales, mientras que GPT-4o-mini genera feedback personalizado y analiza patrones a lo largo de distintos períodos. Las búsquedas por código de barras utilizan Open Food Facts y el historial de comidas puede exportarse a PDF. Las llamadas a la IA se realizan desde Firebase Cloud Functions y las credenciales de la API se mantienen protegidas mediante Firebase Secret Manager.",
    },

    techStack: ["React Native", "TypeScript", "Firebase", "OpenAI API"],

    year: "2025",

    githubUrl: "https://github.com/giulyferto/TFG-MetaFit",

    demoUrl: "https://www.loom.com/share/d47abf1aa5b94f5986948c3010b78caf",

    media: [
      {
        type: "image",
        src: "/projects/MetaFit/Home-Page.png",
        alt: {
          en: "MetaFit home screen showing daily macronutrient summary",
          es: "Pantalla principal de MetaFit con el resumen diario de macronutrientes",
        },
      },
      {
        type: "image",
        src: "/projects/MetaFit/Desgloce-Ingedientes.png",
        alt: {
          en: "Ingredient breakdown for a scanned meal",
          es: "Desglose de ingredientes de una comida escaneada",
        },
      },
      {
        type: "image",
        src: "/projects/MetaFit/Analisis-Nutricional.png",
        alt: {
          en: "AI-generated nutritional analysis of a meal",
          es: "Análisis nutricional de una comida generado por IA",
        },
      },
      {
        type: "image",
        src: "/projects/MetaFit/Analisis-Periodo.png",
        alt: {
          en: "AI-generated feedback across a date range",
          es: "Feedback de IA sobre un período de fechas",
        },
      },
      {
        type: "image",
        src: "/projects/MetaFit/Historial-Comidas.png",
        alt: {
          en: "Meal history log",
          es: "Historial de comidas registradas",
        },
      },
    ],

    featured: true,
  },
  {
    slug: "rampapp",

    title: "RampApp",

    summary: {
      en: "A collaborative accessibility map where users report and rate accessible places for people with reduced mobility across Córdoba.",
      es: "Un mapa colaborativo de accesibilidad donde los usuarios reportan y califican lugares accesibles para personas con movilidad reducida en Córdoba.",
    },

    description: {
      en: "RampApp is a React / TypeScript web app that helps people with mobility limitations find and share accessible places across Córdoba. Users can mark places on an interactive Mapbox map, indicate their level of accessibility, add photos and comments, and rate their condition. New reports go through an admin approval workflow before becoming public, with dedicated views for personal and saved places. I developed the application together with a teammate who was responsible for the UI/UX design. I handled the frontend and backend implementation, including Google authentication, role-based access with Firebase custom claims, Firestore security rules, image storage, and Cloud Functions for user and role management. The app was built with React, TypeScript, Vite, Material UI, Mapbox GL JS, and Firebase.",

      es: "RampApp es una aplicación web en React / TypeScript que ayuda a personas con movilidad reducida a encontrar y compartir lugares accesibles en Córdoba. Los usuarios pueden marcar lugares en un mapa interactivo de Mapbox, indicar su nivel de accesibilidad, agregar fotos y comentarios, y valorar su estado. Los nuevos reportes pasan por un flujo de aprobación administrativa antes de hacerse públicos, con vistas para gestionar lugares propios y guardados. Desarrollé la aplicación junto con un compañero, quien estuvo a cargo del diseño UI/UX. Me encargué de la implementación frontend y backend, incluyendo autenticación con Google, gestión de roles mediante custom claims de Firebase, reglas de seguridad de Firestore, almacenamiento de imágenes y Cloud Functions para la gestión de usuarios y roles. La aplicación fue desarrollada con React, TypeScript, Vite, Material UI, Mapbox GL JS y Firebase.",
    },

    techStack: ["React", "Mapbox", "Firebase", "Material UI"],

    year: "2025",

    githubUrl: "https://github.com/giulyferto/RampApp",

    demoUrl: "https://ramp-app-70527.web.app/",

    media: [
      {
        type: "image",
        src: "/projects/RampApp/Home-Page.png",
        alt: {
          en: "RampApp main map with accessibility points and category filters",
          es: "Mapa principal de RampApp con puntos de accesibilidad y filtros por categoría",
        },
      },
      {
        type: "image",
        src: "/projects/RampApp/Crear-Punto.png",
        alt: {
          en: "Form to add a new accessibility point with photo, category, and status",
          es: "Formulario para agregar un nuevo punto accesible con foto, categoría y estado",
        },
      },
      {
        type: "image",
        src: "/projects/RampApp/Mis-Puntos.png",
        alt: {
          en: "View of the points a user has submitted",
          es: "Vista de los puntos creados por el usuario",
        },
      },
      {
        type: "image",
        src: "/projects/RampApp/Puntos-Guardados.png",
        alt: {
          en: "Saved (favorited) accessibility points",
          es: "Puntos de accesibilidad guardados (favoritos)",
        },
      },
      {
        type: "image",
        src: "/projects/RampApp/Administrar-Puntos.png",
        alt: {
          en: "Admin view for reviewing and approving pending points",
          es: "Vista de administrador para revisar y aprobar puntos pendientes",
        },
      },
    ],

    featured: true,
  },
];
