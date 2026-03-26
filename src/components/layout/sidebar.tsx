'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  MapIcon,
  Kanban,
  Mail,
  BookOpen,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/brief', label: 'Brief & Discovery', icon: FileText },
  { href: '/map', label: 'Map', icon: MapIcon },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/outreach', label: 'Outreach Studio', icon: Mail },
  { href: '/briefing', label: 'Briefing Notes', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navContent = (
    <nav className="flex flex-col gap-1 px-3">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-plum-800 text-white'
                : 'text-silver-700 hover:bg-plum-50 hover:text-plum-800'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-silver-200 flex flex-col transition-transform lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-6 pb-4 flex items-center gap-3">
          <Image src="/logo.png" alt="Climb10" width={40} height={40} />
          <span className="text-xl font-bold text-plum-800">Climb10</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          {navContent}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-silver-200">
          <p className="text-xs text-silver-500 text-center">
            Nature Advisory Platform
          </p>
        </div>
      </aside>
    </>
  );
}
