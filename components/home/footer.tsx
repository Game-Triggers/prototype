"use client";

export function Footer() {
  return (
    <footer className="py-6 w-full text-center text-sm text-muted-foreground border-t">
      <p>© {new Date().getFullYear()} GameTriggers. All rights reserved.</p>
    </footer>
  );
}
