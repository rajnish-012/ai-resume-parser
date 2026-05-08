import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";

interface FileUploaderProps {
  onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0] || null;

      onFileSelect?.(file);
    },
    [onFileSelect],
  );

  const maxFileSize = 20 * 1024 * 1024;
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      multiple: false,
      accept: { "application/pdf": [".pdf"] },
      maxSize: maxFileSize,
    });

  const file = acceptedFiles[0] || null;

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div
          className={`cursor-pointer rounded-xl border border-dashed p-6 text-center transition ${
            isDragActive
              ? "border-cyan-400 bg-cyan-50"
              : "border-slate-300 bg-white hover:border-cyan-300 hover:bg-sky-50"
          }`}
        >
          {file ? (
            <div
              className="uploader-selected-file"
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/images/pdf.png" alt="pdf" className="size-10" />
              <div className="flex min-w-0 items-center space-x-3">
                <div className="min-w-0">
                  <p className="max-w-xs truncate text-sm font-semibold text-slate-800">
                    {file.name}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatSize(file.size)}
                  </p>
                </div>
              </div>
              <button className="cursor-pointer rounded-full p-2 transition hover:bg-slate-100" onClick={(e) => {
                e.stopPropagation();
                onFileSelect?.(null);
              }}>
                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div>
              <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
                <img src="/icons/info.svg" alt="Upload" className="size-20" />
              </div>
              <p className="text-base text-slate-600 sm:text-lg">
                <span className="font-semibold text-slate-900">Click to upload</span> or drag
                and drop
              </p>
              <p className="text-sm text-slate-500 sm:text-base">
                PDF (max {formatSize(maxFileSize)})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
