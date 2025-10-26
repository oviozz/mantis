"use client"
import {Camera, Video, Search, Target, Activity, Upload, ChevronRight} from 'lucide-react';
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useUploadStore} from "@/store/upload-store";
import Image from "next/image";
import logo from "@/../public/logo.png";

export default function DashboardSidebar() {
    const pathname = usePathname();

    const routes = [
        {
            path: '/overview',
            name: 'OVERVIEW',
            icon: Activity,
            description: 'Live Stream & Alerts'
        },
        {
            path: '/footages',
            name: 'FOOTAGE',
            icon: Video,
            description: 'Detection & Analysis'
        },
        {
            path: '/search',
            name: 'SEARCH',
            icon: Search,
            description: 'Query & Face Recognition'
        },
        {
            path: '/event-breakdown',
            name: 'EVENT BREAKDOWN',
            icon: Target,
            description: 'Frame Analysis'
        }
    ];

    const openUpload = useUploadStore((state) => state.open);

    const handleUploadClick = () => {
        // Example: Create a file input to select video
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'video/*';
        input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            if (file) {
                openUpload(file, file.name.replace(/\.[^/.]+$/, ""));
            }
        };
        input.click();
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 flex">
            {/* Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 relative z-10 flex flex-col">
                {/* Logo/Header */}
                <div className="border-b border-gray-200 px-4 py-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2">
                            <Image
                                width={80}
                                height={80}
                                src={logo.src}
                                alt="Security Logo"
                                className="object-contain"
                            />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-wider leading-5 text-green-900">MANTIS</h1>
                            <p className="text-sm text-gray-500 font-medium">Detect Fast, Act Faster</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4">
                    <div className="flex flex-col gap-3">
                        {routes.map((route) => {
                            const isActive = pathname.includes(route.path);
                            const Icon = route.icon;

                            return (
                                <Link
                                    key={route.path}
                                    href={route.path}
                                >
                                    <button
                                        className={`cursor-pointer w-full text-left transition-all border ${
                                            isActive
                                                ? 'bg-red-50 border-red-600 text-gray-900'
                                                : 'bg-gray-50 border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-900'
                                        }`}
                                    >
                                        <div className="p-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Icon
                                                    className={`w-5 h-5 ${isActive ? 'text-red-600' : 'text-gray-500'}`}/>
                                                <span
                                                    className="font-bold text-sm uppercase tracking-wider">{route.name}</span>
                                                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-red-600"/>}
                                            </div>
                                            <p className="text-xs text-gray-500 font-mono ml-8">{route.description}</p>
                                        </div>
                                    </button>
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                {/* Quick Upload */}
                <div className="border-t border-gray-200 p-2">
                    <button
                        onClick={handleUploadClick}
                        className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-900 p-2 transition-all"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Upload className="w-5 h-5"/>
                            <span className="font-bold text-sm uppercase">UPLOAD FOOTAGE</span>
                        </div>
                    </button>
                </div>

            </div>
        </div>
    );
}