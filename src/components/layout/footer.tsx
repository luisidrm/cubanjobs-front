import { Logo } from "@/components/layout/wordmark";

export function Footer() {
  return (
    <footer>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 sm:px-6">
        <Logo className="text-lg" />
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Brújula. Tu norte profesional.
        </p>
      </div>
    </footer>
  );
}
