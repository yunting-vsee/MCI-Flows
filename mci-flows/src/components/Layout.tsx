import { Link, Outlet, useLocation } from 'react-router-dom';
import { Bell, MessageSquare, User, MapPin, Plus, Search, Zap } from 'lucide-react';

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#EAEAEA]">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between bg-white border-b-8 border-[#155098] h-[72px] px-4 sticky top-0 z-[100]">
        {/* Left: Logo + New Patient + Patient Search */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end justify-center px-4 py-2 min-w-[170px]">
            <div className="text-2xl font-bold text-white px-[10px] py-[2px] rounded-[3px] tracking-[2px] flex items-center gap-[6px]">
                          <img src="data:image/png;base64,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" />            </div>
            <div className="flex items-center gap-1 text-sm text-black mt-[2px]">
              <MapPin className="w-3 h-3 text-[#767676]" />
              <span>SITE1</span>
              <span className="tag tag--mci">MCI</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="btn btn--primary flex items-center gap-1.5 h-10 px-5 rounded-md font-bold text-sm bg-[#1C63A9] text-white">
              <Plus className="w-4 h-4" /> New Patient
            </button>
            <button className="btn btn--secondary flex items-center gap-1.5 h-10 px-5 rounded-md font-bold text-sm bg-white border border-[#BBBBBB] text-[#1F1F1F]">
              <Search className="w-4 h-4" /> Patient Search
            </button>
            <button className="btn btn--mci btn--sm h-8 w-8 p-0 flex items-center justify-center rounded-md bg-[#F0E7FF] text-[#492781] border border-[#492781]" title="Rapid Actions">
              <Zap className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CENTER: Navigation links */}
        <div className="flex items-center gap-5 text-base">
          <Link to="/" className={`${location.pathname === '/' ? 'text-[#1F6AB0] font-bold' : 'text-[#888888]'} whitespace-nowrap hover:text-[#1F6AB0]`}>
            Tracking Board
          </Link>
          <span className="text-[#888888] whitespace-nowrap cursor-not-allowed">Site Dashboard</span>
          <span className="text-[#888888] whitespace-nowrap cursor-not-allowed">Telemedicine</span>
          <span className="text-[#888888] whitespace-nowrap cursor-not-allowed">Pharmacy</span>
          <span className="text-[#888888] whitespace-nowrap cursor-not-allowed">Resources</span>
        </div>

        {/* RIGHT: Notification icons + avatar */}
        <div className="flex items-center gap-4">
          <button className="text-[#888888] hover:text-[#1F6AB0] p-1">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-[#888888] hover:text-[#1F6AB0] p-1">
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-full bg-[#E3E5E8] flex items-center justify-center text-[#767676] overflow-hidden cursor-pointer">
            <User className="w-4 h-4" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
