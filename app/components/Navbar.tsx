import { Link } from 'react-router'
import { usePuterStore } from '~/lib/puter'

const Navbar = () => {
  const { auth } = usePuterStore();

  return (
    <nav className='navbar'>
        <Link to="/">
        <p className='text-xl font-black text-gradient sm:text-2xl'>ResumeIQ</p>
        </Link>
        <div className="hidden min-w-0 flex-1 items-center justify-center px-4 md:flex">
          <div className="flex max-w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600">
            <span className="size-2 rounded-full bg-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.7)]" />
            <span className="truncate">
              Workspace: {auth.user?.username || "Signal Console"}
            </span>
          </div>
        </div>
        <Link to="/upload" className='primary-button w-fit px-4 py-2 sm:px-5'>
        Upload Resume</Link>

    </nav>
  )
}

export default Navbar
