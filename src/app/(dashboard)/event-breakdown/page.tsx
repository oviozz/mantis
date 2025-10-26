"use client";

import React, {useState} from "react";
import {
    Video,
    Film,
} from "lucide-react";
import {useQuery} from "convex/react";
import {api} from "../../../../convex/_generated/api";
import {Id} from "../../../../convex/_generated/dataModel";
import {formatDateLabel, formatDuration} from "@/lib/utils";
import {VideoClipGeneratorBrowser} from "@/app/(dashboard)/event-breakdown/_components/video-clip-browser";

export default function FootageTimelineBuilder() {

    const [selectedFootageId, setSelectedFootageId] = useState<Id<"footages"> | null>(null);
    const availableFootage = useQuery(api.footages.getAll);

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
                            {availableFootage && availableFootage.length > 0 ? (
                                availableFootage.map((footage) => (
                                    <div
                                        key={footage._id}
                                        onClick={() => setSelectedFootageId(footage._id)}
                                        className={`border overflow-hidden ${
                                            selectedFootageId === footage._id
                                                ? "border-blue-600 bg-blue-50"
                                                : "border-gray-200 bg-white hover:border-gray-400"
                                        } cursor-pointer transition-all`}
                                    >
                                        <div className="relative">
                                            <video
                                                src={footage.videoUrl}
                                                className="w-full h-[180px] object-cover bg-black"
                                                muted
                                                playsInline
                                                preload="metadata"
                                                onLoadedMetadata={(e) => {
                                                    const video = e.currentTarget;
                                                    video.currentTime = 0;
                                                }}
                                                onCanPlay={(e) => {
                                                    const video = e.currentTarget;
                                                    video.pause();
                                                }}
                                                poster={footage.thumbnailUrl}
                                            />
                                            <div
                                                className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                                {formatDuration(footage.duration)}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="text-sm font-semibold text-gray-800">
                                                File name: {footage.footageName}
                                            </h3>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {formatDateLabel(footage._creationTime)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Film className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                    <p className="text-sm">No footage available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right side - event list and generation */}
                    <div className="lg:col-span-2">
                        {!selectedFootageId ? (
                            <div
                                className="text-gray-400 flex flex-col items-center justify-center border border-dashed border-gray-300 bg-white py-16">
                                <Video className="w-10 h-10 mb-3"/>
                                <p className="text-base font-medium">
                                    Select a footage to view detected events
                                </p>
                            </div>
                        ) : (
                            <div className="bg-white border border-gray-200 p-4 max-h-[700px] overflow-y-auto scrollbar-hide">
                                <VideoClipGeneratorBrowser footageId={selectedFootageId}/>
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