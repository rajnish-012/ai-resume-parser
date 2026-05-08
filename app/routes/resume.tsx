import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import Summary from "~/components/Summary";
import { usePuterStore } from "~/lib/puter";

export const meta = () => [
  { title: "ResumeIQ | Review" },
  { name: "description", content: "Detailed overview of your resume" },
];

const stopWords = new Set([
  "and", "the", "for", "with", "you", "your", "are", "our", "this", "that",
  "from", "will", "have", "has", "into", "role", "job", "work", "team",
  "using", "including", "about", "their", "they", "them", "to", "of", "in",
  "on", "a", "an", "as", "is", "be", "or", "by", "at",
]);

const applicationStatuses = ["saved", "applied", "interview", "rejected", "offer"] as const;

const extractKeywords = (text = "") => {
  const counts = new Map<string, number>();

  text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));

  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1])
    .slice(0, 14)
    .map(([word]) => word);
};

const downloadText = (filename: string, content: string, type: string) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};

const Resume = () => {
  const { auth, isLoading, fs, kv } = usePuterStore();
  const { id } = useParams();

  const [resumeData, setResumeData] = useState<Resume | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [checkedFixes, setCheckedFixes] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading, auth.isAuthenticated, navigate, id]);

  useEffect(() => {
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);

      if (!resume) return;

      const data = JSON.parse(resume) as Resume;
      setResumeData(data);
      setNotes(data.notes || "");

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
      setResumeUrl(URL.createObjectURL(pdfBlob));

      if (data.imagePath) {
        const imageBlob = await fs.read(data.imagePath);
        if (imageBlob) {
          setImageUrl(URL.createObjectURL(imageBlob));
        }
      }

      setFeedback(data.feedback);
    };
    loadResume();
  }, [fs, id, kv]);

  useEffect(() => {
    if (!id || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(`resume-fixes:${id}`);
    setCheckedFixes(stored ? JSON.parse(stored) : []);
  }, [id]);

  const criticalFixes = useMemo(() => {
    if (!feedback) return [];

    return [
      ...feedback.ATS.tips.map((tip) => ({ ...tip, explanation: tip.tip })),
      ...feedback.toneAndStyle.tips,
      ...feedback.content.tips,
      ...feedback.structure.tips,
      ...feedback.skills.tips,
    ]
      .filter((tip) => tip.type === "improve")
      .slice(0, 8);
  }, [feedback]);

  const keywords = extractKeywords(resumeData?.jobDescription);
  const completedFixes = checkedFixes.length;

  const toggleFix = (fix: string) => {
    const next = checkedFixes.includes(fix)
      ? checkedFixes.filter((item) => item !== fix)
      : [...checkedFixes, fix];

    setCheckedFixes(next);
    if (id && typeof window !== "undefined") {
      window.localStorage.setItem(`resume-fixes:${id}`, JSON.stringify(next));
    }
  };

  const updateStatus = async (status: Resume["status"]) => {
    if (!resumeData || !id) return;
    const next = { ...resumeData, status, updatedAt: new Date().toISOString() };
    setResumeData(next);
    await kv.set(`resume:${id}`, JSON.stringify(next));
  };

  const saveNotes = async () => {
    if (!resumeData || !id) return;
    const next = { ...resumeData, notes, updatedAt: new Date().toISOString() };
    setResumeData(next);
    await kv.set(`resume:${id}`, JSON.stringify(next));
    setNotesSaved(true);
    window.setTimeout(() => setNotesSaved(false), 1600);
  };

  const exportJson = () => {
    if (!resumeData) return;
    downloadText(
      `resumeiq-${resumeData.companyName || "report"}.json`,
      JSON.stringify({ ...resumeData, feedback, completedFixes }, null, 2),
      "application/json",
    );
  };

  const exportMarkdown = () => {
    if (!resumeData || !feedback) return;

    const markdown = `# ResumeIQ Report

Company: ${resumeData.companyName || "Unknown"}
Role: ${resumeData.jobTitle || "Unknown"}
Status: ${resumeData.status || "saved"}

## Scores
- Overall: ${feedback.overallScore}/100
- ATS: ${feedback.ATS.score}/100
- Tone & Style: ${feedback.toneAndStyle.score}/100
- Content: ${feedback.content.score}/100
- Structure: ${feedback.structure.score}/100
- Skills: ${feedback.skills.score}/100

## Critical Fixes
${criticalFixes.map((fix) => `- ${fix.tip}`).join("\n") || "- No critical fixes found."}

## Focus Keywords
${keywords.map((keyword) => `- ${keyword}`).join("\n") || "- No job description keywords available."}

## Notes
${resumeData.notes || "No notes saved."}
`;

    downloadText(
      `resumeiq-${resumeData.companyName || "report"}.md`,
      markdown,
      "text/markdown",
    );
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb] pt-0!">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),radial-gradient(circle_at_12%_10%,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_95%_0%,rgba(6,182,212,0.16),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)] bg-[size:44px_44px,44px_44px,100%_100%,100%_100%,100%_100%]" />
      <div className="relative z-10">
        <nav className="resume-nav">
          <Link to="/" className="back-button">
            <img src="/icons/back.svg" alt="back" className="size-3" />
            <span className="text-sm font-bold text-slate-800">
              Back to Console
            </span>
          </Link>
          <Link to="/upload" className="primary-button w-fit px-4 py-2">
            New Scan
          </Link>
        </nav>

        <div className="grid min-h-[calc(100vh-73px)] gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="sticky top-[73px] flex h-[calc(100vh-73px)] flex-col gap-4 border-r border-slate-200/80 bg-white/70 p-4 backdrop-blur-xl max-lg:static max-lg:h-auto sm:p-6">
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-cyan-300/10 bg-[#0B1220] p-4 text-white">
              <div>
                <p className="text-xs font-black uppercase tracking-wide text-cyan-300">
                  Document preview
                </p>
                <h1 className="mt-1 text-2xl font-black text-white">
                  Resume Scan
                </h1>
              </div>
              {feedback && (
                <div className="rounded-2xl bg-white/10 px-4 py-2 text-right ring-1 ring-white/10">
                  <p className="text-xs font-bold text-slate-400">Score</p>
                  <p className="text-2xl font-black text-cyan-200">
                    {feedback.overallScore}
                  </p>
                </div>
              )}
            </div>

            <div className="gradient-border flex min-h-0 flex-1 items-center justify-center">
              {imageUrl && resumeUrl ? (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white"
                >
                  <img
                    src={imageUrl}
                    alt="resume"
                    className="h-full w-full object-contain"
                    title="Open PDF"
                  />
                </a>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <img src="/images/resume-scan-2.gif" className="w-64" alt="Loading resume" />
                  <p className="mt-4 text-sm font-bold text-slate-500">
                    Loading document preview...
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-6 px-4 py-6 sm:px-8 lg:px-10">
            <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                    AI review report
                  </span>
                  <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950">
                    Resume Review
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                    Review ATS compatibility, category scoring, and the highest
                    priority fixes before your next application.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={resumeData?.status || "saved"}
                    onChange={(event) => updateStatus(event.target.value as Resume["status"])}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm"
                  >
                    {applicationStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={exportMarkdown}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    Export MD
                  </button>
                  <button
                    type="button"
                    onClick={exportJson}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {feedback ? (
              <div className="flex flex-col gap-6 animate-in fade-in duration-1000">
                {criticalFixes.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                    <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                          Action plan
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-slate-950!">
                          Priority fixes
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          Work through these items first. They are pulled from the
                          highest-impact improvement notes in your report.
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Progress
                        </p>
                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {completedFixes}/{criticalFixes.length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
                          style={{
                            width: `${(completedFixes / criticalFixes.length) * 100}%`,
                          }}
                        />
                    </div>

                    <div className="mt-5 grid gap-3">
                      {criticalFixes.map((fix, index) => (
                        <button
                          type="button"
                          key={`${fix.tip}-${index}`}
                          onClick={() => toggleFix(fix.tip)}
                          className={`group flex w-full cursor-pointer items-start gap-4 rounded-2xl border px-4 py-4 text-left transition ${
                            checkedFixes.includes(fix.tip)
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40"
                          }`}
                        >
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-black transition ${
                              checkedFixes.includes(fix.tip)
                                ? "border-emerald-300 bg-emerald-600 text-white"
                                : "border-slate-300 bg-slate-50 text-slate-500 group-hover:border-blue-300 group-hover:text-blue-700"
                            }`}
                          >
                            {checkedFixes.includes(fix.tip) ? "✓" : index + 1}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`block text-sm font-black leading-6 ${
                                checkedFixes.includes(fix.tip)
                                  ? "text-emerald-800 line-through decoration-emerald-700/60"
                                  : "text-slate-900"
                              }`}
                            >
                              {fix.tip}
                            </span>
                            {"explanation" in fix && fix.explanation && (
                              <span className="mt-1 block text-sm font-medium leading-6 text-slate-500">
                                {fix.explanation}
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                    Keyword focus
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Extracted from the target job description for quick alignment checks.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {keywords.length > 0 ? (
                      keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-bold text-cyan-700"
                        >
                          {keyword}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm font-semibold text-slate-500">
                        No job description keywords available.
                      </span>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                        Recruiter notes
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Keep application context, follow-up reminders, or rewrite
                        ideas attached to this report.
                      </p>
                    </div>
                    {resumeData?.updatedAt && (
                      <p className="text-xs font-bold text-slate-400">
                        Updated {new Date(resumeData.updatedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      setNotesSaved(false);
                    }}
                    rows={5}
                    placeholder="Add follow-up notes, rewrite ideas, recruiter feedback, or application reminders..."
                    className="mt-4"
                  />
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-500">
                      {notesSaved ? "Notes saved." : "Saved into this report."}
                    </p>
                    <button
                      type="button"
                      onClick={saveNotes}
                      className="primary-button w-fit px-5 py-2"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>

                <Summary feedback={feedback} />
                <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                <Details feedback={feedback} />
              </div>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                <img src="/images/resume-scan-2.gif" className="mx-auto w-72" alt="Loading analysis" />
                <p className="mt-4 text-sm font-bold text-slate-500">
                  Loading AI analysis...
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default Resume;
