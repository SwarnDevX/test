"use client";

import type { PersonalInfo } from "@/types";

interface Props {
  data: PersonalInfo;
  onChange: (data: PersonalInfo) => void;
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-400 block mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-glass"
      />
    </div>
  );
}

export function PersonalInfoSection({ data, onChange }: Props) {
  function update(key: keyof PersonalInfo, value: string) {
    onChange({ ...data, [key]: value });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Personal Information</h2>
        <p className="text-xs text-slate-500">This appears at the top of your resume</p>
      </div>

      <div className="space-y-4">
        <Field label="Full Name *" value={data.name} onChange={(v) => update("name", v)} placeholder="Your Name" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Email *" value={data.email} onChange={(v) => update("email", v)} type="email" placeholder="you@email.com" />
          <Field label="Phone" value={data.phone} onChange={(v) => update("phone", v)} placeholder="+1 (555) 000-0000" />
        </div>
        <Field label="Location" value={data.location} onChange={(v) => update("location", v)} placeholder="City, State / Country" />

        <div className="pt-2 border-t border-white/[0.06]">
          <p className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wide">Online Profiles (optional)</p>
          <div className="space-y-3">
            <Field label="LinkedIn URL" value={data.linkedin ?? ""} onChange={(v) => update("linkedin", v)} placeholder="https://linkedin.com/in/yourname" />
            <Field label="GitHub URL" value={data.github ?? ""} onChange={(v) => update("github", v)} placeholder="https://github.com/yourname" />
            <Field label="Portfolio / Website" value={data.website ?? ""} onChange={(v) => update("website", v)} placeholder="https://yoursite.com" />
          </div>
        </div>
      </div>
    </div>
  );
}
