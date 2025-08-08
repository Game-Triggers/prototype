"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { UserRole } from "@/lib/schema-types";
import { Mail, Link as LinkIcon, Settings, User, Edit3, Save, X, Copy, ExternalLink } from "lucide-react";

type Profile = {
  _id?: string;
  email: string;
  name: string;
  image?: string;
  role?: UserRole | string;
  authProvider?: string;
  channelUrl?: string;
  category?: string[];
  language?: string[];
  description?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isActive?: boolean;
  campaignSelectionStrategy?: string;
  overlaySettings?: {
    position?: string;
    size?: string;
    opacity?: number;
    backgroundColor?: string;
  };
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    channelUrl: "",
    category: "",
    language: "",
    description: "",
  });

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || `Failed: ${res.status}`);
        }
        const data = (await res.json()) as Profile;
        if (active) {
          setProfile(data);
          setForm({
            name: data.name || "",
            channelUrl: data.channelUrl || "",
            category: (data.category || []).join(", "),
            language: (data.language || []).join(", "),
            description: data.description || "",
          });
        }
      } catch (e) {
        if (active) setError("Unable to load profile. Please try again.");
        console.error("/dashboard/profile load error", e);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const getInitials = (name?: string) =>
    (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const RoleBadge = ({ role }: { role?: string | UserRole }) => {
    const r = String(role || "unknown");
    const color =
      r === UserRole.ADMIN
        ? "bg-red-500"
        : r === UserRole.BRAND
        ? "bg-blue-600"
        : r === UserRole.STREAMER
        ? "bg-purple-600"
        : "bg-gray-500";
    return <span className={`text-xs px-2 py-1 rounded text-white ${color}`}>{r}</span>;
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const computeCompleteness = () => {
    const checks = [
      !!form.name?.trim(),
      !!form.channelUrl?.trim(),
      (form.category?.split(",").map((c) => c.trim()).filter(Boolean).length || 0) > 0,
      (form.language?.split(",").map((l) => l.trim()).filter(Boolean).length || 0) > 0,
      !!form.description?.trim(),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const handleCopy = async (val?: string) => {
    if (!val) return;
    try {
      await navigator.clipboard.writeText(val);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleOpen = (url?: string) => {
    if (!url) return;
    try {
      const withProto = url.startsWith("http") ? url : `https://${url}`;
      window.open(withProto, "_blank");
    } catch {
      /* noop */
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const updatePayload = {
      name: form.name.trim(),
      channelUrl: form.channelUrl.trim(),
      category: form.category.split(",").map((c) => c.trim()).filter(Boolean),
      language: form.language.split(",").map((l) => l.trim()).filter(Boolean),
      description: form.description.trim(),
    };

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!res.ok) {
        // Graceful fallback if backend PUT not implemented
        if (res.status === 404 || res.status === 405) {
          const updated = { ...profile, ...updatePayload, updatedAt: new Date().toISOString() } as Profile;
          setProfile(updated);
          toast.success("Changes saved locally (backend update not available)");
          setIsEditing(false);
          return;
        }
        const text = await res.text();
        throw new Error(text || "Update failed");
      }

      const updated = (await res.json()) as Profile;
      setProfile(updated);
      toast.success("Profile updated");
      setIsEditing(false);
    } catch (err) {
      console.error("profile update error", err);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        name: profile.name || "",
        channelUrl: profile.channelUrl || "",
        category: (profile.category || []).join(", "),
        language: (profile.language || []).join(", "),
        description: profile.description || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-20 w-20 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-28" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">{error}</p>
            <div className="mt-6">
              <Button onClick={() => location.reload()}>Retry</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account details</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2">
            <Edit3 className="h-4 w-4" /> Edit
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" onClick={handleCancel} disabled={saving} className="inline-flex items-center gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" /> Personal Information
              </CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile header */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xl font-semibold overflow-hidden">
                    {profile.image ? (
                      <Image
                        src={profile.image}
                        alt={profile.name || "User"}
                        width={80}
                        height={80}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(profile.name)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1">
                    <RoleBadge role={profile.role} />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-xl font-semibold">{profile.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" /> {profile.email}
                  </div>
                  <div className="flex items-center gap-2">
                    {profile.authProvider && <Badge variant="outline">{profile.authProvider}</Badge>}
                    {profile.isActive && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={form.name} onChange={onChange} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email || ""} disabled className="bg-muted" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="flex items-center gap-2" htmlFor="channelUrl">
                    <LinkIcon className="h-4 w-4" /> Channel URL
                  </Label>
                  <div className="flex gap-2">
                    <Input id="channelUrl" name="channelUrl" value={form.channelUrl} onChange={onChange} disabled={!isEditing} />
                    {!isEditing && (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleCopy(profile.channelUrl)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleOpen(profile.channelUrl)}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categories</Label>
                  <Input id="category" name="category" value={form.category} onChange={onChange} disabled={!isEditing} placeholder="Gaming, Entertainment" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(profile.category && profile.category.length > 0 ? profile.category : ["—"]).map((c, i) => (
                      <Badge key={`${c}-${i}`} variant="outline">{c}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Languages</Label>
                  <Input id="language" name="language" value={form.language} onChange={onChange} disabled={!isEditing} placeholder="English, Spanish" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {(profile.language && profile.language.length > 0 ? profile.language : ["—"]).map((l, i) => (
                      <Badge key={`${l}-${i}`} variant="outline">{l}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Bio</Label>
                  {isEditing ? (
                    <Textarea id="description" name="description" value={form.description} onChange={onChange} rows={4} className="resize-none" />
                  ) : (
                    <div className="min-h-20 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                      {profile.description || "No bio provided."}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" /> Account Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm">User ID</Label>
                <div className="mt-1 flex items-center gap-2">
                  <p className="font-mono text-xs break-all text-muted-foreground flex-1">{profile._id || "—"}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleCopy(profile._id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Member Since</Label>
                  <p className="text-muted-foreground">
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <Label>Last Updated</Label>
                  <p className="text-muted-foreground">
                    {profile.updatedAt ? new Date(profile.updatedAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile Completeness</CardTitle>
              <CardDescription>Improve visibility by completing your profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={computeCompleteness()} />
              <p className="text-sm text-muted-foreground">{computeCompleteness()}% complete</p>
            </CardContent>
          </Card>

          {profile.role === UserRole.STREAMER && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Settings</CardTitle>
                <CardDescription>Your current selection preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Strategy</span>
                  <Badge variant="outline">{profile.campaignSelectionStrategy || "fair-rotation"}</Badge>
                </div>
                {profile.overlaySettings && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-muted-foreground">Overlay Pos.</div>
                    <div>{profile.overlaySettings.position || "bottom-right"}</div>
                    <div className="text-muted-foreground">Overlay Size</div>
                    <div>{profile.overlaySettings.size || "medium"}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
