import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle2, Circle, Send, Star, Trophy } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getStats } from "@/lib/stats";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default function OverviewPage() {
  const { jobs, byStatus } = getStats();
  const profile = getProfile();

  const stats = [
    { label: "Jobs in feed", value: jobs, icon: Briefcase },
    { label: "Saved", value: byStatus.saved + byStatus.applying, icon: Star },
    { label: "Applied", value: byStatus.applied, icon: Send },
    { label: "Interviews & offers", value: byStatus.interview + byStatus.offer, icon: Trophy },
  ];

  const steps = [
    { done: Boolean(profile.full_name && profile.email), label: "Fill in your profile", href: "/profile" },
    { done: Boolean(profile.resume_text), label: "Add your resume", href: "/profile" },
    { done: jobs > 0, label: "Pull in remote design jobs", href: "/jobs" },
    { done: byStatus.applied > 0, label: "Send your first application", href: "/applications" },
  ];

  return (
    <>
      <PageHeader
        title={profile.full_name ? `Welcome back, ${profile.full_name.split(" ")[0]}` : "Welcome to Career Ops"}
        description="Everything about your job search, in one place on your machine."
        actions={
          <Button asChild>
            <Link href="/jobs">
              Browse jobs <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center justify-between pt-5">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" />
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>A few steps to get your search running.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {steps.map((step) => (
            <Link key={step.label} href={step.href} className="group flex items-center gap-3 py-3 text-sm">
              {step.done ? <CheckCircle2 className="size-5 text-success" /> : <Circle className="size-5 text-muted-foreground" />}
              <span className={step.done ? "text-muted-foreground line-through" : ""}>{step.label}</span>
              <ArrowRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
