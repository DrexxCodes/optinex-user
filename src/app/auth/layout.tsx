import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="auth-background" />
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
        <div className="mb-8 flex items-center gap-2">
          <Image src="/logo-light.png" alt="Optinex Africa" width={168} height={45} priority />
        </div>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Optinex Africa. All rights reserved.
        </p>
      </div>
    </div>
  );
}
