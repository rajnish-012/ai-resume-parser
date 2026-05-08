import ScoreGuage from "./ScoreGuage";
import ScoreBadge from "./ScoreBadge";

const Category = ({ title, score }: { title: string; score: number }) => {
  const textColor =
    score > 70
      ? "text-green-600"
      : score > 49
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="resume-summary">
      <div className="category">
        <div className="flex flex-row items-center justify-center gap-2">
          <p className="text-base font-bold text-slate-800 sm:text-lg">{title}</p>
          <ScoreBadge score = {score} />
        </div>
        <p className="text-lg font-black text-slate-500">
          <span className={textColor}>{score} </span>/100
        </p>
      </div>
    </div>
  );
};

const Summary = ({ feedback }: { feedback: Feedback }) => {
  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex flex-col gap-5 border-b border-slate-100 p-2 pb-5 sm:flex-row sm:items-center sm:p-4">
        <ScoreGuage score={feedback.overallScore} />

        <div className="flex flex-col gap-2">
          <p className="text-sm font-black uppercase tracking-wide text-blue-700">
            Overall signal
          </p>
          <h2 className="text-2xl font-black text-slate-950!">
            Resume Score
          </h2>
          <p className="text-sm leading-6 text-slate-500">
            Weighted from ATS fit, content quality, structure, tone, and skills
            alignment.
          </p>
        </div>
      </div>

      <Category title="Tone & Style" score={feedback.toneAndStyle.score} />
      <Category title="Content" score={feedback.content.score} />
      <Category title="Structure" score={feedback.structure.score} />
      <Category title="Skills" score={feedback.skills.score} />
    </div>
  );
};

export default Summary;
