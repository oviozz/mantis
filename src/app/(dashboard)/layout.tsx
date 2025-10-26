import React from "react";
import DashboardSidebar from "@/app/(dashboard)/_components/dashboard-sidebar";

type DashboardLayoutProps = {
    children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <div className="fixed top-0 left-0 h-screen w-80 z-20">
                <DashboardSidebar />
            </div>
            {/* Main content */}
            <div className="ml-80 flex-1 overflow-y-auto bg-gray-50">
                {children}
            </div>
        </div>
    );
}
