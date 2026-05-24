import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import type { GenerationOutput } from '../../store/projectStore';

interface Props { data: GenerationOutput['marketingCopy']; }

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); toast.success('Copied!'); }}
      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
    >
      <Copy size={14} />
    </button>
  );
}

function CopyCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass p-4">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
        <CopyButton text={value} />
      </div>
      <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function MarketingCopyCard({ data }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CopyCard label="Tagline" value={data.tagline} />
        <CopyCard label="Product Hunt Tagline" value={data.productHuntTagline} />
        <CopyCard label="Value Proposition" value={data.valueProposition} />
        <CopyCard label="Twitter/X Bio" value={data.twitterBio} />
      </div>

      <CopyCard label="Email Subject Line" value={data.emailSubject} />
      <CopyCard label="Cold Email Body" value={data.emailBody} />

      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">📣 Ad Copy</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.adCopy.map((ad, i) => (
            <div key={i} className="glass p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-brand-400">{ad.platform}</span>
                <CopyButton text={`${ad.headline}\n\n${ad.body}`} />
              </div>
              <p className="font-semibold text-slate-200 text-sm mb-1">{ad.headline}</p>
              <p className="text-slate-400 text-xs leading-relaxed">{ad.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

