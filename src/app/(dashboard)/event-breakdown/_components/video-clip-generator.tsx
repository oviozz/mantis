import {useState} from "react";
import {useQuery} from "convex/react";
import {Id} from "../../../../../convex/_generated/dataModel";
import {api} from "../../../../../convex/_generated/api";

interface VideoClipGeneratorProps {
    footageId: Id<"footages">;
}

export function VideoClipGenerator({ footageId }: VideoClipGeneratorProps) {

    const footageData = useQuery(api.footages.getAnalysisById, {id: footageId});
    const [selectedTimestamps, setSelectedTimestamps] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);

    if (!footageData || !footageData.analysis) {
        return <div className="p-4">Loading footage analysis...</div>;
    }

    const {videoUrl} = footageData;
    const {timestamps} = footageData.analysis;

    const toggleTimestamp = (timestamp: string) => {
        setSelectedTimestamps((prev) =>
            prev.includes(timestamp)
                ? prev.filter((t) => t !== timestamp)
                : [...prev, timestamp]
        );
    };

    const generateClip = async () => {
        if (selectedTimestamps.length === 0) {
            alert("Please select at least one timestamp");
            return;
        }

        setIsGenerating(true);
        setGeneratedVideoUrl(null);

        try {
            // Call your backend API to generate the clip
            const response = await fetch("/api/generate-clip", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    videoUrl,
                    timestamps: selectedTimestamps,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate clip");
            }

            // Get the blob URL for the generated video
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setGeneratedVideoUrl(url);
        } catch (error) {
            console.error("Error generating clip:", error);
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Generate Video Clip</h2>
                <p className="text-gray-600 mb-4">
                    Footage: {footageData.footageName} ({footageData.duration}s)
                </p>

                {/* Timestamp Selection */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Select Timestamps</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {timestamps.map((ts, index) => (
                            <div
                                key={index}
                                onClick={() => toggleTimestamp(ts.timestamp)}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                    selectedTimestamps.includes(ts.timestamp)
                                        ? "border-blue-500 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono font-semibold text-blue-600">
                        {ts.timestamp}
                      </span>
                                            <span
                                                className={`px-2 py-1 rounded text-xs font-medium ${
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
                                            <span
                                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {ts.action}
                      </span>
                                        </div>
                                        <p className="text-gray-700 text-sm">{ts.description}</p>
                                    </div>
                                    <div className="ml-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedTimestamps.includes(ts.timestamp)}
                                            onChange={() => toggleTimestamp(ts.timestamp)}
                                            className="w-5 h-5 text-blue-600"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Count */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        Selected: <span className="font-semibold">{selectedTimestamps.length}</span> timestamp
                        {selectedTimestamps.length !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Generate Button */}
                <button
                    onClick={generateClip}
                    disabled={isGenerating || selectedTimestamps.length === 0}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isGenerating ? "Generating Clip..." : "Generate Video Clip"}
                </button>
            </div>

            {/* Generated Video Preview & Download */}
            {generatedVideoUrl && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-xl font-bold mb-4">Generated Clip</h3>
                    <video
                        src={generatedVideoUrl}
                        controls
                        className="w-full rounded-lg mb-4"
                    >
                        Your browser does not support the video tag.
                    </video>
                    <button
                        onClick={downloadClip}
                        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        Download Video Clip
                    </button>
                </div>
            )}
        </div>
    );
}