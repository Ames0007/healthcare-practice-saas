/**
 * Mobile-first, accountless public booking area (Spec #7 §31, Spec #9
 * §54). `max-w-xl` (not `max-w-sm`) — UI-012ABCDE's real journey needs
 * room for a month calendar grid and a multi-column slot list; task §73
 * ("do not stretch patient forms across huge widths") still bounds it well
 * short of a full-width admin layout.
 */
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}
