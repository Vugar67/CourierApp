export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-card-md">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
                <rect x="9" y="11" width="14" height="10" rx="2"/>
                <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-text tracking-tight">CourierApp</span>
          </div>
          <p className="text-sm text-text-muted">Международная доставка</p>
        </div>
        {children}
      </div>
    </div>
  )
}
