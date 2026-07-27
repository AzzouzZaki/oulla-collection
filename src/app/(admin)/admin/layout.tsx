import React from 'react';

// This layout intentionally passes children through.
// The admin shell (sidebar) is applied at the (admin) group layout level,
// conditionally excluded for /admin/login.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
