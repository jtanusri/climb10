export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-plum-50 via-white to-ocean-50">
      {children}
    </div>
  );
}
