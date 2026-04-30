import { AppSidebar } from '@/components/app-sidebar';
import { ChatWidget } from '@/components/chat-widget';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-60">
        <div className="mx-auto max-w-[1200px] px-8 py-8">
          {children}
        </div>
      </main>
      <ChatWidget />
    </div>
  );
}
