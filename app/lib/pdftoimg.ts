export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

export async function convertPdfToImage(
  file: File
): Promise<PdfConversionResult> {
  try {
    // ✅ Prevent SSR crash
    if (typeof window === "undefined") {
      return {
        imageUrl: "",
        file: null,
        error: "PDF conversion can only run in browser",
      };
    }

    // ✅ Dynamically import inside browser
    const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");
    const pdfWorker = await import(
      "pdfjs-dist/build/pdf.worker.min.mjs?url"
    );

    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker.default;

    const arrayBuffer = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: arrayBuffer,
    }).promise;

    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 3 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Canvas context not available",
      };
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve({
            imageUrl: "",
            file: null,
            error: "Failed to create image blob",
          });
          return;
        }

        const originalName = file.name.replace(/\.pdf$/i, "");
        const imageFile = new File([blob], `${originalName}.png`, {
          type: "image/png",
        });

        resolve({
          imageUrl: URL.createObjectURL(blob),
          file: imageFile,
        });
      }, "image/png");
    });
  } catch (err: any) {
    return {
      imageUrl: "",
      file: null,
      error: `Failed to convert PDF: ${err?.message || err}`,
    };
  }
}
