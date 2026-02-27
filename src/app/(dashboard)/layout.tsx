import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative min-h-screen bg-slate-50">
            <Sidebar />
            <div className="ml-64 flex min-h-screen flex-col">
                {/* Main Content Area */}
                <main className="flex-1 p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
