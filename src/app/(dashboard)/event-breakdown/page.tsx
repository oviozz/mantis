"use client";

import React, { useState } from "react";
import {
    Download,
    Check,
    Loader2,
    Clock,
    Video,
    Film,
} from "lucide-react";

type Footage = {
    id: number;
    name: string;
    duration: string;
    date: string;
    footageUrl: string;
};

type Event = {
    timestamp: string;
    camera: string;
    action: string;
    person: string;
    severity: string;
    duration: string;
};

type GeneratedTimeline = {
    duration: string;
    eventCount: number;
    compression: string;
};

export default function FootageTimelineBuilder() {
    const [selectedFootage, setSelectedFootage] = useState<number | null>(null);
    const [selectedEvents, setSelectedEvents] = useState<number[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generatedTimeline, setGeneratedTimeline] = useState<GeneratedTimeline | null>(null);

    const availableFootage: Footage[] = [
        {
            id: 1,
            name: "Entrance - Camera 01",
            duration: "02:34:12",
            date: "Oct 25, 2025 14:23",
            footageUrl:
                "https://cdn.pixabay.com/photo/2016/11/29/10/07/security-1862314_1280.jpg",
        },
        {
            id: 2,
            name: "Aisle 3 - Camera 02",
            duration: "01:52:09",
            date: "Oct 25, 2025 11:30",
            footageUrl:
                "https://cdn.pixabay.com/photo/2017/01/10/17/14/cctv-1977493_1280.jpg",
        },
        {
            id: 3,
            name: "Checkout - Camera 03",
            duration: "03:12:45",
            date: "Oct 24, 2025 16:10",
            footageUrl:
                "https://cdn.pixabay.com/photo/2017/06/19/11/09/cctv-2410263_1280.jpg",
        },
        {
            id: 4,
            name: "Storage Room - Camera 04",
            duration: "01:22:33",
            date: "Oct 23, 2025 19:40",
            footageUrl:
                "https://cdn.pixabay.com/photo/2018/03/22/20/54/cctv-3251530_1280.jpg",
        },
        {
            id: 5,
            name: "Back Exit - Camera 05",
            duration: "00:55:14",
            date: "Oct 22, 2025 21:10",
            footageUrl:
                "https://cdn.pixabay.com/photo/2016/11/29/10/07/security-1862315_1280.jpg",
        },
    ];

    const detectedEvents: Event[] = [
        {
            timestamp: "00:12:34",
            camera: "Camera 02",
            action: "Subject Enters Frame",
            person: "#4829",
            severity: "normal",
            duration: "5s",
        },
        {
            timestamp: "00:45:22",
            camera: "Camera 02",
            action: "Picks Up Item",
            person: "#4829",
            severity: "low",
            duration: "8s",
        },
        {
            timestamp: "01:23:18",
            camera: "Camera 02",
            action: "Conceals Item in Bag",
            person: "#4829",
            severity: "high",
            duration: "12s",
        },
        {
            timestamp: "02:08:33",
            camera: "Camera 01",
            action: "Exits Without Payment",
            person: "#4829",
            severity: "critical",
            duration: "10s",
        },
    ];

    const handleSelectFootage = (id: number) => {
        setSelectedFootage(id === selectedFootage ? null : id);
        setSelectedEvents([]);
        setGeneratedTimeline(null);
    };

    const toggleEvent = (index: number) => {
        setSelectedEvents((prev) =>
            prev.includes(index)
                ? prev.filter((x) => x !== index)
                : [...prev, index].sort((a, b) => a - b)
        );
    };

    const generateTimeline = () => {
        setIsGenerating(true);
        setGenerationProgress(0);

        const interval = setInterval(() => {
            setGenerationProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    setIsGenerating(false);
                    setGeneratedTimeline({
                        duration: "00:01:12",
                        eventCount: selectedEvents.length,
                        compression: "98.2%",
                    });
                    return 100;
                }
                return prev + 10;
            });
        }, 250);
    };

    const getSeverityColor = (severity: string) => {
        const map: Record<string, string> = {
            critical: "text-red-700 bg-red-100 border-red-500",
            high: "text-orange-700 bg-orange-100 border-orange-500",
            medium: "text-yellow-700 bg-yellow-100 border-yellow-500",
            low: "text-blue-700 bg-blue-100 border-blue-500",
            normal: "text-gray-700 bg-gray-100 border-gray-400",
        };
        return map[severity] || map["normal"];
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Top section: both headings in one line */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-base font-bold uppercase">1. Select Footage</h2>
                    <h2 className="text-base font-bold uppercase">2. Review Events</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left panel - scrollable footage list */}
                    <div>
                        <div className="p-4 space-y-4 border border-gray-200 bg-white overflow-y-auto h-[750px] scrollbar-hide">
                            {availableFootage.map((footage) => (
                                <div
                                    key={footage.id}
                                    onClick={() => handleSelectFootage(footage.id)}
                                    className={`border ${
                                        selectedFootage === footage.id
                                            ? "border-blue-600 bg-blue-50"
                                            : "border-gray-200 bg-white hover:border-gray-400"
                                    } cursor-pointer transition-all`}
                                >
                                    <div className="relative">
                                        <img
                                            src={footage.footageUrl}
                                            alt={footage.name}
                                            className="w-full h-36 object-cover"
                                        />
                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1">
                                            {footage.duration}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-semibold text-gray-800">
                                            {footage.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 font-mono">
                                            {footage.date}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right side - event list and generation */}
                    <div className="lg:col-span-2">
                        {!selectedFootage ? (
                            <div className="text-gray-400 flex flex-col items-center justify-center border border-dashed border-gray-300 bg-white py-16">
                                <Video className="w-10 h-10 mb-3" />
                                <p className="text-base font-medium">
                                    Select a footage to view detected events
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 p-4 max-h-[500px] overflow-y-auto scrollbar-hide">
                                {detectedEvents.map((event, i) => (
                                    <div
                                        key={i}
                                        onClick={() => toggleEvent(i)}
                                        className={`p-3 mb-2 border cursor-pointer ${
                                            selectedEvents.includes(i)
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-gray-200 hover:border-gray-400"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-gray-800 font-semibold">
                          {event.timestamp}
                        </span>
                                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5">
                          {event.duration}
                        </span>
                                                <span
                                                    className={`text-xs font-bold border px-2 py-0.5 ${getSeverityColor(
                                                        event.severity
                                                    )}`}
                                                >
                          {event.severity.toUpperCase()}
                        </span>
                                            </div>
                                            {selectedEvents.includes(i) && (
                                                <Check className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div className="mt-1 text-sm font-medium text-gray-900">
                                            {event.action}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-1">
                                            {event.camera} • Person {event.person}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Generation */}
                        {selectedFootage && (
                            <div className="mt-6">
                                <h2 className="text-sm font-semibold mb-3 text-gray-700 uppercase">
                                    3. Generate Timeline
                                </h2>

                                {isGenerating ? (
                                    <div className="p-4 border border-blue-500 bg-blue-50 mb-3">
                                        <div className="flex items-center gap-3 mb-3">
                                            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            <p className="text-sm font-medium text-blue-800">
                                                Generating condensed video... ({generationProgress}%)
                                            </p>
                                        </div>
                                        <div className="w-full h-2 bg-white border border-blue-300 overflow-hidden">
                                            <div
                                                className="h-full bg-blue-600 transition-all"
                                                style={{ width: `${generationProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : generatedTimeline ? (
                                    <div className="p-4 border border-green-500 bg-green-50 mb-3">
                                        <div className="flex items-center gap-3">
                                            <Check className="w-5 h-5 text-green-600" />
                                            <p className="text-sm text-green-800 font-semibold">
                                                Timeline Generated — {generatedTimeline.duration}
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                <button
                                    onClick={generateTimeline}
                                    disabled={!selectedEvents.length || isGenerating}
                                    className={`w-full py-3 font-semibold text-white ${
                                        !selectedEvents.length || isGenerating
                                            ? "bg-gray-300 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700"
                                    }`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Generate Timeline
                                    </div>
                                </button>

                                {generatedTimeline && !isGenerating && (
                                    <div className="flex flex-col sm:flex-row gap-3 mt-3">
                                        <button className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
                                            <div className="flex items-center justify-center gap-2">
                                                <Film className="w-4 h-4" />
                                                View Breakdown Video
                                            </div>
                                        </button>
                                        <button className="flex-1 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 transition">
                                            <div className="flex items-center justify-center gap-2">
                                                <Download className="w-4 h-4" />
                                                Download Video
                                            </div>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Hide scrollbar globally */}
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}
