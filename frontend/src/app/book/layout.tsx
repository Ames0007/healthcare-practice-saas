/** Mobile-first, accountless public booking area (Spec #7 §31, Spec #9 §54). */
export default function BookLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
