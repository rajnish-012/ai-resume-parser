import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { usePuterStore } from "./lib/puter";
import { useEffect } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    {
      title: "AI Resume Analyzer & ATS Resume Checker | ResumeIQ",
    },
    {
      name: "description",
      content:
        "Free AI Resume Analyzer and ATS Resume Checker. Upload your resume, get ATS scores, keyword suggestions, resume feedback, resume parsing, and job matching insights.",
    },
    {
      name: "keywords",
      content:
        "AI Resume Analyzer, ATS Resume Checker, Resume Parser, Resume Scanner, Resume Review Tool, Resume Score Checker, CV Analyzer, Resume Analysis Tool, AI Resume Parser",
    },
    {
      name: "robots",
      content: "index, follow",
    },
    {
      name: "author",
      content: "ResumeIQ",
    },
    {
      property: "og:title",
      content: "AI Resume Analyzer & ATS Resume Checker | ResumeIQ",
    },
    {
      property: "og:description",
      content:
        "Analyze your resume with AI, improve ATS compatibility, and get actionable resume feedback.",
    },
    {
      property: "og:type",
      content: "website",
    },
    {
      property: "og:url",
      content: "https://ai-parseresume.vercel.app",
    },
    {
      property: "og:site_name",
      content: "ResumeIQ",
    },
    {
      name: "twitter:card",
      content: "summary_large_image",
    },
    {
      name: "twitter:title",
      content: "AI Resume Analyzer & ATS Resume Checker",
    },
    {
      name: "twitter:description",
      content:
        "Upload your resume and get ATS analysis, resume scoring, keyword optimization and AI feedback.",
    },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { init } = usePuterStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Canonical URL */}
        <link
          rel="canonical"
          href="https://ai-parseresume.vercel.app"
        />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ResumeIQ",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "AI Resume Analyzer and ATS Resume Checker that helps users improve ATS scores and optimize resumes.",
              url: "https://ai-parseresume.vercel.app",
            }),
          }}
        />

        <Meta />
        <Links />
      </head>

      <body>
        <script src="https://js.puter.com/v2/"></script>

        {children}

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>

      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}