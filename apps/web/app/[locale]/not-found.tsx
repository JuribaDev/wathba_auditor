import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <main className="app-grid min-h-screen justify-center">
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="text-2xl">Page not found</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
          <p>The requested route is not part of the current static export.</p>
          <Button asChild className="w-fit">
            <Link href="/en">Return to the start</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

