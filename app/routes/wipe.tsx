import { useEffect, useState } from "react";
import Navbar from "~/components/Navbar";
import { useNavigate } from "react-router";
import { usePuterStore } from "~/lib/puter";

const WipeApp = () => {
    const { auth, isLoading, error, fs, kv } = usePuterStore();
    const navigate = useNavigate();
    const [files, setFiles] = useState<FSItem[]>([]);

    const loadFiles = async () => {
        const files = (await fs.readDir("./")) as FSItem[];
        setFiles(files);
    };

    useEffect(() => {
        loadFiles();
    }, []);

    useEffect(() => {
        if (!isLoading && !auth.isAuthenticated) {
            navigate("/auth?next=/wipe");
        }
    }, [isLoading]);

    const handleDelete = async () => {
        files.forEach(async (file) => {
            await fs.delete(file.path);
        });
        await kv.flush();
        loadFiles();
    };

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-slate-600 shadow-lg">
                    Loading...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
                <div className="max-w-xl rounded-2xl border border-red-200 bg-red-50 px-8 py-6 text-red-700 shadow-lg">
                    Error {error}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#f6f8fb]">
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),radial-gradient(circle_at_12%_10%,rgba(37,99,235,0.14),transparent_28%),radial-gradient(circle_at_95%_0%,rgba(6,182,212,0.16),transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)] bg-[size:44px_44px,44px_44px,100%_100%,100%_100%,100%_100%]" />
            <div className="relative z-10">
            <Navbar />
            <section className="main-section">
                <div className="w-full max-w-3xl rounded-3xl border border-white/80 bg-white/90 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)] backdrop-blur sm:p-8">
                    <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
                        <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                            Admin utility
                        </p>
                        <h1 className="text-4xl font-black text-slate-950">Wipe App Data</h1>
                        <p className="text-slate-600">
                            Authenticated as{" "}
                            <span className="font-semibold text-slate-900">
                                {auth.user?.username}
                            </span>
                        </p>
                    </div>

                    <div className="mt-6">
                        <div className="mb-3 flex items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-950!">
                                Existing files
                            </h2>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                                {files.length} item{files.length === 1 ? "" : "s"}
                            </span>
                        </div>

                        <div className="flex max-h-[340px] flex-col gap-3 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
                            {files.length > 0 ? (
                                files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex flex-row items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
                                    >
                                        <p className="truncate font-medium">{file.name}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="px-4 py-8 text-center text-slate-500">
                                    No files found.
                                </p>
                            )}
                        </div>
                    </div>

                    <button
                        className="mt-6 inline-flex w-full cursor-pointer items-center justify-center rounded-full bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
                        onClick={() => handleDelete()}
                    >
                        Wipe App Data
                    </button>
                </div>
            </section>
            </div>
        </main>
    );
};

export default WipeApp;
