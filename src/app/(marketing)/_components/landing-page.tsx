"use client"
import React, { useState, useEffect } from 'react';
import { Camera, Shield, Search, Eye, Bell, Users, Clock, Target, Play, ChevronRight, Zap, Activity, AlertTriangle } from 'lucide-react';
import Link from "next/link";

export default function LandingPage() {

    const [activeCamera, setActiveCamera] = useState(0);
    const [detectionCount, setDetectionCount] = useState(0);
    const [alertActive, setAlertActive] = useState(false);

    useEffect(() => {
        const cameraInterval = setInterval(() => {
            setActiveCamera(prev => (prev + 1) % 4);
        }, 3000);

        const detectionInterval = setInterval(() => {
            setDetectionCount(prev => prev + 1);
            setAlertActive(true);
            setTimeout(() => setAlertActive(false), 2000);
        }, 5000);

        return () => {
            clearInterval(cameraInterval);
            clearInterval(detectionInterval);
        };
    }, []);

    return (
        <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
            {/* Animated Background Grid */}
            <div className="fixed inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'linear-gradient(#dc2626 1px, transparent 1px), linear-gradient(90deg, #dc2626 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }}></div>
            </div>

            {/* Animated Scanline Effect */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Main scanline with glow */}
                <div className="absolute w-full h-6 animate-scan">
                    {/* Top glow */}
                    <div className="absolute inset-0 bg-red-600 opacity-10 blur-xl"></div>
                    {/* Main line */}
                    <div className="absolute inset-0 bg-red-500 opacity-15"></div>
                    {/* Bright center line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-400 opacity-30"></div>
                    {/* Bottom glow */}
                    <div className="absolute inset-0 bg-red-600 opacity-8 blur-2xl"></div>
                </div>
            </div>

            {/* Hero Section */}
            <section className="border-b-2 border-gray-200 relative min-h-screen flex items-center">
                {/* Random Grid Rectangles with Labels */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[10%] left-[5%] w-32 h-32 border-2 border-red-600 opacity-40">
                        <div className="absolute -top-6 left-0 bg-red-600 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            PERSON #1
                        </div>
                    </div>
                    <div className="absolute top-[60%] left-[8%] w-24 h-40 border-2 border-orange-500 opacity-35">
                        <div className="absolute -top-6 left-0 bg-orange-500 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            HIDE ITEM
                        </div>
                    </div>
                    <div className="absolute top-[15%] right-[10%] w-40 h-24 border-2 border-red-600 opacity-40">
                        <div className="absolute -top-6 left-0 bg-red-600 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            PERSON #3
                        </div>
                    </div>
                    <div className="absolute top-[70%] right-[15%] w-28 h-28 border-2 border-yellow-500 opacity-35">
                        <div className="absolute -top-6 left-0 bg-yellow-600 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            SUSPICIOUS
                        </div>
                    </div>
                    <div className="absolute bottom-[10%] left-[25%] w-36 h-20 border-2 border-red-500 opacity-35">
                        <div className="absolute -top-6 left-0 bg-red-500 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            IN BAG
                        </div>
                    </div>
                    <div className="absolute top-[40%] right-[5%] w-20 h-48 border-2 border-green-500 opacity-35">
                        <div className="absolute -top-6 left-0 bg-green-600 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            PERSON #2
                        </div>
                    </div>
                    <div className="absolute top-[25%] left-[40%] w-24 h-24 border-2 border-orange-600 opacity-30">
                        <div className="absolute -top-6 left-0 bg-orange-600 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            HAND MOTION
                        </div>
                    </div>
                    <div className="absolute bottom-[25%] right-[35%] w-32 h-16 border-2 border-red-600 opacity-35">
                        <div className="absolute -top-6 left-0 bg-red-600 px-2 py-1 text-xs font-mono text-white whitespace-nowrap">
                            CONCEAL
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-32 relative z-10 w-full">
                    <div className="text-center max-w-5xl mx-auto">
                        <h1 className="text-7xl md:text-8xl font-black mb-8 leading-tight text-gray-900">
                            REAL-TIME<br />
                            <span className="text-red-600">THEFT & THREAT</span><br />
                            DETECTION
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 font-light max-w-3xl mx-auto">
                            Intelligent surveillance system that detects shoplifting, threatening behavior, and weapons in real-time. Automatically track repeat offenders and send instant alerts.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href={"/overview"}>
                                <button className="hover:cursor-pointer bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg transition-all border-2 border-red-600 hover:border-red-700 font-bold flex items-center gap-2 group">
                                    CHECK MY STORE
                                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </Link>
                        </div>

                        {/* Interactive Demo Dashboard - Centered Below */}
                        <div className="relative mt-20 max-w-4xl mx-auto">
                            <div className="bg-neutral-50 border border-gray-300 p-6">
                                {/* Live Feed */}
                                <div className="relative mb-4">
                                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-red-600 px-3 py-1 text-xs font-bold text-white">
                                        <div className="w-2 h-2 bg-white animate-pulse"></div>
                                        LIVE
                                    </div>
                                    <div className="absolute top-3 right-3 z-10 bg-gray-900 px-3 py-1 text-xs font-mono text-white">
                                        CAM {activeCamera + 1}
                                    </div>

                                    <div className="aspect-video bg-gray-100 border-2 border-gray-300 relative overflow-hidden">
                                        {/* Simulated camera feed */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Camera className="w-20 h-20 text-gray-300" />
                                        </div>

                                        {/* Bounding boxes */}
                                        <div className="absolute top-1/4 left-1/4 w-20 h-32 border-2 border-red-600 animate-pulse">
                                            <div className="absolute -top-6 left-0 bg-red-600 px-2 py-1 text-xs font-mono text-white">
                                                THREAT
                                            </div>
                                        </div>
                                        <div className="absolute top-1/3 right-1/4 w-16 h-24 border-2 border-orange-500">
                                            <div className="absolute -top-6 left-0 bg-orange-500 px-2 py-1 text-xs font-mono text-white">
                                                THEFT
                                            </div>
                                        </div>

                                        {/* Detection overlay */}
                                        <div className="absolute inset-0 border-4 border-transparent" style={{
                                            borderImage: 'linear-gradient(90deg, #dc2626 0%, transparent 50%, #dc2626 100%) 1',
                                            animation: 'borderScan 2s linear infinite'
                                        }}></div>
                                    </div>
                                </div>

                                {/* Alert Feed */}
                                <div className="space-y-3">
                                    <div className={`relative overflow-hidden border-2 transition-all ${
                                        alertActive ? 'bg-red-50 border-red-600' : 'bg-gray-50 border-gray-300'
                                    }`}>
                                        {/* Animated alert bar */}
                                        {alertActive && (
                                            <div className="absolute inset-0 bg-red-600 opacity-5 animate-pulse"></div>
                                        )}
                                        <div className="relative flex items-center gap-3 p-4">
                                            <div className={`p-2 border-2 ${
                                                alertActive ? 'bg-red-600 border-red-700' : 'bg-gray-200 border-gray-300'
                                            }`}>
                                                <AlertTriangle className={`w-6 h-6 ${
                                                    alertActive ? 'text-white animate-pulse' : 'text-red-600'
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`text-sm font-black uppercase tracking-wider ${
                                                        alertActive ? 'text-red-600' : 'text-red-600'
                                                    }`}>
                                                        ALERT: SHOPLIFTING DETECTED
                                                    </div>
                                                    {alertActive && (
                                                        <div className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold">
                                                            ACTIVE
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <span className="font-mono flex items-center gap-1">
                                                        <Camera className="w-3 h-3" />
                                                        Camera 3
                                                    </span>
                                                    <span className="font-mono flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        13:42:15
                                                    </span>
                                                    <span className="font-bold text-red-600">#{detectionCount}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-red-600 mb-1">{detectionCount}</div>
                                                <div className="text-xs text-gray-500 font-mono uppercase">Events</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 border-2 border-gray-300 hover:border-gray-400 transition-all group">
                                        <div className="flex items-center gap-3 p-4">
                                            <div className="p-2 bg-gray-200 border-2 border-gray-300 group-hover:border-yellow-600 transition-colors">
                                                <Users className="w-6 h-6 text-yellow-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                                                        Repeat Offender Match
                                                    </div>
                                                    <div className="px-2 py-0.5 bg-yellow-600 text-white text-xs font-bold">
                                                        FLAGGED
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-600">
                                                    <span className="font-mono">Face ID: #4829</span>
                                                    <span className="text-yellow-600 font-bold">97% Match</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-yellow-600 mb-1">!</div>
                                                <div className="text-xs text-gray-500 font-mono uppercase">Alert</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="grid grid-cols-3 gap-3 mt-6">
                                    <button className="bg-red-600 hover:bg-red-700 text-white py-3 px-4 text-sm font-bold transition-all border-2 border-red-600 hover:border-red-700 group">
                                        <div className="flex flex-col items-center gap-1">
                                            <Bell className="w-5 h-5 group-hover:animate-pulse" />
                                            <span>ALERT</span>
                                        </div>
                                    </button>
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 text-sm font-bold transition-all border-2 border-blue-600 hover:border-blue-700 group">
                                        <div className="flex flex-col items-center gap-1">
                                            <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span>POLICE</span>
                                        </div>
                                    </button>
                                    <button className="bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 text-sm font-bold transition-all border-2 border-gray-800 hover:border-gray-900 group">
                                        <div className="flex flex-col items-center gap-1">
                                            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                            <span>SAVE</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Floating stats */}
                            <div className="absolute -right-4 top-1/4 bg-white border-2 border-red-600 p-4 animate-float">
                                <div className="text-3xl font-black text-red-600">99.2%</div>
                                <div className="text-xs text-gray-600 font-mono">ACCURACY</div>
                            </div>
                            <div className="absolute -left-4 bottom-1/4 bg-white border-2 border-gray-300 p-4 animate-float-delayed">
                                <div className="text-3xl font-black text-gray-900">&lt;2s</div>
                                <div className="text-xs text-gray-600 font-mono">RESPONSE</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="border-b-2 border-gray-200 bg-gray-50 relative">
                <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-black mb-4 text-gray-900">HOW IT <span className="text-red-600">WORKS</span></h2>
                        <p className="text-xl text-gray-600 font-light">Simple setup, powerful protection</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { num: "01", title: "Connect Cameras", desc: "Link your existing CCTV cameras to our system" },
                            { num: "02", title: "AI Processing", desc: "Our AI analyzes footage every 1-2 seconds in real-time" },
                            { num: "03", title: "Instant Detection", desc: "System detects threats and creates face profiles automatically" },
                            { num: "04", title: "Get Alerts", desc: "Receive instant notifications and take immediate action" }
                        ].map((step, i) => (
                            <div key={i} className="relative">
                                {i < 3 && (
                                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gray-300">
                                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500"></div>
                                    </div>
                                )}
                                <div className="bg-white border-2 border-gray-300 hover:border-gray-400 p-8 transition-all text-center group">
                                    <div className="text-6xl font-black text-red-900 mb-4 group-hover:scale-110 transition-transform">{step.num}</div>
                                    <h3 className="text-lg font-bold mb-3 uppercase tracking-wider text-gray-900">{step.title}</h3>
                                    <p className="text-gray-600 text-sm">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="border-b-2 border-gray-200 relative">
                <div className="max-w-7xl mx-auto px-6 py-20 relative z-10">
                    <div className="bg-white border-4 border-red-600 p-16 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-5" style={{
                            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #dc2626 10px, #dc2626 20px)'
                        }}></div>
                        <div className="relative z-10">
                            <h2 className="text-5xl font-black mb-4 text-gray-900">READY TO PROTECT<br />YOUR <span className="text-red-600">BUSINESS</span>?</h2>
                            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto font-light">
                                Join hundreds of stores using VisionGuard to prevent theft and keep their premises safe
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Link href={"/overview"} className={"cursor-pointer"}>
                                    <button className="cursor-pointer bg-red-600 hover:bg-red-700 text-white px-10 py-4 text-lg transition-all border-2 border-red-600 hover:border-red-700 font-bold">
                                        CHECK MY STORE →
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <style jsx>{`
                @keyframes scan {
                    0% {
                        top: -10%;
                        opacity: 0;
                    }
                    10% {
                        opacity: 1;
                    }
                    90% {
                        opacity: 1;
                    }
                    100% {
                        top: 110%;
                        opacity: 0;
                    }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes float-delayed {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-scan {
                    animation: scan 4s ease-in-out infinite;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
                .animate-float-delayed {
                    animation: float-delayed 3s ease-in-out infinite 1.5s;
                }
            `}</style>
        </div>
    );
}