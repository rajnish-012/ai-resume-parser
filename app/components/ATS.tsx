import type { FC } from 'react'

interface Suggestion {
  type: "good" | "improve";
  tip: string;
}

interface ATSProps {
  score: number;
  suggestions: Suggestion[];
}

const ATS: FC<ATSProps> = ({ score, suggestions }) => {
  const gradientClass = score > 69
    ? 'from-emerald-50'
    : score > 49
      ? 'from-amber-50'
      : 'from-rose-50';

  const iconSrc = score > 69
    ? '/icons/ats-good.svg'
    : score > 49
      ? '/icons/ats-warning.svg'
      : '/icons/ats-bad.svg';

  const subtitle = score > 69
    ? 'Strong ATS compatibility'
    : score > 49
      ? 'Good foundation'
      : 'Priority fixes needed';

  return (
    <div className={`w-full rounded-3xl border border-slate-200 bg-gradient-to-b ${gradientClass} to-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]`}>
      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-2xl border border-white bg-white p-3 shadow-sm">
          <img src={iconSrc} alt="ATS Score Icon" className="size-12" />
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Applicant tracking system
          </p>
          <h2 className="text-2xl font-black text-slate-950!">
            ATS Score - {score}/100
          </h2>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="mb-2 text-xl font-black text-slate-900">{subtitle}</h3>
        <p className="mb-5 text-sm leading-6 text-slate-600">
          This score represents how well your resume is likely to perform in Applicant Tracking Systems used by employers.
        </p>

        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-start gap-3 rounded-2xl border border-white bg-white/80 p-3 shadow-sm">
              <img
                src={suggestion.type === "good" ? "/icons/check.svg" : "/icons/warning.svg"}
                alt={suggestion.type === "good" ? "Check" : "Warning"}
                className="mt-0.5 size-5"
              />
              <p className={suggestion.type === "good" ? "text-sm font-semibold text-emerald-700" : "text-sm font-semibold text-amber-700"}>
                {suggestion.tip}
              </p>
            </div>
          ))}
        </div>
      </div>

      <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
        Keep refining your resume to improve your chances of getting past ATS filters and into the hands of recruiters.
      </p>
    </div>
  )
}

export default ATS
