import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { prepareInstructions } from "~/constants";
import { convertPdfToImage } from "~/lib/pdftoimg";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const Upload = () => {
  const { auth, isLoading, fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Gate the page: wait for Puter to finish initializing, then require auth.
  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) {
      navigate("/auth?next=/upload");
    }
  }, [isLoading, auth.isAuthenticated]);

  const handleFileSelect = (selected: File | null) => {
    setFile(selected);
    if (selected) setError(null);
  };

  const handleAnalyse = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    let createdId: string | null = null;

    try {
      setError(null);
      setIsProcessing(true);

      setStatusText("Uploading resume...");
      const uploadedFile = await fs.upload([file]);

      if (!uploadedFile) {
        throw new Error("Failed to upload your resume. Please try again.");
      }

      const uuid = generateUUID();
      createdId = uuid;
      let imagePath = "";

      setStatusText("Converting resume preview...");
      try {
        const imageFile = await convertPdfToImage(file);

        if (imageFile?.file) {
          const uploadedImage = await fs.upload([imageFile.file]);
          imagePath = uploadedImage?.path || "";
        }
      } catch (conversionError) {
        // A failed preview shouldn't block the analysis — log and continue.
        console.error("Image conversion error:", conversionError);
      }

      const now = new Date().toISOString();
      const data: Resume = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath,
        companyName,
        jobTitle,
        jobDescription,
        status: "saved",
        createdAt: now,
        updatedAt: now,
        notes: "",
        feedback: null as unknown as Feedback,
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText("Analyzing resume with AI...");
      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({
          jobTitle,
          jobDescription,
        }),
      );

      if (!feedback) {
        throw new Error("The AI didn't return a result. Please try again.");
      }

      const content = feedback.message.content;
      const feedbackText =
        typeof content === "string" ? content : content?.[0]?.text;

      if (!feedbackText) {
        throw new Error("The AI returned an empty response. Please try again.");
      }

      const cleanText = feedbackText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsedFeedback: Feedback;

      try {
        parsedFeedback = JSON.parse(cleanText);
      } catch (parseError) {
        console.error("AI JSON Error:", cleanText);
        throw new Error(
          "The AI response couldn't be read. Please try analyzing again.",
        );
      }

      data.feedback = parsedFeedback;
      data.updatedAt = new Date().toISOString();
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText("Analysis complete. Opening report...");
      navigate(`/resume/${uuid}`);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Something went wrong. Please try again.");
      setStatusText("");
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      setError("Please attach a PDF resume before analyzing.");
      return;
    }

    handleAnalyse({
      companyName: companyName.trim(),
      jobTitle: jobTitle.trim(),
      jobDescription: jobDescription.trim(),
      file,
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f6f8fb]">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),radial-gradient(circle_at_10%_10%,rgba(37,99,235,0.16),transparent_28%),radial-gradient(circle_at_90%_0%,rgba(6,182,212,0.18),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)] bg-[size:44px_44px,44px_44px,100%_100%,100%_100%,100%_100%]" />
      <div className="relative z-10">
        <Navbar />

        <section className="mx-auto grid w-full max-w-[1400px] gap-8 px-4 pb-12 pt-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:px-12">
          <aside className="rounded-3xl border border-cyan-300/10 bg-[#0B1220] p-6 text-white shadow-[0_24px_90px_rgba(15,23,42,0.18)] lg:sticky lg:top-8 lg:h-fit">
            <div className="mb-6 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
            <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
              AI scan workflow
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-white sm:text-5xl">
              Build a stronger resume signal.
            </h1>
            <p className="mt-5 text-base leading-7 text-slate-400">
              Add the target role, attach your resume, and ResumeIQ will turn it
              into an ATS-aware improvement report.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                ["01", "Role context", "Company, title, and job requirements."],
                ["02", "Document scan", "PDF is converted into a review preview."],
                ["03", "AI analysis", "ATS, content, skills, and structure scoring."],
              ].map(([step, title, description]) => (
                <div
                  key={step}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-black text-cyan-200 ring-1 ring-cyan-300/20">
                      {step}
                    </span>
                    <div>
                      <p className="font-bold text-slate-100">{title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-[0_24px_90px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
            <div className="mb-8">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                New analysis
              </span>
              <h1 className="mt-4 text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
                Upload resume for AI review
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Match your resume against a real job description and get focused
                suggestions for ATS compatibility.
              </p>
            </div>

            {isProcessing ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center">
                <div className="mx-auto max-w-xl">
                  <img
                    src="/images/resume-scan.gif"
                    alt="Scanning Resume"
                    className="mx-auto w-full max-w-lg rounded-2xl"
                  />
                  <h2 className="mt-6 text-2xl font-black text-slate-950!">
                    {statusText}
                  </h2>
                  <div className="mt-5 grid gap-2 sm:grid-cols-3">
                    {["Upload", "Convert", "Analyze"].map((step) => (
                      <div
                        key={step}
                        className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-bold text-blue-700"
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm sm:p-6"
              >
                {error && (
                  <div
                    role="alert"
                    className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-rose-100 text-xs font-black text-rose-700">
                      !
                    </span>
                    <p>{error}</p>
                  </div>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="form-div">
                    <label htmlFor="company-name">Company Name</label>
                    <input
                      type="text"
                      name="company-name"
                      id="company-name"
                      placeholder="Acme Inc."
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      required
                    />
                  </div>

                  <div className="form-div">
                    <label htmlFor="job-title">Job Title</label>
                    <input
                      type="text"
                      name="job-title"
                      id="job-title"
                      placeholder="Frontend Developer"
                      value={jobTitle}
                      onChange={(event) => setJobTitle(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-div">
                  <label htmlFor="job-description">Job Description</label>
                  <textarea
                    rows={7}
                    name="job-description"
                    id="job-description"
                    placeholder="Paste the role requirements here..."
                    value={jobDescription}
                    onChange={(event) => setJobDescription(event.target.value)}
                    required
                  />
                </div>

                <div className="form-div">
                  <label>Upload Resume (PDF)</label>
                  <FileUploader onFileSelect={handleFileSelect} />
                </div>

                <button
                  className="primary-button disabled:cursor-not-allowed disabled:opacity-60"
                  type="submit"
                  disabled={!file}
                >
                  Analyze Resume
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
};

export default Upload;