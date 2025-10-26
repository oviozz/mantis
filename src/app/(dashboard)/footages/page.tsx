"use client";

import React, {useMemo} from "react";
import Link from "next/link";
import {useQuery} from "convex/react";
import {cn} from "@/lib/utils";
import {api} from "../../../../convex/_generated/api";
import {Video, FolderOpen} from "lucide-react";

type FootageItem = {
    _id: string;
    createdAt: string;
    type: "weapon" | "theft" | "upload";
    duration: number;
    thumbnailUrl: string;
    videoUrl: string;
    footageName: string;
    status: "COMPLETED" | "REVIEWING";
};

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h} hr ${m} min ${s} sec`;
    if (m > 0) return `${m} min ${s} sec`;
    return `${s} sec`;
}

function formatDateLabel(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
    };
    return date.toLocaleDateString(undefined, options);
}

function groupByTime(logs: FootageItem[]) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const today: FootageItem[] = [];
    const thisWeek: FootageItem[] = [];
    const earlier: FootageItem[] = [];

    logs.forEach((log) => {
        const date = new Date(log.createdAt);
        if (date >= startOfToday) {
            today.push(log);
        } else if (date >= startOfWeek) {
            thisWeek.push(log);
        } else {
            earlier.push(log);
        }
    });

    return {today, thisWeek, earlier};
}

export default function VideoFootageGrid() {
    const data = useQuery(api.footages.getAll, {});
    const loading = data === undefined;

    const {today, thisWeek, earlier} = useMemo(() => {
        const normalizedData =
            (data || []).map((item) => ({
                ...item,
                createdAt:
                    item.createdAt ?? new Date(item._creationTime).toISOString(),
            })) as FootageItem[];

        return groupByTime(normalizedData);
    }, [data]);

    const renderGroup = (title: string, logs: FootageItem[]) => {
        if (logs.length === 0) return null;
        return (
            <div className="mb-10">
                <h3 className="text-2xl font-bold mb-4">{title}</h3>
                {loading ? (
                    <LoadingSkeleton/>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {logs.map((log) => (
                            <Link
                                key={log._id}
                                href={`/footages/${log._id}`}
                                className={cn(
                                    "group border border-gray-300 bg-white transition-all cursor-pointer hover:-translate-y-0.5 hover:border-gray-500 overflow-hidden"
                                )}
                            >
                                <div className="relative overflow-hidden">
                                    <video
                                        src={log.videoUrl}
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
                                        poster={log.thumbnailUrl}
                                    />
                                    {log.type !== "upload" && (
                                        <div
                                            className={cn(
                                                "absolute top-2 left-2 px-2 py-1 text-xs font-semibold uppercase tracking-wide border rounded",
                                                log.type === "weapon"
                                                    ? "text-red-700 bg-red-100 border-red-500"
                                                    : "text-orange-700 bg-orange-100 border-orange-500"
                                            )}
                                        >
                                            {log.type === "weapon"
                                                ? "Weapon Detected"
                                                : "Theft Detected"}
                                        </div>
                                    )}
                                    <div
                                        className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                        {formatDuration(log.duration)}
                                    </div>
                                </div>

                                <div className="p-3 border-t border-gray-200">
                                    <p className="font-semibold text-gray-900 text-base group-hover:text-gray-700">
                                        {log.footageName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatDateLabel(log.createdAt)}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const hasAnyFootage =
        (today.length > 0 || thisWeek.length > 0 || earlier.length > 0) && !loading;

    return (
        <div className="w-full min-h-screen bg-gray-50 p-8 text-gray-900">
            <div className="max-w-7xl mx-auto">
                {loading ? (
                    <>
                        <h3 className="text-2xl font-bold mb-4">Today</h3>
                        <LoadingSkeleton/>
                    </>
                ) : hasAnyFootage ? (
                    <>
                        {renderGroup("Today", today)}
                        {renderGroup("This Week", thisWeek)}
                        {renderGroup("Earlier", earlier)}
                    </>
                ) : (
                    <EmptyState/>
                )}
            </div>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center text-gray-600">
            <div className="bg-gray-100 p-6 rounded-full mb-6">
                <FolderOpen strokeWidth={2} className="w-12 h-12 text-gray-400"/>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                No Footage Available
            </h2>
            <p className="text-base text-gray-500 mb-6">
                You haven’t uploaded or detected any videos yet.
            </p>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[...Array(6)].map((_, i) => (
                <div
                    key={i}
                    className="border border-gray-300 bg-white overflow-hidden"
                >
                    <div className="h-[180px] w-full bg-gray-200"/>
                    <div className="p-3 border-t border-gray-200 space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded"/>
                        <div className="h-3 w-1/2 bg-gray-200 rounded"/>
                    </div>
                </div>
            ))}
        </div>
    );
}
