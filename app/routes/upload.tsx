import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { prepareInstructions } from "~/constants";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const Upload = () => {
  const { fs, ai, kv } = usePuterStore();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (file: File | null) => {
    setFile(file);
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
    try {
      setIsProcessing(true);
      setStatusText("Uploading resume...");

      // 1️⃣ Upload PDF
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        throw new Error("Failed to upload resume file.");
      }

      // 2️⃣ Generate ID & Save Initial Data
      const uuid = generateUUID();

      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: null,
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // 3️⃣ AI Analysis
      setStatusText("Analyzing resume...");

      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({
          jobTitle,
          jobDescription,
        })
      );

      if (!feedback) {
        throw new Error("AI failed to analyze resume.");
      }

      const feedbackText =
        typeof feedback.message.content === "string"
          ? feedback.message.content
          : feedback.message.content[0].text;

      // Clean possible markdown formatting
      const cleanText = feedbackText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let parsedFeedback;

      try {
        parsedFeedback = JSON.parse(cleanText);
      } catch (error) {
        console.error("AI JSON Error:", cleanText);
        throw new Error("AI returned invalid JSON format.");
      }

      // 4️⃣ Save Feedback
      data.feedback = parsedFeedback;
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText("Analysis complete! Redirecting...");
      console.log(data);
    } catch (error: any) {
      console.error(error);
      setStatusText(error.message || "Something went wrong.");
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert("Please upload a resume file.");
      return;
    }

    const formData = new FormData(e.currentTarget);

    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    handleAnalyse({
      companyName,
      jobTitle,
      jobDescription,
      file,
    });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover min-h-screen">
      <Navbar />

      <section className="main-section">
        <div className="page-heading py-16">
          <h1>Smart feedback for your dream job</h1>

          {isProcessing ? (
            <>
              <h2 className="mt-4">{statusText}</h2>
              <img
                src="/images/resume-scan.gif"
                alt="Scanning Resume"
                className="w-full mt-6"
              />
            </>
          ) : (
            <h2 className="mt-4">
              Drop your resume for ATS Score and improvement tips
            </h2>
          )}

          {!isProcessing && (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  placeholder="Company Name"
                  id="company-name"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  name="job-title"
                  placeholder="Job Title"
                  id="job-title"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
                  placeholder="Job Description"
                  id="job-description"
                  required
                />
              </div>

              <div className="form-div">
                <label>Upload Resume (PDF)</label>
                <FileUploader onFileSelect={handleFileSelect} />
              </div>

              <button className="primary-button" type="submit">
                Analyse Resume
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default Upload;
