import React, { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { prepareInstructions } from "~/constants";
import { convertPdfToImage } from "~/lib/pdftoimg";
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

      // 1️⃣ Upload PDF
      setStatusText("Uploading resume...");
      const uploadedFile = await fs.upload([file]);

      if (!uploadedFile) {
        throw new Error("Failed to upload resume file.");
      }

      const uuid = generateUUID();

      let imagePath: string | null = null;
      setStatusText('Converting resume pdf to image...');

      // 2️⃣ SAFE PDF → IMAGE CONVERSION (Non-blocking)
      try {
        const imageFile = await convertPdfToImage(file);
        console.log("ImageFile:", imageFile);

        if (imageFile?.file) {
          const uploadedImage = await fs.upload([imageFile.file]);
          imagePath = uploadedImage?.path || null;
        }
      } catch (error) {
        console.error("Image conversion error:", error);
      }

      // 3️⃣ Save initial data
      const data: any = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath,
        companyName,
        jobTitle,
        jobDescription,
        feedback: null,
      };

      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      // 4️⃣ AI Analysis
      setStatusText("Analyzing resume with AI...");
      setStatusText("It can take upto 15 sec.")

      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({
          jobTitle,
          jobDescription,
        }),
      );

      if (!feedback) {
        throw new Error("AI failed to analyze resume.");
      }

      const feedbackText =
        typeof feedback.message.content === "string"
          ? feedback.message.content
          : feedback.message.content[0].text;

      // Clean markdown formatting
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

      // 5️⃣ Attach feedback
      data.feedback = parsedFeedback;
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText("Analysis complete! Redirecting...");
      console.log(data);

      // 6️⃣ Correct redirect
      navigate(`/resume/${uuid}`);
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
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  name="company-name"
                  id="company-name"
                  required
                />
              </div>

              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input type="text" name="job-title" id="job-title" required />
              </div>

              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  name="job-description"
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
