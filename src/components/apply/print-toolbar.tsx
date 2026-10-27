"use client";

import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to apply kit
      </Link>
      <div className="flex items-center gap-3">
        <p className="hidden text-xs text-muted-foreground sm:block">Choose &ldquo;Save as PDF&rdquo; as the printer.</p>
        <Button onClick={() => window.print()}>
          <Printer /> Save as PDF
        </Button>
      </div>
    </div>
  );
}
