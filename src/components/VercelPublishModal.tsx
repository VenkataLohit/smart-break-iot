import React, { useState } from 'react';
import {
  X,
  Globe,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  GitBranch,
  Layers,
  FileCode,
  Download,
  Sparkles
} from 'lucide-react';

interface VercelPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelPublishModal: React.FC<VercelPublishModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cli' | 'git' | 'config'>('git');

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const vercelJsonContent = `{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#070b16] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] text-slate-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-800 bg-[#090e1d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-white shadow-lg">
              {/* Vercel Icon Triangle */}
              <svg className="w-5 h-5 fill-current" viewBox="0 0 76 65" fill="none">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-tech font-bold text-white tracking-wide">
                  Publish & Deploy to Vercel
                </h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono-code bg-emerald-950/80 border border-emerald-500/60 text-emerald-400 font-semibold">
                  READY TO DEPLOY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Deploy your Auto Brake IoT Digital Twin to Vercel with high-speed global CDN and instant live URL.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Readiness Checklist Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 py-3 bg-[#050811] border-b border-slate-800/80 text-xs font-tech">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>vercel.json:</strong> Pre-configured for Vite</span>
          </div>
          <div className="flex items-center gap-2 text-cyan-400">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>Build Script:</strong> npm run build (dist/)</span>
          </div>
          <div className="flex items-center gap-2 text-purple-400">
            <Globe className="w-4 h-4 text-purple-400 shrink-0" />
            <span><strong>SPA Rewrites:</strong> Zero 404 on deep links</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-[#070b16]">
          <button
            onClick={() => setActiveTab('git')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-tech font-bold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'git'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            Method 1: GitHub / Vercel Web Dashboard (Recommended)
          </button>
          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-tech font-bold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'cli'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            Method 2: Vercel CLI (1-Click Command)
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-tech font-bold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'config'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            vercel.json Config
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
          
          {/* TAB 1: GITHUB / VERCEL DASHBOARD */}
          {activeTab === 'git' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-cyan-400 font-tech font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Quick Deploy to Vercel</span>
                  </div>
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white text-black hover:bg-slate-200 font-tech font-bold text-xs uppercase transition-all shadow-md"
                  >
                    <span>Open Vercel Dashboard</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connecting through GitHub gives you automated continuous deployment: every time you push code or make updates, Vercel automatically builds and publishes a new production version.
                </p>
              </div>

              {/* Step by Step list */}
              <div className="space-y-4">
                <h3 className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wider">
                  Step-by-Step Deployment Instructions:
                </h3>

                {/* Step 1 */}
                <div className="flex gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-mono-code font-bold text-xs shrink-0">
                    1
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="font-tech font-bold text-slate-200 text-sm">
                      Push project to GitHub (or GitLab / Bitbucket)
                    </div>
                    <p className="text-xs text-slate-400">
                      If you haven't already, push this codebase to a repository on GitHub.
                    </p>
                    <div className="relative group mt-2">
                      <pre className="p-2.5 rounded-lg bg-black/80 border border-slate-800 font-mono-code text-xs text-cyan-300 overflow-x-auto">
{`git init
git add .
git commit -m "feat: Auto Brake IoT Digital Twin"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/auto-brake-iot.git
git push -u origin main`}
                      </pre>
                      <button
                        onClick={() => handleCopy(`git init\ngit add .\ngit commit -m "feat: Auto Brake IoT Digital Twin"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_USERNAME/auto-brake-iot.git\ngit push -u origin main`, 'git-push')}
                        className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                      >
                        {copiedId === 'git-push' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span className="text-[10px]">{copiedId === 'git-push' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-mono-code font-bold text-xs shrink-0">
                    2
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="font-tech font-bold text-slate-200 text-sm">
                      Import into Vercel
                    </div>
                    <p className="text-xs text-slate-400">
                      Go to <a href="https://vercel.com/new" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline font-semibold">vercel.com/new</a>, click <strong>"Import"</strong> next to your repository.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-3 p-3.5 rounded-xl bg-slate-900/40 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 flex items-center justify-center font-mono-code font-bold text-xs shrink-0">
                    3
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="font-tech font-bold text-slate-200 text-sm">
                      Confirm Build Settings (Pre-configured automatically!)
                    </div>
                    <p className="text-xs text-slate-400">
                      Vercel will automatically detect the settings from our <code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">vercel.json</code> file:
                    </p>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-code">
                      <div className="p-2 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">FRAMEWORK</span>
                        <span className="text-cyan-400 font-bold">Vite</span>
                      </div>
                      <div className="p-2 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">BUILD CMD</span>
                        <span className="text-emerald-400 font-bold">npm run build</span>
                      </div>
                      <div className="p-2 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">OUTPUT DIR</span>
                        <span className="text-purple-400 font-bold">dist</span>
                      </div>
                      <div className="p-2 rounded bg-black/60 border border-slate-800">
                        <span className="text-slate-500 text-[10px] block">ROUTING</span>
                        <span className="text-amber-400 font-bold">SPA Rewrites</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-3 p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="w-7 h-7 rounded-lg bg-emerald-900 border border-emerald-500/50 text-emerald-300 flex items-center justify-center font-mono-code font-bold text-xs shrink-0">
                    4
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="font-tech font-bold text-emerald-300 text-sm">
                      Click "Deploy" & Get Live HTTPS URL
                    </div>
                    <p className="text-xs text-slate-300">
                      In ~45 seconds, Vercel gives you your production URL (e.g. <span className="font-mono-code text-cyan-300 font-bold">https://auto-brake-twin.vercel.app</span>) with free SSL, CDN, and custom domain options!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VERCEL CLI */}
          {activeTab === 'cli' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-2">
                <div className="font-tech font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>Deploy in 60 seconds with Vercel CLI</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  The Vercel Command Line Interface (CLI) allows you to deploy directly from your local terminal without even creating a git repository first.
                </p>
              </div>

              <div className="space-y-4">
                {/* CLI Step 1 */}
                <div className="space-y-2">
                  <label className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wider block">
                    1. Install Vercel CLI globally
                  </label>
                  <div className="relative">
                    <pre className="p-3 rounded-xl bg-black border border-slate-800 font-mono-code text-xs text-cyan-300">
npm i -g vercel
                    </pre>
                    <button
                      onClick={() => handleCopy('npm i -g vercel', 'cli-install')}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                    >
                      {copiedId === 'cli-install' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{copiedId === 'cli-install' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* CLI Step 2 */}
                <div className="space-y-2">
                  <label className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wider block">
                    2. Deploy preview build
                  </label>
                  <div className="relative">
                    <pre className="p-3 rounded-xl bg-black border border-slate-800 font-mono-code text-xs text-cyan-300">
vercel
                    </pre>
                    <button
                      onClick={() => handleCopy('vercel', 'cli-deploy')}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                    >
                      {copiedId === 'cli-deploy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{copiedId === 'cli-deploy' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Follow the prompts (hit Enter to accept defaults, Vercel will auto-detect Vite).
                  </p>
                </div>

                {/* CLI Step 3 */}
                <div className="space-y-2">
                  <label className="text-xs font-tech font-bold text-slate-300 uppercase tracking-wider block">
                    3. Deploy directly to Production
                  </label>
                  <div className="relative">
                    <pre className="p-3 rounded-xl bg-black border border-emerald-500/40 font-mono-code text-xs text-emerald-400">
vercel --prod
                    </pre>
                    <button
                      onClick={() => handleCopy('vercel --prod', 'cli-prod')}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                    >
                      {copiedId === 'cli-prod' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span className="text-[10px]">{copiedId === 'cli-prod' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VERCEL.JSON CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-tech font-bold text-white text-sm">
                    Configured vercel.json File
                  </h3>
                  <p className="text-xs text-slate-400">
                    This file is already created in the project root to guarantee optimal Vercel deployment.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(vercelJsonContent, 'vercel-json')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs font-mono-code"
                >
                  {copiedId === 'vercel-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'vercel-json' ? 'Copied!' : 'Copy Config'}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="p-4 rounded-xl bg-black border border-slate-800 font-mono-code text-xs text-cyan-300 overflow-x-auto leading-relaxed">
{vercelJsonContent}
                </pre>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="font-tech font-bold text-cyan-400 block mb-1">
                    SPA Rewrites
                  </span>
                  Ensures all client-side paths, tabs, and routes load smoothly without 404 Not Found errors on page refresh.
                </div>
                <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="font-tech font-bold text-emerald-400 block mb-1">
                    Immutable Asset Caching
                  </span>
                  Applies high-speed 1-year immutable caching on Vite hashed bundles for maximum performance scores.
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#050811] border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready for Vercel production hosting</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-tech font-bold uppercase text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:border-slate-600 transition-colors"
            >
              Close
            </button>
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-tech font-bold uppercase tracking-wider text-black bg-gradient-to-r from-cyan-400 to-blue-400 hover:from-cyan-300 hover:to-blue-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
            >
              <Globe className="w-4 h-4" />
              <span>Launch Vercel Deploy</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};
