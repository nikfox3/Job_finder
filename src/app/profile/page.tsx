import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfile } from "@/lib/profile";
import { updateProfile } from "@/app/actions/profile";
import { listAnswers } from "@/lib/answers";
import { AnswerBank } from "@/components/apply/answer-bank";

export const dynamic = "force-dynamic";

const FIELDS = [
  { name: "full_name", label: "Full name", placeholder: "Your name" },
  { name: "email", label: "Email", placeholder: "you@example.com", type: "email" },
  { name: "phone", label: "Phone", placeholder: "+1 555 000 0000" },
  { name: "location", label: "Location", placeholder: "City, Country" },
  { name: "headline", label: "Headline", placeholder: "Senior Product Designer" },
  // Plain text so short addresses like "yourname.design" are accepted; https:// is added on save.
  { name: "portfolio_url", label: "Portfolio", placeholder: "yourname.design", inputMode: "url" },
  { name: "linkedin_url", label: "LinkedIn", placeholder: "linkedin.com/in/yourname", inputMode: "url" },
] as const;

export default function ProfilePage() {
  const profile = getProfile();
  return (
    <>
      <PageHeader title="Profile" description="Saved once, reused to prefill every application." />
      <form action={updateProfile} className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>About you</CardTitle>
            <CardDescription>The basics most application forms ask for.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {FIELDS.map((f) => (
              <div key={f.name} className="grid gap-2">
                <Label htmlFor={f.name}>{f.label}</Label>
                <Input
                  id={f.name}
                  name={f.name}
                  type={"type" in f ? f.type : "text"}
                  inputMode={"inputMode" in f ? f.inputMode : undefined}
                  placeholder={f.placeholder}
                  defaultValue={profile[f.name] ?? ""}
                />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Resume</CardTitle>
            <CardDescription>Paste your resume as plain text. It is used to tailor cover letters and answers.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            <textarea
              name="resume_text"
              defaultValue={profile.resume_text ?? ""}
              placeholder="Paste your resume here..."
              className="min-h-72 flex-1 rounded-md border border-input bg-transparent p-3 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" className="self-end">
              Save profile
            </Button>
          </CardContent>
        </Card>
      </form>
      <Card id="answers" className="mt-6 scroll-mt-8">
        <CardHeader>
          <CardTitle>Answer bank</CardTitle>
          <CardDescription>Answers to questions most applications ask. They show up ready to copy in each job&apos;s apply kit.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnswerBank initial={listAnswers()} />
        </CardContent>
      </Card>
    </>
  );
}
