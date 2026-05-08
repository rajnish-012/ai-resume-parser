import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useState} from "react";

type ReportFilter = "all" | "strong" | "needs-work" | "ats-risk";
type StatusFilter = "all" | NonNullable<Resume["status"]>;
type ConsoleIcon = "dashboard" | "reports" | "upload";
const applicationStatuses = ["saved", "applied", "interview", "offer"] as const;

const Icon = ({ name }: { name: ConsoleIcon }) => {
  const paths = {
    dashboard: (
      <>
        <path d="M4 13h7V4H4v9Z" />
        <path d="M13 20h7V4h-7v16Z" />
        <path d="M4 20h7v-5H4v5Z" />
      </>
    ),
    reports: (
      <>
        <path d="M7 3h8l4 4v14H7V3Z" />
        <path d="M15 3v5h4" />
        <path d="M10 12h6" />
        <path d="M10 16h6" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ResumeIQ" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<ReportFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes?.map((resume) => (
          JSON.parse(resume.value) as Resume
      ))

      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    }

    loadResumes()
  }, []);

  const totalResumes = resumes.length;
  const scoredResumes = resumes.filter((resume) => resume.feedback);
  const averageScore =
    scoredResumes.length > 0
      ? Math.round(
          scoredResumes.reduce(
            (total, resume) => total + (resume.feedback?.overallScore || 0),
            0,
          ) / scoredResumes.length,
        )
      : 0;
  const strongMatches = scoredResumes.filter(
    (resume) => (resume.feedback?.overallScore || 0) >= 70,
  ).length;
  const goodMatches = scoredResumes.filter((resume) => {
    const score = resume.feedback?.overallScore || 0;
    return score >= 55 && score < 70;
  }).length;
  const needsAttention = scoredResumes.filter(
    (resume) => (resume.feedback?.overallScore || 0) < 50,
  ).length;
  const weakMatches = scoredResumes.filter((resume) => {
    const score = resume.feedback?.overallScore || 0;
    return score > 0 && score < 55;
  }).length;
  const bestScore = scoredResumes.length
    ? Math.max(...scoredResumes.map((resume) => resume.feedback?.overallScore || 0))
    : 0;
  const atsRisks = scoredResumes.filter(
    (resume) => (resume.feedback?.ATS.score || 0) < 60,
  ).length;
  const insightText =
    totalResumes === 0
      ? "Your console is ready. Upload a resume to generate the first intelligence report."
      : atsRisks > 0
        ? `${atsRisks} resume${atsRisks === 1 ? "" : "s"} need ATS alignment before your next application push.`
        : strongMatches > 0
          ? `${strongMatches} resume${strongMatches === 1 ? "" : "s"} are showing strong hiring signals. Keep refining the rest.`
          : "Your reports are loaded. Start with the lowest score to unlock the fastest improvement.";
  const sortedResumes = [...scoredResumes].sort(
    (first, second) =>
      (second.feedback?.overallScore || 0) - (first.feedback?.overallScore || 0),
  );
  const bestResume = sortedResumes[0];
  const weakestResume = sortedResumes[sortedResumes.length - 1];
  const atsRiskResume = [...scoredResumes].sort(
    (first, second) => (first.feedback?.ATS.score || 0) - (second.feedback?.ATS.score || 0),
  )[0];
  const filteredResumes = resumes.filter((resume) => {
    const score = resume.feedback?.overallScore || 0;
    const atsScore = resume.feedback?.ATS.score || 0;
    const matchesSearch = `${resume.companyName || ""} ${resume.jobTitle || ""}`
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "strong" && score >= 75) ||
      (activeFilter === "needs-work" && score > 0 && score < 55) ||
      (activeFilter === "ats-risk" && atsScore > 0 && atsScore < 60);
    const matchesStatus =
      statusFilter === "all" || (resume.status || "saved") === statusFilter;

    return matchesSearch && matchesFilter && matchesStatus;
  });
  const filters: { id: ReportFilter; label: string; count: number }[] = [
    { id: "all", label: "All", count: totalResumes },
    { id: "strong", label: "Strong", count: strongMatches },
    { id: "needs-work", label: "Needs Work", count: needsAttention },
    { id: "ats-risk", label: "ATS Risk", count: atsRisks },
  ];
  const priorityReports = [
    {
      label: "Best signal",
      resume: bestResume,
      score: bestResume?.feedback?.overallScore,
      tone: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Priority review",
      resume: weakestResume,
      score: weakestResume?.feedback?.overallScore,
      tone: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      label: "Lowest ATS",
      resume: atsRiskResume,
      score: atsRiskResume?.feedback?.ATS.score,
      tone: "text-rose-700 bg-rose-50 border-rose-200",
    },
  ];
  const scoreDistribution = [
    {
      label: "Strong",
      count: strongMatches,
      className: "bg-emerald-500",
    },
    {
      label: "Good",
      count: goodMatches,
      className: "bg-blue-500",
    },
    {
      label: "Needs Work",
      count: weakMatches,
      className: "bg-amber-500",
    },
    {
      label: "ATS Risk",
      count: atsRisks,
      className: "bg-rose-500",
    },
  ];
  const distributionTotal = Math.max(
    scoreDistribution.reduce((total, item) => total + item.count, 0),
    1,
  );
  const statusCounts = applicationStatuses.map((status) => ({
    status,
    count: resumes.filter((resume) => (resume.status || "saved") === status).length,
  }));
  const statusFilters: { id: StatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All Statuses", count: totalResumes },
    ...statusCounts.map(({ status, count }) => ({
      id: status,
      label: status,
      count,
    })),
  ];

  return <main className="min-h-screen overflow-hidden bg-[#f6f8fb]">
    <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)] bg-[size:44px_44px,44px_44px,100%_100%,100%_100%,100%_100%]" />
    <div className="relative z-10">
      <Navbar />

      <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-8 px-4 pb-12 pt-8 sm:px-8 lg:px-12">
        <div className="grid gap-6 xl:grid-cols-[76px_1fr_380px]">
          <aside className="hidden rounded-3xl border border-white/80 bg-white/80 p-3 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl xl:flex xl:flex-col xl:items-center xl:gap-3">
            <a
              href="#top"
              className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg"
              title="Dashboard"
            >
              <Icon name="dashboard" />
            </a>
            <a
              href="#resume-reports"
              className="flex size-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              title="Reports"
            >
              <Icon name="reports" />
            </a>
            <Link
              to="/upload"
              className="flex size-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-lg font-black text-blue-700 transition hover:bg-blue-100"
              title="Upload"
            >
              <Icon name="upload" />
            </Link>
          </aside>

          <div id="top" className="overflow-hidden rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8 lg:p-10">
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                ResumeIQ Signal Console
              </span>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-cyan-700">
                AI screening workspace
              </span>
            </div>

            <div className="max-w-4xl">
              <h1 className="text-4xl font-black leading-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Application intelligence for every resume signal.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Review your submissions, spot ATS risks, and turn every resume
                into a sharper match for the roles you want.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/upload" className="primary-button w-full sm:w-fit">
                Analyze New Resume
              </Link>
              <a
                href="#resume-reports"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
              >
                View Reports
              </a>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["Reports", totalResumes, "Total analyzed files"],
                ["Average", averageScore, "Portfolio score"],
                ["Best", bestScore, "Highest signal"],
                ["ATS risks", atsRisks, "Need keyword work"],
              ].map(([label, value, helper]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500">
                    {helper}
                  </p>
                </div>
              ))}
            </div>

            {scoredResumes.length > 0 && (
              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm">
                <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                    Score distribution
                  </p>
                  <p className="text-xs font-semibold text-slate-500">
                    {scoredResumes.length} scored report{scoredResumes.length === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                  {scoreDistribution.map((item) => (
                    <div
                      key={item.label}
                      className={item.className}
                      style={{
                        width: `${Math.max((item.count / distributionTotal) * 100, item.count > 0 ? 7 : 0)}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {scoreDistribution.map((item) => (
                    <div key={item.label} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <span className={`size-2 rounded-full ${item.className}`} />
                      {item.label}
                      <span className="text-slate-400">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scoredResumes.length > 0 && (
              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                {priorityReports.map(({ label, resume, score, tone }) => (
                  <Link
                    key={label}
                    to={resume ? `/resume/${resume.id}` : "/upload"}
                    className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 ${tone}`}
                  >
                    <p className="text-xs font-black uppercase tracking-wide">
                      {label}
                    </p>
                    <p className="mt-2 truncate text-sm font-bold text-slate-950">
                      {resume?.companyName || "No report yet"}
                    </p>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {resume?.jobTitle || "Upload a resume to unlock this"}
                    </p>
                    <p className="mt-3 text-2xl font-black">
                      {typeof score === "number" ? score : "--"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-3xl border border-cyan-300/10 bg-[#0B1220] p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)]">
            <div className="mb-5 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-300">Live desk</p>
                <h2 className="mt-1 text-2xl font-black text-white">Signal Health</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-200 ring-1 ring-cyan-300/20">
                <span className="size-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.9)]" />
                ACTIVE
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Reports
                </p>
                <p className="mt-2 text-3xl font-black">{totalResumes}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Avg score
                </p>
                <p className="mt-2 text-3xl font-black">{averageScore}</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">
                  Strong
                </p>
                <p className="mt-2 text-3xl font-black text-emerald-100">
                  {strongMatches}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">
                  Watchlist
                </p>
                <p className="mt-2 text-3xl font-black text-amber-100">
                  {needsAttention}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-slate-200">
                AI insight
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {insightText}
              </p>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-slate-200">
                  Signal pipeline
                </p>
              </div>
              {["Parse", "Score", "Diagnose", "Improve"].map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-3 border-b border-white/10 px-4 py-3 last:border-b-0"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-black text-cyan-200 ring-1 ring-cyan-300/20">
                    {index + 1}
                  </span>
                  <p className="text-sm font-medium text-slate-300">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-slate-200">
                Application tracker
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {statusCounts.map(({ status, count }) => (
                  <div key={status} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-xs font-bold capitalize text-slate-400">
                      {status}
                    </p>
                    <p className="mt-1 text-xl font-black text-white">{count}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <div
          id="resume-reports"
          className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-[0_24px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                Intelligence reports
              </p>
              <h2 className="mt-1 text-3xl font-black text-slate-950!">
                Resume analysis library
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Each card opens a full review with ATS compatibility, category
              scores, and improvement notes.
            </p>
          </div>

          {!loadingResumes && resumes.length > 0 && (
            <>
              <div className="mb-6 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="relative">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by company or role..."
                    className="rounded-full pl-5 pr-12"
                    type="search"
                  />
                  <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    /
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setActiveFilter(filter.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                        activeFilter === filter.id
                          ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {filter.label}
                      <span className="ml-2 opacity-70">{filter.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                {statusFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setStatusFilter(filter.id)}
                    className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition ${
                      statusFilter === filter.id
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10"
                        : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {filter.label}
                    <span className="ml-2 opacity-70">{filter.count}</span>
                  </button>
                ))}
              </div>
            </>
          )}

      {loadingResumes && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-12">
            <img src="/images/resume-scan-2.gif" className="w-[220px]" />
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading analysis reports...
            </p>
          </div>
      )}

      {!loadingResumes && resumes.length > 0 && filteredResumes.length > 0 && (
        <div className="resumes-section">
          {filteredResumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}

      {!loadingResumes && resumes.length > 0 && filteredResumes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-14 text-center">
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600">
            No matching reports
          </div>
          <h3 className="text-2xl font-black text-slate-950">
            Try another signal filter
          </h3>
          <p className="max-w-md text-sm leading-6 text-slate-500">
            Adjust the search term or switch back to all reports to restore the
            full library.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setActiveFilter("all");
              setStatusFilter("all");
            }}
            className="primary-button mt-2 w-fit"
          >
            Reset View
          </button>
        </div>
      )}

      {!loadingResumes && resumes?.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-8 py-14 text-center">
            <div className="pointer-events-none absolute inset-x-10 top-10 h-24 rounded-full bg-blue-400/10 blur-3xl" />
            <div className="relative flex flex-col items-center justify-center gap-4">
            <div className="rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
              No reports yet
            </div>
            <h3 className="text-2xl font-black text-slate-950">
              Start your first AI resume review
            </h3>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Upload a PDF resume and paste the job description to generate
              your first signal report.
            </p>
            <Link to="/upload" className="primary-button mt-2 w-fit">
              Upload Resume
            </Link>
            <div className="mt-6 grid w-full max-w-2xl gap-3 sm:grid-cols-3">
              {["Upload PDF", "Run AI scan", "Improve match"].map((step) => (
                <div
                  key={step}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm"
                >
                  {step}
                </div>
              ))}
            </div>
            </div>
          </div>
      )}
        </div>
      </section>
    </div>
  </main>
}
