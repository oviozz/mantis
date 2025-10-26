"use client";

import React, {useState, useRef, useEffect} from "react";
import {useQuery} from "convex/react";
import {
    Play,
    Pause,
    Volume2,
    Maximize,
    AlertTriangle,
    ChevronRight,
} from "lucide-react";
import {FaSpinner} from "react-icons/fa";
import {api} from "../../../../../convex/_generated/api";
import {Id} from "../../../../../convex/_generated/dataModel";

type FootageAnalysisProps = {
    footageID: Id<"footages">;
};

type Subtitle = {
    start: string;
    end: string;
    speaker: string;
    text: string;
    tone: string;
};

export default function FootageAnalytics({footageID}: FootageAnalysisProps) {

    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);

    // Fetch footage with analysis from Convex
    const footage = useQuery(api.footages.getWithAnalysis, {id: footageID});

    // THIS IS THE CORRECTED CODE BLOCK
    // This effect now correctly re-runs whenever the video URL changes.
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            setCurrentTime(video.currentTime);
        };

        const handleLoadedMetadata = () => {
            setDuration(video.duration);
        };

        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);

        // Cleanup function to remove listeners from the old video element
        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
        };
    }, [footage?.videoUrl]); // FIX: Dependency array now includes the video URL

    const timestampToSeconds = (timestamp: string): number => {
        const parts = timestamp.split(":");
        if (parts.length === 2) {
            const [minutes, seconds] = parts.map(Number);
            return minutes * 60 + seconds;
        } else if (parts.length === 3) {
            const [hours, minutes, seconds] = parts.map(Number);
            return hours * 3600 + minutes * 60 + seconds;
        }
        return 0;
    };

    // Update current subtitle based on video time
    useEffect(() => {
        if (!footage?.analysis?.subtitles) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentSubtitle(null);
            return;
        }

        const subtitles = footage.analysis.subtitles;
        const activeSubtitle = subtitles.find((sub) => {
            const startSeconds = timestampToSeconds(sub.start);
            const endSeconds = timestampToSeconds(sub.end);
            return currentTime >= startSeconds && currentTime <= endSeconds;
        });

        setCurrentSubtitle(activeSubtitle || null);
    }, [currentTime, footage?.analysis?.subtitles]);

    // Convert seconds to timestamp string
    const secondsToTimestamp = (seconds: number): string => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hrs > 0) {
            return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        }
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Jump to specific timestamp
    const jumpToTimestamp = (timestamp: string) => {
        const seconds = timestampToSeconds(timestamp);
        if (videoRef.current) {
            videoRef.current.currentTime = seconds;
            if (!isPlaying) {
                videoRef.current.play().catch(error => {
                    // It's still good practice to catch potential errors
                    if (error.name !== 'AbortError') {
                        console.error("Error playing video:", error);
                    }
                });
            }
        }
    };

    // Toggle play/pause
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play().catch(error => {
                    if (error.name !== 'AbortError') {
                        console.error("Error playing video:", error);
                    }
                });
            }
        }
    };

    // Toggle volume
    const toggleVolume = () => {
        if (videoRef.current) {
            const newVolume = volume > 0 ? 0 : 1;
            videoRef.current.volume = newVolume;
            setVolume(newVolume);
        }
    };

    // Toggle fullscreen
    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                videoRef.current.requestFullscreen();
            }
        }
    };

    // Seek video
    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        if (videoRef.current && isFinite(newTime)) {
            videoRef.current.currentTime = newTime;
        }
    };

    // Get subtitle styling based on speaker/tone
    const getSubtitleStyle = (subtitle: Subtitle) => {
        const speaker = subtitle.speaker.toLowerCase();
        const tone = subtitle.tone.toLowerCase();

        // Color coding based on speaker
        if (speaker.includes("weapon") || speaker.includes("shooting")) {
            return "bg-red-900/95 text-white border-red-600";
        } else if (speaker.includes("stealing")) {
            return "bg-orange-900/95 text-white border-orange-600";
        } else if (tone === "threat") {
            return "bg-red-900/95 text-white border-red-600";
        } else if (tone === "scared" || tone === "panic") {
            return "bg-yellow-900/95 text-white border-yellow-600";
        } else {
            return "bg-black/90 text-white border-gray-600";
        }
    };

    // Get event color
    const getEventColor = (action: string) => {
        switch (action.toLowerCase()) {
            case "weapon":
                return "bg-red-600";
            case "theft":
                return "bg-orange-600";
            case "suspicious":
                return "bg-yellow-500";
            default:
                return "bg-gray-400";
        }
    };

    const getEventBorderColor = (action: string) => {
        switch (action.toLowerCase()) {
            case "weapon":
                return "border-red-600";
            case "theft":
                return "border-orange-600";
            case "suspicious":
                return "border-yellow-500";
            default:
                return "border-gray-400";
        }
    };

    const getSeverityBadge = (severity: string) => {
        const colors = {
            critical: "bg-red-50 border-red-600 text-red-700",
            high: "bg-orange-50 border-orange-600 text-orange-700",
            medium: "bg-yellow-50 border-yellow-600 text-yellow-700",
            low: "bg-blue-50 border-blue-600 text-blue-700"
        };
        return colors[severity as keyof typeof colors] || colors.low;
    };

    if (footage === undefined) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <FaSpinner className="w-18 h-18 mx-auto mb-4 animate-spin"/>
                    <p className="text-gray-700 font-bold text-lg">Loading footage...</p>
                </div>
            </div>
        );
    }

    if (footage === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-2xl font-black text-gray-900">FOOTAGE NOT FOUND</p>
                </div>
            </div>
        );
    }

    const totalSeconds = duration || footage.duration;
    const analysis = footage.analysis;

    const sortedTimestamps = analysis?.timestamps
        ? [...analysis.timestamps].sort((a, b) => {
            const timeA = timestampToSeconds(a.timestamp);
            const timeB = timestampToSeconds(b.timestamp);
            return timeA - timeB;
        })
        : [];

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Video Player */}
                <div className="bg-white border border-gray-300 mb-6">
                    <div className="relative bg-gray-900">
                        <video
                            ref={videoRef}
                            src={footage.videoUrl}
                            className="w-full h-[26rem] object-contain"
                            poster={footage.thumbnailUrl}
                        />

                        {/* Subtitles Overlay */}
                        {currentSubtitle && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 max-w-3xl px-4">
                                <div className={`${getSubtitleStyle(currentSubtitle)} px-6 py-3 border-2`}>
                                    <div className="text-xs font-bold mb-1 opacity-90">
                                        {currentSubtitle.speaker.toUpperCase()}
                                    </div>
                                    <div className="text-lg font-semibold text-center leading-tight">
                                        {currentSubtitle.text}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Threat Overlays */}
                        {analysis && (
                            <div className="absolute top-4 left-4 flex flex-col gap-2">
                                <div
                                    className="bg-red-600 text-white px-3 py-1 text-xs font-bold flex items-center gap-2">
                                    <AlertTriangle size={14}/>
                                    {analysis.detectionType.toUpperCase()}
                                </div>
                                <div className="bg-black/80 text-white px-3 py-1 text-xs font-mono">
                                    {footage.footageName}
                                </div>
                            </div>
                        )}

                        {/* Playing Indicator - Top Right */}
                        {isPlaying && (
                            <div
                                className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 text-xs font-bold flex items-center gap-2">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                PLAYING
                            </div>
                        )}

                        {/* Time Display - Bottom Right */}
                        <div className="absolute bottom-4 right-4 bg-black/80 text-white px-3 py-1 text-sm font-mono">
                            {secondsToTimestamp(currentTime)} / {secondsToTimestamp(totalSeconds)}
                        </div>
                    </div>

                    {/* Video Controls */}
                    <div className="border-t border-gray-300 p-4 bg-white">
                        {/* Video Timeline */}
                        <div className="mb-4">
                            <div
                                className="relative h-12 bg-gray-100 border border-gray-300 cursor-pointer"
                                onClick={handleTimelineClick}
                            >
                                <div
                                    className="absolute h-full bg-neutral-400 opacity-40"
                                    style={{width: `${(currentTime / totalSeconds) * 100}%`}}
                                ></div>

                                {sortedTimestamps.map((event, i) => {
                                    const eventSeconds = timestampToSeconds(event.timestamp);
                                    const isNearCurrent = Math.abs(currentTime - eventSeconds) < 2;

                                    return (
                                        <div
                                            key={i}
                                            className="absolute top-0 bottom-0 group"
                                            style={{left: `${(eventSeconds / totalSeconds) * 100}%`}}
                                            onMouseEnter={() => setHoveredEvent(i)}
                                            onMouseLeave={() => setHoveredEvent(null)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                jumpToTimestamp(event.timestamp);
                                            }}
                                        >
                                            <div
                                                className={`w-1 h-full ${getEventColor(event.action)} cursor-pointer group-hover:w-2 transition-all ${
                                                    isNearCurrent ? 'w-2' : ''
                                                }`}
                                            />

                                            {hoveredEvent === i && (
                                                <div
                                                    className="absolute bottom-full mb-2 -translate-x-1/2 left-1/2 z-10">
                                                    <div
                                                        className={`bg-white border-2 ${getEventBorderColor(event.action)} p-3 max-w-xs w-max min-w-[200px]`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div
                                                                className={`w-2 h-2 flex-shrink-0 ${getEventColor(event.action)}`}></div>
                                                            <span
                                                                className="font-mono text-xs font-bold text-gray-900">{event.timestamp}</span>
                                                        </div>
                                                        <div
                                                            className="text-sm text-gray-900 mb-2 break-words">{event.description}</div>
                                                        <div
                                                            className={`text-xs px-2 py-0.5 border ${getSeverityBadge(event.severity)} inline-block`}>
                                                            {event.action.toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`w-3 h-3 bg-white border-b-2 border-r-2 ${getEventBorderColor(event.action)} rotate-45 mx-auto -mt-1.5`}></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-600 z-20 pointer-events-none"
                                    style={{left: `${(currentTime / totalSeconds) * 100}%`}}
                                />

                                <div
                                    className="absolute inset-x-0 bottom-0 flex justify-between px-2 pb-1 text-xs font-mono text-gray-500 pointer-events-none">
                                    <span>00:00</span>
                                    <span>{secondsToTimestamp(totalSeconds / 4)}</span>
                                    <span>{secondsToTimestamp(totalSeconds / 2)}</span>
                                    <span>{secondsToTimestamp((totalSeconds * 3) / 4)}</span>
                                    <span>{secondsToTimestamp(totalSeconds)}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mt-3 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-red-600"></div>
                                    <span className="text-gray-600">Weapon</span></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-600"></div>
                                    <span className="text-gray-600">Theft</span></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500"></div>
                                    <span className="text-gray-600">Suspicious</span></div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-400"></div>
                                    <span className="text-gray-600">Normal</span></div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button onClick={togglePlay}
                                        className="w-10 h-10 border border-gray-400 hover:border-gray-600 flex items-center justify-center transition-colors">
                                    {isPlaying ? <Pause size={20}/> : <Play size={20}/>}
                                </button>
                                <button onClick={toggleVolume}
                                        className="w-10 h-10 border border-gray-400 hover:border-gray-600 flex items-center justify-center transition-colors">
                                    <Volume2 size={20} className={volume === 0 ? "opacity-50" : ""}/>
                                </button>
                                <span className="text-sm font-mono text-gray-700">
                                    {secondsToTimestamp(currentTime)} / {secondsToTimestamp(totalSeconds)}
                                </span>
                                {isPlaying && (
                                    <div
                                        className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-600">
                                        <div
                                            className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-blue-600 border-b-[4px] border-b-transparent"></div>
                                        <span className="text-xs font-bold text-blue-600">PLAYING</span>
                                    </div>
                                )}
                            </div>
                            <button onClick={toggleFullscreen}
                                    className="w-10 h-10 border border-gray-400 hover:border-gray-600 flex items-center justify-center transition-colors">
                                <Maximize size={20}/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Timeline Details */}
                {analysis && analysis.timestamps.length > 0 && (
                    <div className="bg-white border border-gray-300 px-5 py-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Timeline Details</h2>

                        <div
                            className="flex flex-row overflow-x-auto gap-3 scroll-smooth scrollbar-thin scrollbar-hide"
                        >
                            {analysis.timestamps.map((event, i) => {
                                const eventSeconds = timestampToSeconds(event.timestamp);
                                const isCurrentEvent = currentTime >= eventSeconds && currentTime < eventSeconds + 2;
                                const refCallback = (el: HTMLButtonElement | null) => {
                                    if (isCurrentEvent && el) {
                                        el.scrollIntoView({behavior: "smooth", inline: "center", block: "nearest"});
                                    }
                                };

                                return (
                                    <button
                                        key={i}
                                        ref={refCallback}
                                        onClick={() => jumpToTimestamp(event.timestamp)}
                                        className={`flex-none w-96 border px-5 py-4 text-left transition-colors duration-200 ${
                                            isCurrentEvent
                                                ? "bg-neutral-100 border-border-700 border border-dashed border-blue-500"
                                                : "bg-white border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-mono font-bold text-gray-900">{event.timestamp}</span>
                                            <span
                                                className={`text-xs px-2 py-1 border ${getSeverityBadge(event.severity)}`}>
                                                {event.action.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-4">{event.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Analyzing State */}
                {!analysis && footage.status === "REVIEWING" && (
                    <div className="bg-white border border-gray-300 p-12 text-center">
                        <FaSpinner className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin"/>
                        <p className="text-lg font-bold text-gray-900 mb-2">ANALYZING FOOTAGE</p>
                        <p className="text-sm text-gray-600">AI is processing the video timeline...</p>
                    </div>
                )}

                {/* No Analysis State */}
                {!analysis && footage.status === "COMPLETED" && (
                    <div className="bg-white border border-gray-300 p-12 text-center">
                        <p className="text-lg font-bold text-gray-900 mb-2">NO ANALYSIS AVAILABLE</p>
                        <p className="text-sm text-gray-600">This footage has not been analyzed yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}