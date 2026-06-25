'use client';
import React from 'react';
import Modal from '@/components/ui/Modal';
import { useAppStore } from '@/lib/store';
import { Settings, Users, Globe, Shield, Bell, Code } from 'lucide-react';

const SETTINGS_SECTIONS = [
  { icon: Settings, label: 'General', coming: false },
  { icon: Users, label: 'Team & Workspaces', coming: true },
  { icon: Globe, label: 'Proxy', coming: true },
  { icon: Shield, label: 'Certificates', coming: true },
  { icon: Bell, label: 'Notifications', coming: true },
  { icon: Code, label: 'Code Generation', coming: true },
];

export default function SettingsModal() {
  const { closeModal, settings, updateSettings } = useAppStore();
  const [active, setActive] = React.useState('General');

  return (
    <Modal title="Settings" onClose={closeModal} width="w-[620px]">
      <div className="flex h-[420px]">
        <div className="w-[180px] border-r border-[#2a2a2a] py-2">
          {SETTINGS_SECTIONS.map(s => (
            <button
              key={s.label}
              onClick={() => setActive(s.label)}
              className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-xs transition-colors ${active === s.label ? 'bg-[#2a2a2a] text-orange-400' : 'text-[#8b8b8b] hover:text-[#d4d4d4] hover:bg-[#1f1f1f]'}`}
            >
              <s.icon size={13} />
              {s.label}
              {s.coming && <span className="ml-auto text-[9px] text-[#4a4a4a] bg-[#2a2a2a] px-1.5 py-0.5 rounded">Soon</span>}
            </button>
          ))}
        </div>
        <div className="flex-1 p-5 overflow-y-auto">
          {active === 'General' ? (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-medium text-[#d4d4d4] mb-3">Request</h3>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#8b8b8b]">Follow redirects</span>
                    <button
                      onClick={() => updateSettings({ followRedirects: !settings.followRedirects })}
                      className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${settings.followRedirects ? 'bg-orange-500' : 'bg-[#3a3a3a]'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${settings.followRedirects ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#8b8b8b]">Send cookies</span>
                    <button
                      onClick={() => updateSettings({ sendCookies: !settings.sendCookies })}
                      className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${settings.sendCookies ? 'bg-orange-500' : 'bg-[#3a3a3a]'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${settings.sendCookies ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#8b8b8b]">SSL certificate verification</span>
                    <button
                      onClick={() => updateSettings({ sslVerification: !settings.sslVerification })}
                      className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${settings.sslVerification ? 'bg-orange-500' : 'bg-[#3a3a3a]'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${settings.sslVerification ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </label>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#d4d4d4] mb-3">Timeout</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.timeout}
                    onChange={e => updateSettings({ timeout: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-[#252525] border border-[#3a3a3a] rounded px-2 py-1.5 text-xs text-[#d4d4d4] outline-none focus:border-orange-500/50"
                  />
                  <span className="text-xs text-[#6b6b6b]">ms (0 = no timeout)</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#d4d4d4] mb-3">Application</h3>
                <div className="flex flex-col gap-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-[#8b8b8b]">Dark theme</span>
                    <button
                      onClick={() => updateSettings({ darkTheme: !settings.darkTheme })}
                      className={`w-8 h-4 rounded-full relative transition-colors duration-200 focus:outline-none ${settings.darkTheme ? 'bg-orange-500' : 'bg-[#3a3a3a]'}`}
                    >
                      <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-200 ${settings.darkTheme ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#4a4a4a]">
              <div className="text-4xl">🚧</div>
              <div className="text-sm font-medium text-[#6b6b6b]">Coming Soon</div>
              <div className="text-xs text-center max-w-xs">
                {active} settings will be available in a future update.
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
