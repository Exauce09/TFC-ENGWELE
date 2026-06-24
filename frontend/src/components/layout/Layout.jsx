import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, title = 'Centre Médical AMEN' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(o => !o)} title={title} />
        <main className="flex-1 overflow-y-auto p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
