"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateProfile } from "@/app/actions/profile";
import { getContrastTextColor } from "@/lib/color";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = [
  "#8B5CF6", // Purple (default)
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

export function ManagerProfile({ profile }: { profile: Profile }) {
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState(profile.full_name || profile.email);
  const [color, setColor] = useState(profile.color || "#8B5CF6");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfile({
        userId: profile.id,
        fullName,
        color,
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.success ?? "Profile updated.");
      }
    });
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Manage your name and calendar color</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
              <p className="text-xs text-muted-foreground">This is displayed to other users on the calendar</p>
            </div>

            {/* Color Field */}
            <div className="space-y-3">
              <Label>Calendar Color</Label>
              <p className="text-sm text-muted-foreground">
                This color will be used to highlight your calls on the calendar
              </p>

              <div className="grid grid-cols-4 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`relative w-12 h-12 rounded-lg border-2 transition-all ${
                      color === c ? "border-primary shadow-lg ring-2 ring-primary/50" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {color === c && <div className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</div>}
                  </button>
                ))}

                {/* Custom Color Picker */}
                {(() => {
                  const isCustom = !COLORS.includes(color);
                  return (
                    <label
                      className={`relative w-12 h-12 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-center ${
                        isCustom
                          ? "border-primary shadow-lg ring-2 ring-primary/50 bg-muted"
                          : "border-dashed border-border hover:border-primary bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute opacity-0 w-0 h-0 cursor-pointer"
                        title="Custom color"
                      />
                      <span className="text-lg font-bold">{isCustom ? "✓" : "+"}</span>
                    </label>
                  );
                })()}
              </div>

              {/* Preview */}
              <div className="mt-4 p-3 rounded-lg border border-border bg-card">
                <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                <div
                  className={`p-3 rounded text-sm font-medium ${getContrastTextColor(color)}`}
                  style={{ backgroundColor: color }}
                >
                  {fullName || "Your Call"} • 10:30 AM – 11:30 AM
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
