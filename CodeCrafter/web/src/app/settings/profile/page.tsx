"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";

interface ProfileForm {
  displayName: string;
  bio: string;
  location: string;
  company: string;
  school: string;
  githubUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  preferredLanguages: string;
}

const EMPTY_FORM: ProfileForm = {
  displayName: "",
  bio: "",
  location: "",
  company: "",
  school: "",
  githubUrl: "",
  linkedinUrl: "",
  twitterUrl: "",
  preferredLanguages: "",
};

export default function SettingsProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login?callbackUrl=/settings/profile");
      return;
    }
    if (status !== "authenticated") return;

    api
      .get("/users/me")
      .then((res) => {
        const d = res.data;
        setForm({
          displayName: d.displayName ?? "",
          bio: d.bio ?? "",
          location: d.location ?? "",
          company: d.company ?? "",
          school: d.school ?? "",
          githubUrl: d.githubUrl ?? "",
          linkedinUrl: d.linkedinUrl ?? "",
          twitterUrl: d.twitterUrl ?? "",
          preferredLanguages: Array.isArray(d.preferredLanguages)
            ? d.preferredLanguages.join(", ")
            : "",
        });
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [status, router]);

  function update(field: keyof ProfileForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/me/profile", form);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10">
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Profile Settings</h1>
          <p className="text-zinc-400 text-sm mt-1">
            This information will be shown on your public profile at{" "}
            <span className="text-emerald-400">/u/{session?.username}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Info</CardTitle>
              <CardDescription>Your name and bio visible to everyone</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Display Name" id="displayName" value={form.displayName} onChange={update("displayName")} />
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  rows={3}
                  value={form.bio}
                  onChange={update("bio")}
                  placeholder="A short bio about yourself"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ring-offset-zinc-950 resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Location & Affiliation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Location" id="location" value={form.location} onChange={update("location")} placeholder="City, Country" />
              <Field label="Company" id="company" value={form.company} onChange={update("company")} placeholder="Where you work" />
              <Field label="School" id="school" value={form.school} onChange={update("school")} placeholder="Where you study" />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Social Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="GitHub URL" id="githubUrl" value={form.githubUrl} onChange={update("githubUrl")} placeholder="https://github.com/username" />
              <Field label="LinkedIn URL" id="linkedinUrl" value={form.linkedinUrl} onChange={update("linkedinUrl")} placeholder="https://linkedin.com/in/username" />
              <Field label="Twitter / X URL" id="twitterUrl" value={form.twitterUrl} onChange={update("twitterUrl")} placeholder="https://x.com/username" />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Preferred Languages</CardTitle>
              <CardDescription>Comma-separated list e.g. Java, Python, C++</CardDescription>
            </CardHeader>
            <CardContent>
              <Field label="Languages" id="preferredLanguages" value={form.preferredLanguages} onChange={update("preferredLanguages")} placeholder="Java, Python, Go" />
            </CardContent>
          </Card>

          <div className="mt-6 flex justify-end">
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 px-8" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}
