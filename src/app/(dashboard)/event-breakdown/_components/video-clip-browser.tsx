"use client";
import {useState, useRef, useEffect} from "react";
import {useQuery} from "convex/react";
import {FFmpeg} from "@ffmpeg/ffmpeg";
import {fetchFile, toBlobURL} from "@ffmpeg/util";
import {Id} from "../../../../../convex/_generated/dataModel";
import {api} from "../../../../../convex/_generated/api";
import {Loader2, Download, Share2, Save} from "lucide-react";

// Simple PopDialog
function PopDialog({open, onClose, title, children}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white w-11/12 max-w-4xl p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-800 font-bold">X</button>
                </div>
                {children}
            </div>
        </div>
    );
}

interface VideoClipGeneratorBrowserProps {
    footageId: Id<"footages">;
}

export function VideoClipGeneratorBrowser({footageId}: VideoClipGeneratorBrowserProps) {
    const footageData = useQuery(api.footages.getAnalysisById, {id: footageId});
    const [selectedTimestamps, setSelectedTimestamps] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [showPopup, setShowPopup] = useState(false);
    const ffmpegRef = useRef<FFmpeg | null>(null);
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);
    const [listHeight, setListHeight] = useState<number>(400);

    useEffect(() => {
        if (listRef.current) setListHeight(listRef.current.offsetHeight);
    }, [footageData]);

    if (!footageData || !footageData.analysis) return <div className="p-4">Loading footage analysis...</div>;

    const {videoUrl} = footageData;
    const {timestamps} = footageData.analysis;

    const loadFFmpeg = async () => {
        if (ffmpegRef.current || ffmpegLoaded) return;

        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;

        ffmpeg.on("progress", ({progress}) => setProgress(Math.round(progress * 100)));

        const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
        await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        setFfmpegLoaded(true);
    };

    const toggleTimestamp = (timestamp: string) => {
        setSelectedTimestamps((prev) =>
            prev.includes(timestamp) ? prev.filter((t) => t !== timestamp) : [...prev, timestamp]
        );
    };

    const timestampToSeconds = (timestamp: string) => {
        const parts = timestamp.split(":").map(Number);
        return parts.length === 2 ? parts[0] * 60 + parts[1] : parts[0] * 3600 + parts[1] * 60 + parts[2];
    };

    const formatSeconds = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return hours > 0
            ? `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
                .toString()
                .padStart(2, "0")}`
            : `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    };

    const createSegments = (timestamps: string[], contextSeconds = 5) => {
        const tsSeconds = timestamps.map(timestampToSeconds).sort((a, b) => a - b);
        const segments: { start: string; end: string; duration: number }[] = [];
        for (const ts of tsSeconds) {
            const start = Math.max(0, ts - contextSeconds);
            const end = ts + contextSeconds;
            if (segments.length > 0 && start <= timestampToSeconds(segments[segments.length - 1].end)) {
                const last = segments[segments.length - 1];
                last.end = formatSeconds(Math.max(end, timestampToSeconds(last.end)));
                last.duration = timestampToSeconds(last.end) - timestampToSeconds(last.start);
            } else segments.push({start: formatSeconds(start), end: formatSeconds(end), duration: end - start});
        }
        return segments;
    };

    const generateClip = async () => {
        if (selectedTimestamps.length === 0) return alert("Select at least one timestamp");
        setIsGenerating(true);
        setGeneratedVideoUrl(null);
        setProgress(0);

        try {
            await loadFFmpeg();
            const ffmpeg = ffmpegRef.current;
            if (!ffmpeg) throw new Error("FFmpeg not loaded");

            const videoData = await fetchFile(videoUrl);
            await ffmpeg.writeFile("input.mp4", videoData);

            const segments = createSegments(selectedTimestamps, 5);

            for (let i = 0; i < segments.length; i++) {
                const seg = segments[i];
                setProgress(Math.round(((i + 1) / segments.length) * 50));
                await ffmpeg.exec(["-i", "input.mp4", "-ss", seg.start, "-to", seg.end, "-c", "copy", `segment_${i}.mp4`]);
            }

            const concatContent = segments.map((_, i) => `file 'segment_${i}.mp4'`).join("\n");
            await ffmpeg.writeFile("concat.txt", new TextEncoder().encode(concatContent));
            setProgress(75);
            await ffmpeg.exec(["-f", "concat", "-safe", "0", "-i", "concat.txt", "-c", "copy", "output.mp4"]);
            setProgress(100);

            const data = await ffmpeg.readFile("output.mp4");

            if (typeof data === 'string') {
                throw new Error('Expected binary data, got string');
            }

// Create a new Uint8Array with a proper ArrayBuffer
            const buffer = new ArrayBuffer(data.length);
            const uint8Array = new Uint8Array(buffer);
            uint8Array.set(data);

            const blob = new Blob([uint8Array], {type: "video/mp4"});
            setGeneratedVideoUrl(URL.createObjectURL(blob));
            setShowPopup(true);

        } catch (e) {
            console.error(e);
            alert("Failed to generate video clip");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadClip = () => {
        if (!generatedVideoUrl) return;
        const a = document.createElement("a");
        a.href = generatedVideoUrl;
        a.download = `clip-${footageData.footageName}-${Date.now()}.mp4`;
        a.click();
    };

    return (
        <div className="min-h-screen mx-auto space-y-6">
            <div ref={listRef} className="overflow-y-auto border border-gray-200 flex flex-col gap-4">
                {timestamps.map((ts, i) => (
                    <div
                        key={i}
                        onClick={() => toggleTimestamp(ts.timestamp)}
                        className={`flex justify-between items-start p-4 cursor-pointer ${
                            selectedTimestamps.includes(ts.timestamp) ? "bg-blue-50 border-blue-500" : "hover:bg-gray-50 border-gray-200"
                        } border`}
                    >
                        <div>
                            <div className="flex gap-3 items-center mb-1">
                                <span className="font-mono text-blue-600">{ts.timestamp}</span>
                                <span
                                    className={`px-2 text-sm font-medium ${
                                        ts.severity === "critical"
                                            ? "bg-red-100 text-red-700"
                                            : ts.severity === "high"
                                                ? "bg-orange-100 text-orange-700"
                                                : ts.severity === "medium"
                                                    ? "bg-yellow-100 text-yellow-700"
                                                    : "bg-green-100 text-green-700"
                                    }`}
                                >
                  {ts.severity}
                </span>
                                <span className="px-2 bg-gray-100 text-gray-700 text-xs">{ts.action}</span>
                            </div>
                            <p className="text-gray-700 text-sm">{ts.description}</p>
                        </div>
                        <input
                            type="checkbox"
                            checked={selectedTimestamps.includes(ts.timestamp)}
                            onChange={() => toggleTimestamp(ts.timestamp)}
                            className="w-5 h-5 mt-1"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                ))}
            </div>

            {/* Generate Button */}
            <div>
                {isGenerating && (
                    <div className="my-5 p-3 border border-blue-500 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-600"/>
                            <span className="text-sm font-medium text-blue-800">Generating video... ({progress}%)</span>
                        </div>
                        <div className="w-full h-2 bg-white border border-blue-300 overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all" style={{width: `${progress}%`}}/>
                        </div>
                    </div>
                )}

                <button
                    onClick={generateClip}
                    disabled={isGenerating || selectedTimestamps.length === 0}
                    className={`w-full py-3 font-semibold text-white ${
                        isGenerating || selectedTimestamps.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                    Generate Video Clip
                </button>
            </div>

            {/* Popup Dialog */}
            <PopDialog open={showPopup} onClose={() => setShowPopup(false)} title="Generated Video">
                {generatedVideoUrl &&
                    <video src={generatedVideoUrl} controls className={`w-full h-[${listHeight}px]`}/>}
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => alert("Sending to Police...")}
                        className="flex-1 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2"
                    >
                        <Share2 className="w-4 h-4"/> Send to Police
                    </button>
                    <button
                        onClick={() => alert("Saving to Drive...")}
                        className="flex-1 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4"/> Save to Drive
                    </button>
                    <button
                        onClick={downloadClip}
                        className="flex-1 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 transition flex items-center justify-center gap-2"
                    >
                        <Download className="w-4 h-4"/> Download
                    </button>
                </div>
            </PopDialog>
        </div>
    );
}
