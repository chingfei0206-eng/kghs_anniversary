import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronDown,
  ChevronUp,
  Flame,
  Calendar,
  Trophy,
  Newspaper,
  Image as ImageIcon,
  Store,
  ArrowRight
} from 'lucide-react';
import { PageHero } from '../components/PageHero';

export const HomePage: React.FC = () => {
  const { data, navigateTo, boothMapImage } = useApp();
  const { buttonImages } = data;

  // Accordion 展開狀態
  const [isSportsOpen, setIsSportsOpen] = useState(true);
  const [isFairOpen, setIsFairOpen] = useState(true);

  const sportsCards = [
    {
      key: 'activities',
      title: '賽事活動簡介',
      desc: '田徑、拔河與趣味競賽詳情',
      icon: Flame,
      route: 'activities'
    },
    {
      key: 'schedule',
      title: '賽程',
      desc: '運動會與檢錄精準時間表',
      icon: Calendar,
      route: 'schedule'
    },
    {
      key: 'honor',
      title: '榮譽榜',
      desc: '各項決賽成績與得獎名單',
      icon: Trophy,
      route: 'honor'
    },
    {
      key: 'interviews',
      title: '採訪',
      desc: '選手專訪與班級熱血心路',
      icon: Newspaper,
      route: 'interviews'
    },
    {
      key: 'albums',
      title: '相簿',
      desc: '雲端高畫質相片連結回顧',
      icon: ImageIcon,
      route: 'albums'
    }
  ];

  return (
    <div className="space-y-0 animate-in fade-in duration-300 w-full">
      {/* 英雄旗艦視覺 (Hero Showcase - 直角、貼齊邊緣與零空隙) */}
      <PageHero
        title="102th 雄女校慶"
        showBack={false}
        className="rounded-none m-0 border-x-0 border-t-0 border-b border-[#325291]/35 shadow-none"
      />

      {/* 
        專區 1: 11/6 運動會 (直角、無邊緣空隙)
      */}
      <section className="bg-white rounded-none border-b border-[#e5decb] border-t-0 border-x-0 shadow-none overflow-hidden transition-all w-full">
        {/* 區塊標題列 (Accordion Header) */}
        <button
          onClick={() => setIsSportsOpen(prev => !prev)}
          className="w-full text-left hover:bg-[#fbf9f2] transition-colors cursor-pointer rounded-none"
        >
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-full bg-[#cff0eb] text-[#325291] flex items-center justify-center border border-[#bce4de] shadow-2xs shrink-0">
                <Flame className="w-5 h-5 text-[#325291]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#325291] font-bold block truncate">
                  Sports Day · 2026.11.06
                </span>
                <span className="text-base sm:text-xl font-bold text-[#09013d] tracking-tight truncate block">
                  11/6 運動會專區
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#fbf3c9] hover:bg-[#f6ecb3] flex items-center justify-center text-[#09013d] transition-colors shrink-0">
              {isSportsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {/* 摺疊內容 (5 大功能卡片) */}
        {isSportsOpen && (
          <div className="border-t border-[#e5decb]/70 animate-in fade-in duration-200">
            <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 pt-4 sm:pt-5">
                {sportsCards.map((card) => {
                  const Icon = card.icon;
                  const hasCustomImg = Boolean(buttonImages?.[card.key]);

                  return (
                    <button
                      key={card.key}
                      onClick={() => navigateTo(card.route)}
                      className="group relative flex flex-col items-center justify-center aspect-square rounded-2xl border border-[#e5decb] bg-[#fbf9f2] hover:bg-white hover:border-[#325291]/50 hover:shadow-xs transition-all duration-300 overflow-hidden p-3 text-center cursor-pointer select-none"
                    >
                      {hasCustomImg ? (
                        <>
                          <img
                            src={buttonImages![card.key]}
                            alt={card.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#09013d]/90 via-[#09013d]/30 to-transparent flex items-end justify-center p-2.5 sm:p-3">
                            <span className="text-[#fbf3c9] font-semibold text-xs sm:text-sm drop-shadow-sm">
                              {card.title}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 sm:space-y-2.5 w-full">
                          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#fbf3c9] text-[#325291] flex items-center justify-center border border-[#edd995] group-hover:bg-[#325291] group-hover:text-[#fbf3c9] group-hover:border-[#325291] transition-all shadow-2xs">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="w-full px-1">
                            <div className="font-bold text-xs sm:text-sm text-[#09013d] group-hover:text-[#325291] transition-colors leading-snug">
                              {card.title}
                            </div>
                            <div className="text-[10px] text-[#73685e] mt-0.5 line-clamp-1 hidden sm:block">
                              {card.desc}
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 
        專區 2: 11/7 園遊會 (直角、無邊緣空隙)
      */}
      <section className="bg-white rounded-none border-b-0 border-t-0 border-x-0 shadow-none overflow-hidden transition-all w-full">
        {/* 區塊標題列 (Accordion Header) */}
        <button
          onClick={() => setIsFairOpen(prev => !prev)}
          className="w-full text-left hover:bg-[#fbf9f2] transition-colors cursor-pointer rounded-none"
        >
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 pr-2">
              <div className="w-10 h-10 rounded-full bg-[#fbf3c9] text-[#325291] flex items-center justify-center border border-[#edd995] shadow-2xs shrink-0">
                <Store className="w-5 h-5 text-[#325291]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#325291] font-bold block truncate">
                  Fair & Stalls · 2026.11.07
                </span>
                <span className="text-base sm:text-xl font-bold text-[#09013d] tracking-tight truncate block">
                  11/7 園遊會專區
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#cff0eb] hover:bg-[#bce6df] flex items-center justify-center text-[#09013d] transition-colors shrink-0">
              {isFairOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </button>

        {/* 摺疊內容 (攤位分布圖預覽區塊 + 各班攤位入口) */}
        {isFairOpen && (
          <div className="border-t border-[#e5decb]/70 animate-in fade-in duration-200">
            <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 pt-0 space-y-5 sm:space-y-6">
              {/* 攤位分布圖預覽區塊 */}
              <div className="pt-4 sm:pt-5 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[#09013d] flex items-center min-w-0 truncate">
                    <span className="truncate">園遊會校園攤位分布地圖</span>
                  </span>
                </div>

                {/* 地圖大圖卡片 (直角 rounded-none，純瀏覽無放大檢視) */}
                <div className="relative overflow-hidden rounded-none border border-[#e5decb] bg-[#fbf3c9]/30 aspect-16/9 sm:aspect-21/9 max-h-[360px]">
                  <img
                    src={boothMapImage}
                    alt="園遊會攤位分布圖"
                    className="w-full h-full object-cover object-center rounded-none select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* 各班攤位一覽入口卡片 (圓角 rounded-2xl) */}
              <div className="pt-1 pb-2">
                <div
                  onClick={() => navigateTo('booths')}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 sm:p-6 rounded-2xl border border-[#e5decb] bg-[#fbf9f2] hover:bg-white hover:border-[#325291]/50 hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#cff0eb] text-[#325291] border border-[#bce4de] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-[#325291] group-hover:text-[#fbf3c9] transition-all">
                      <Store className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-bold text-[#09013d] group-hover:text-[#325291] transition-colors leading-snug">
                        各班攤位一覽（傳單海報與品項分類）
                      </h3>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('booths');
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#09013d] group-hover:bg-[#325291] text-[#fbf3c9] text-xs sm:text-sm font-semibold rounded-full shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-[#325291]/40"
                    >
                      <span>立即瀏覽各班攤位</span>
                      <ArrowRight className="w-4 h-4 text-[#cff0eb] group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
