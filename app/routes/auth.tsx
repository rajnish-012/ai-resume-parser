export const meta = () => ([
  { title: 'ResumeIQ | Auth' },
  { name: 'description', content: 'Log into your account' },
]);

import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { usePuterStore } from '~/lib/puter';

const Auth = () => {
  const { isLoading, auth } = usePuterStore();
  const location = useLocation();
  const next = location.search.split('next=')[1];
  const navigate = useNavigate();

  useEffect(()=>{
    if(auth.isAuthenticated) navigate(next);
  }, [auth.isAuthenticated , next])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f8fb] px-4">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px),radial-gradient(circle_at_18%_10%,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_82%_0%,rgba(6,182,212,0.18),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)] bg-[size:44px_44px,44px_44px,100%_100%,100%_100%,100%_100%]" />
      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="hidden rounded-3xl border border-cyan-300/10 bg-[#0B1220] p-8 text-white shadow-[0_24px_90px_rgba(15,23,42,0.20)] lg:block">
          <div className="mb-8 h-1 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400" />
          <p className="text-sm font-bold uppercase tracking-wide text-cyan-300">
            ResumeIQ Signal Console
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-white">
            Your resume intelligence workspace.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-400">
            Sign in to sync reports, generate ATS scoring, and keep your
            application signals organized.
          </p>
          <div className="mt-8 grid gap-3">
            {["Secure cloud workspace", "AI screening reports", "Resume improvement pipeline"].map((item, index) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-black text-cyan-200 ring-1 ring-cyan-300/20">
                  {index + 1}
                </span>
                <span className="text-sm font-semibold text-slate-200">{item}</span>
              </div>
            ))}
          </div>
        </aside>

        <div className="gradient-border w-full">
          <section className="flex flex-col gap-8 rounded-2xl bg-white p-8 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-10">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
                Workspace access
              </span>
              <h1 className="text-4xl font-black text-slate-950 sm:text-5xl">
                Welcome back
              </h1>
              <h2 className="max-w-lg text-base text-slate-600 sm:text-lg">
                Log in to continue analyzing resumes and tracking your hiring
                signals.
              </h2>
            </div>

            <div>
              {isLoading ? (
                <button className="auth-button animate-pulse">
                  <p>Signing you in...</p>
                </button>
              ) : (
                <>
                  {auth.isAuthenticated ? (
                      <button className='auth-button' onClick={auth.signOut}>
                          <p>Logout</p>
                      </button>
                  ):(
                      <button className='auth-button' onClick={auth.signIn}>
                          <p>Log In</p>
                      </button>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-500">
              Reports, files, and scoring history stay attached to your
              authenticated workspace.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Auth;
