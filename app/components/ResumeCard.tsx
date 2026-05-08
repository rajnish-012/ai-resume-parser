import { Link } from "react-router";
import ScoreCircle from "./ScoreCircle";
import { usePuterStore } from "~/lib/puter";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";

type Props = {
  resume: Resume;
};

const ResumeCard = ({
  resume: { id, companyName, jobTitle, feedback, imagePath, status: applicationStatus = "saved" },
}: Props) => {
  const { fs } = usePuterStore();
  const [resumeUrl, setResumeUrl] = useState("");

  useEffect(() => {
    const loadResume = async () => {
      if (!imagePath) return;
      const blob = await fs.read(imagePath);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setResumeUrl(url);
    };
    loadResume();
  }, [fs, imagePath]);

  // Safely handle feedback being null/undefined
  const score = feedback?.overallScore ?? 0;
  const atsScore = feedback?.ATS?.score ?? 0;
  const signalStatus =
    score >= 75
      ? "Strong Match"
      : score >= 55
        ? "Good Signal"
        : score > 0
          ? "Needs Work"
          : "Pending Review";
  const statusClass =
    score >= 75
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : score >= 55
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : score > 0
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-slate-200 bg-slate-50 text-slate-600";
  const statusAccentClass =
    score >= 75
      ? "from-emerald-400 to-cyan-400"
      : score >= 55
        ? "from-blue-500 to-cyan-400"
        : score > 0
          ? "from-amber-400 to-rose-400"
          : "from-slate-300 to-slate-400";

  return (
    <Link
      to={`/resume/${id}`}
      className="resume-card animate-in fade-in duration-1000"
    >
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", statusAccentClass)} />
      <div className="flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wide",
            statusClass,
          )}
        >
          {signalStatus}
        </span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
          ATS {atsScore || "--"}
        </span>
      </div>

      <div className="resume-card-header">
        <div className="min-w-0 flex flex-col gap-1">
          {companyName && (
            <h2 className="break-words font-bold text-slate-950!">{companyName}</h2>
          )}
          {jobTitle && (
            <h3 className="break-words text-base font-medium text-slate-500 sm:text-lg">{jobTitle}</h3>
          )}
          {!companyName && !jobTitle && (
            <h2 className="font-bold text-slate-950!">Resume</h2>
          )}
        </div>
        <div className="flex-shrink-0">
          <ScoreCircle score={score} />
        </div>
      </div>
      {resumeUrl && (
        <div className="gradient-border animate-in fade-in duration-1000">
          <div className="relative h-full w-full overflow-hidden rounded-xl bg-white">
            <img
              src={resumeUrl}
              alt="resume"
              className="h-[350px] w-full object-cover object-top max-sm:h-[240px]"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/30 to-transparent" />
          </div>
        </div>
      )}
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
        <p className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold capitalize text-slate-500">
          {applicationStatus}
        </p>
        <span className="text-sm font-black text-blue-700">Open Report</span>
      </div>
    </Link>
  );
};

export default ResumeCard;
