'use client';

import Sidebar from '@/components/admin/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">{children}</main>
    </div>
  );
}
