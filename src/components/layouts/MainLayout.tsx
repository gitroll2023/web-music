interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-md mx-auto relative pb-20 px-5">
        {children}
      </div>
    </div>
  );
} 