import React from 'react';
import { useApp } from '../context/AppContext';
import { Menu, ShieldCheck } from 'lucide-react';

export const Header: React.FC = () => {
  const { data, toggleSidebar, navigateTo, currentRoute, isAdminLoggedIn } = useApp();
  const { announcement } = data;
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = React.useState<number>(25);

  // 恆定物理速度演算法：確保無論文字多長，移動速度均維持恆定舒適慢速閱讀感 (35px/s)
  React.useEffect(() => {
    if (!marqueeRef.current) return;
    const calculateConstantSpeed = () => {
      if (marqueeRef.current) {
        const width = marqueeRef.current.scrollWidth;
        const CONSTANT_SPEED_PX_PER_SEC = 35;
        const duration = Math.max(8, width / CONSTANT_SPEED_PX_PER_SEC);
        setAnimationDuration(duration);
      }
    };

    calculateConstantSpeed();
    const resizeObserver = new ResizeObserver(calculateConstantSpeed);
    resizeObserver.observe(marqueeRef.current);
    return () => resizeObserver.disconnect();
  }, [announcement.text]);

  const navLinks = [
    { key: 'home', label: '首頁' },
    { key: 'activities', label: '賽事簡介' },
    { key: 'schedule', label: '賽程表' },
    { key: 'honor', label: '榮譽榜' },
    { key: 'interviews', label: '採訪' },
    { key: 'booths', label: '各班攤位' },
    { key: 'albums', label: '相簿' },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-[#fbf9f2]/95 backdrop-blur-md border-b border-[#e5decb] transition-colors">
      {/* 頂部即時公告列 (Midnight Navy #09013d + Vanilla Cream #fbf3c9 + Ice Aqua #cff0eb) */}
      {announcement.enabled && (
        <div className="bg-[#09013d] text-[#fbf3c9] text-xs py-2 px-3 sm:px-6 flex items-center overflow-hidden border-b border-[#04001a]">
          <div className="flex items-center gap-1.5 shrink-0 mr-3 z-10 bg-[#09013d] pr-2.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#325291] text-[#fbf3c9] text-[10px] uppercase tracking-wider font-semibold shadow-2xs">
              即時公告
            </span>
          </div>
          <div className="overflow-hidden relative w-full flex items-center">
            <div
              className="animate-marquee-infinite text-[#fbf9f2] whitespace-nowrap font-normal text-xs flex items-center"
              style={{ animationDuration: `${animationDuration}s` }}
            >
              <div ref={marqueeRef} className="flex items-center shrink-0 gap-8 pr-8">
                <span>{announcement.text}</span>
                <span aria-hidden="true" className="text-[#cff0eb]">✦</span>
                <span>{announcement.text}</span>
                <span aria-hidden="true" className="text-[#cff0eb]">✦</span>
              </div>
              <div className="flex items-center shrink-0 gap-8 pr-8" aria-hidden="true">
                <span>{announcement.text}</span>
                <span aria-hidden="true" className="text-[#cff0eb]">✦</span>
                <span>{announcement.text}</span>
                <span aria-hidden="true" className="text-[#cff0eb]">✦</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主標題列 (Three-Zone Top Bar Contract) */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 text-left group transition-all select-none">
          <div
            onClick={() => navigateTo('home')}
            title="雄女校徽"
            className="w-9 h-9 rounded-full bg-[#325291] text-white border border-[#263e6e] flex items-center justify-center font-bold text-xs tracking-wider shadow-2xs group-hover:bg-[#09013d] transition-colors cursor-pointer active:scale-95"
          >
            KG
          </div>
          <button
            onClick={() => navigateTo('home')}
            className="flex flex-col text-left cursor-pointer"
          >
            <span className="text-base sm:text-lg font-semibold tracking-tight text-[#09013d] group-hover:text-[#325291] transition-colors whitespace-nowrap">
              102th 雄女校慶
            </span>
            <span className="text-[11px] text-[#73685e] tracking-wider -mt-0.5 font-normal hidden xs:inline">
              運動會 & 園遊會
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-7 text-xs sm:text-sm font-medium text-[#5e544c]">
          {navLinks.map((link) => {
            const isActive = currentRoute === link.key;
            return (
              <button
                key={link.key}
                onClick={() => navigateTo(link.key)}
                className={`transition-colors whitespace-nowrap py-1 relative cursor-pointer ${
                  isActive
                    ? 'text-[#09013d] font-bold'
                    : 'text-[#5e544c] hover:text-[#325291]'
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#325291] rounded-full shadow-xs" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5">
          {isAdminLoggedIn && (
            <button
              onClick={() => navigateTo('admin')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-[#09013d] bg-[#fbf3c9] hover:bg-[#faeeb4] border border-[#edd995] rounded-full transition-colors whitespace-nowrap cursor-pointer shadow-2xs font-semibold"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#325291]" />
              <span>管理後台</span>
            </button>
          )}

          {/* 側邊欄抽屜觸發按鈕 */}
          <button
            onClick={toggleSidebar}
            aria-label="開啟選單"
            className="w-10 h-10 rounded-full flex items-center justify-center text-[#342d27] hover:text-[#09013d] hover:bg-[#cff0eb]/40 active:scale-95 transition-all cursor-pointer border border-transparent hover:border-[#b4ded8]"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
