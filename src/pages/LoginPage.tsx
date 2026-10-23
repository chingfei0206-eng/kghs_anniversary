import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, KeyRound, ShieldAlert, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { PageHero } from '../components/PageHero';

export const LoginPage: React.FC = () => {
  const { login, navigateTo, isAdminLoggedIn, hasCustomPassword, defaultAdminPassword } = useApp();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const success = await login(password);
      if (success) {
        setError(false);
      } else {
        setError(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 標題與視覺 */}
      <PageHero
        title="管理者登入"
        subtitle="102th 雄女校慶 管理者後台身份驗證"
      />

      <div className="w-full bg-white rounded-3xl border border-[#e5decb] shadow-xs p-6 sm:p-12">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#cff0eb] text-[#325291] border border-[#bce4de] mx-auto flex items-center justify-center shadow-2xs">
              <Lock className="w-5 h-5 text-[#325291]" />
            </div>
            <h2 className="text-lg font-bold text-[#09013d]">
              管理員專區登入
            </h2>
            <p className="text-xs text-[#73685e] leading-relaxed">
              請輸入管理員密碼以啟用賽事、賽程、榮譽榜、採訪與攤位內容編輯維護
            </p>
          </div>

          {isAdminLoggedIn ? (
            <div className="p-6 bg-[#fbf3c9]/60 border border-[#edd995] rounded-2xl text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#09013d] text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#325291]" />
                <span>您目前已具有管理員權限</span>
              </div>
              <button
                onClick={() => navigateTo('admin')}
                className="w-full py-2.5 px-4 bg-[#09013d] hover:bg-[#1a1254] text-[#fbf3c9] font-bold text-xs sm:text-sm rounded-full shadow-xs transition-colors cursor-pointer border border-[#325291]/40"
              >
                進入後台控制面板
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#09013d]">
                    管理員密碼 (Admin Password)
                  </label>
                  {hasCustomPassword && (
                    <span className="text-[10px] text-[#325291] bg-[#cff0eb]/50 px-2 py-0.5 rounded-full font-medium">
                      已啟用自訂密碼
                    </span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#325291] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(false);
                    }}
                    placeholder={hasCustomPassword ? '請輸入管理員自訂密碼' : `請輸入管理員密碼 (預設: ${defaultAdminPassword})`}
                    className="w-full pl-10 pr-10 py-2.5 bg-[#fbf9f2] border border-[#e5decb] rounded-full text-sm text-[#09013d] placeholder-[#9c9387] focus:outline-none focus:border-[#325291] transition-colors"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#73685e] hover:text-[#09013d] transition-colors cursor-pointer"
                    title={showPassword ? '隱藏密碼' : '顯示密碼'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-[#fbeeed] border border-[#ebd0ce] rounded-xl text-[#843229] text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#843229] shrink-0" />
                  <span>
                    {hasCustomPassword
                      ? '密碼錯誤，請確認您先前自訂的管理員密碼。'
                      : `密碼錯誤，請確認系統預設管理員密碼 (${defaultAdminPassword})。`}
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-[#09013d] hover:bg-[#1a1254] disabled:opacity-70 text-[#fbf3c9] font-bold text-sm rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 border border-[#325291]/40"
              >
                <Lock className="w-4 h-4 text-[#cff0eb]" />
                <span>{isSubmitting ? '驗證 Session Token 中...' : '驗證並登入後台'}</span>
              </button>
            </form>
          )}

          <div className="pt-2 border-t border-[#e5decb]/60 flex items-center justify-between text-xs text-[#73685e]">
            <button
              onClick={() => navigateTo('home')}
              className="hover:text-[#09013d] inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>返回前台首頁</span>
            </button>
            <span className="text-[11px] font-mono text-[#325291]">
              {hasCustomPassword ? '（已設定自訂密碼）' : `預設密碼: ${defaultAdminPassword}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
