
"use client";

import {VideoOff} from "lucide-react";
import React, {useEffect, useState, useRef, useCallback} from "react";
import TestAlerts from "@/app/(dashboard)/overview/_components/test-alerts";
import { FaSpinner } from "react-icons/fa";

interface Detection {
    type: "theft" | "weapon" | "face";
    bbox: number[]; // [x, y, width, height]
    confidence: number;
    label: string;
}

interface WSResponse {
    frame_id: string;
    ok: boolean;
    detections: Detection[];
    counts: {
        theft: number;
        weapon: number;
        face: number;
    };
    processing_time_ms: number;
    errors?: string[];
}

export default function CameraModel() {
    const [cameraOn, setCameraOn] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [detectionCounts, setDetectionCounts] = useState({theft: 0, weapon: 0, face: 0});
    const [processingTime, setProcessingTime] = useState<number>(0);
    const [wsConnected, setWsConnected] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const frameIdRef = useRef(0);

    // Clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        // Update with your actual WebSocket URL
        const wsUrl = "ws://localhost:8000/analysis/ws/analyze?conf_thresh=0.5";

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log("WebSocket connected");
                setWsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const response: WSResponse = JSON.parse(event.data);

                    if (response.ok && response.detections) {
                        setDetections(response.detections);
                        setDetectionCounts(response.counts);
                        setProcessingTime(response.processing_time_ms);
                    }

                    if (response.errors) {
                        console.error("Detection errors:", response.errors);
                    }
                } catch (err) {
                    console.error("Error parsing WebSocket message:", err);
                }
            };

            ws.onerror = (err) => {
                console.error("WebSocket error:", err);
                setError("WebSocket connection error");
                setWsConnected(false);
            };

            ws.onclose = () => {
                console.log("WebSocket closed");
                setWsConnected(false);
            };

            wsRef.current = ws;
        } catch (err) {
            console.error("Error creating WebSocket:", err);
            setError("Failed to connect to analysis server");
        }
    }, []);

    // Send frame to WebSocket
    const sendFrameToWS = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }

        if (!videoRef.current || !canvasRef.current) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // Set canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert to base64
        const base64Image = canvas.toDataURL("image/jpeg", 0.8);

        // Send to WebSocket
        const message = {
            frame_id: `frame_${frameIdRef.current++}`,
            image_b64: base64Image
        };

        try {
            wsRef.current.send(JSON.stringify(message));
        } catch (err) {
            console.error("Error sending frame:", err);
        }
    }, []);

    // Draw bounding boxes on canvas
    const drawBoundingBoxes = useCallback(() => {
        if (!canvasRef.current || !videoRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw each detection
        detections.forEach((detection) => {
            const [x, y, w, h] = detection.bbox;

            // Determine color based on type
            let color: string;
            let bgColor: string;
            switch (detection.type) {
                case "theft":
                    color = "#FCD34D"; // yellow
                    bgColor = "rgba(252, 211, 77, 0.2)";
                    break;
                case "weapon":
                    color = "#EF4444"; // red
                    bgColor = "rgba(239, 68, 68, 0.2)";
                    break;
                case "face":
                    color = "#3B82F6"; // blue
                    bgColor = "rgba(59, 130, 246, 0.2)";
                    break;
                default:
                    color = "#9CA3AF"; // gray
                    bgColor = "rgba(156, 163, 175, 0.2)";
            }

            // Check if bbox is normalized (0-1) or pixel coordinates
            const isNormalized = x <= 1 && y <= 1 && w <= 1 && h <= 1;

            let boxX, boxY, boxW, boxH;
            if (isNormalized) {
                // Convert normalized coordinates to pixel coordinates
                boxX = x * canvas.width;
                boxY = y * canvas.height;
                boxW = w * canvas.width;
                boxH = h * canvas.height;
            } else {
                boxX = x;
                boxY = y;
                boxW = w;
                boxH = h;
            }

            // Draw filled rectangle background
            ctx.fillStyle = bgColor;
            ctx.fillRect(boxX, boxY, boxW, boxH);

            // Draw bounding box
            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.strokeRect(boxX, boxY, boxW, boxH);

            // Draw label background
            const label = `${detection.label} ${(detection.confidence * 100).toFixed(0)}%`;
            ctx.font = "14px sans-serif";
            const textMetrics = ctx.measureText(label);
            const textHeight = 20;
            const padding = 4;

            ctx.fillStyle = color;
            ctx.fillRect(
                boxX,
                boxY - textHeight - padding,
                textMetrics.width + padding * 2,
                textHeight + padding
            );

            // Draw label text
            ctx.fillStyle = "#000000";
            ctx.fillText(label, boxX + padding, boxY - padding - 4);
        });
    }, [detections]);

    // Effect to draw bounding boxes when detections change
    useEffect(() => {
        if (cameraOn && detections.length > 0) {
            drawBoundingBoxes();
        }
    }, [cameraOn, detections, drawBoundingBoxes]);

    const handleCameraToggle = async () => {
        if (cameraOn) {
            // Turn off camera
            setCameraOn(false);

            // Stop sending frames
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
                frameIntervalRef.current = null;
            }

            // Close WebSocket
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }

            // Clear detections
            setDetections([]);
            setDetectionCounts({theft: 0, weapon: 0, face: 0});
        } else {
            // Turn on camera with loading state
            setError(null);
            setIsLoading(true);

            try {
                // Simulate loading training models
                await new Promise(resolve => setTimeout(resolve, 1500));

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                // Connect WebSocket
                connectWebSocket();

                // Wait for video to be ready
                await new Promise((resolve) => {
                    if (videoRef.current) {
                        videoRef.current.onloadedmetadata = () => {
                            resolve(true);
                        };
                    }
                });

                setCameraOn(true);
                setIsLoading(false);

                // Start sending frames every 500ms (2 FPS for analysis)
                frameIntervalRef.current = setInterval(() => {
                    sendFrameToWS();
                }, 500);

            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Failed to access camera. Please check permissions.");
                setIsLoading(false);
            }
        }
    };

    useEffect(() => {
        // Cleanup function
        if (!cameraOn && streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        }

        return () => {
            // Cleanup on unmount
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [cameraOn]);

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="text-sm">
                        Status:{" "}
                        <span
                            className={`font-semibold ${
                                cameraOn ? "text-green-600" : "text-red-600"
                            }`}
                        >
                            {cameraOn ? "Active" : "Inactive"}
                        </span>
                    </div>
                    {wsConnected && (
                        <div className="text-sm">
                            <span className="text-gray-600">WS:</span>{" "}
                            <span className="font-semibold text-green-600">Connected</span>
                        </div>
                    )}
                    {error && (
                        <div className="text-xs text-red-600">
                            {error}
                        </div>
                    )}
                </div>
                <div className={"flex items-center gap-3"}>
                    <button
                        onClick={handleCameraToggle}
                        disabled={isLoading}
                        className={`px-4 py-2 font-medium text-white text-sm ${
                            isLoading 
                                ? "bg-gray-400 cursor-not-allowed" 
                                : cameraOn 
                                    ? "bg-red-600 hover:bg-red-700" 
                                    : "bg-green-600 hover:bg-green-700"
                        } transition-colors`}
                    >
                        {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                    </button>

                    <TestAlerts/>
                </div>
            </div>

            <div className="flex-1 border border-gray-300 flex items-center justify-center min-h-[500px] relative bg-black">
                {isLoading ? (
                    <div className="flex flex-col items-center">
                        <FaSpinner className="text-white text-2xl animate-spin mb-2" />
                        <div className="text-white text-lg font-medium">
                            Loading training models...
                        </div>
                        <div className="text-white/70 text-sm">
                            Initializing camera
                        </div>
                    </div>
                ) : cameraOn ? (
                    <>
                        {/* Video and canvas container */}
                        <div className="relative w-full h-full">
                            {/* Actual camera feed */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Canvas overlay for bounding boxes */}
                            <canvas
                                ref={canvasRef}
                                className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            />
                        </div>

                        {/* Detection stats overlay (top right) */}
                        {(detectionCounts.theft > 0 || detectionCounts.weapon > 0 || detectionCounts.face > 0) && (
                            <div className="absolute top-4 right-4 bg-black/80 text-white px-4 py-3 rounded-lg border border-gray-600">
                                <div className="text-xs font-semibold mb-2">DETECTIONS</div>
                                <div className="flex flex-col gap-1 text-xs">
                                    {detectionCounts.theft > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                                            <span>Theft: {detectionCounts.theft}</span>
                                        </div>
                                    )}
                                    {detectionCounts.weapon > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded"></div>
                                            <span>Weapon: {detectionCounts.weapon}</span>
                                        </div>
                                    )}
                                    {detectionCounts.face > 0 && (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                            <span>Face: {detectionCounts.face}</span>
                                        </div>
                                    )}
                                </div>
                                {processingTime > 0 && (
                                    <div className="text-xs text-gray-400 mt-2">
                                        {processingTime.toFixed(0)}ms
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Metadata overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-4 py-2 border-t border-gray-600">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                        <span className="font-medium">REC</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Camera:</span> <span
                                        className="font-medium">CAM-01</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Location:</span> <span
                                        className="font-medium">Main Entrance</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Resolution:</span> <span
                                        className="font-medium">1920x1080</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">AI:</span> <span
                                        className={`font-medium ${wsConnected ? "text-green-400" : "text-red-400"}`}>
                                        {wsConnected ? "Active" : "Disconnected"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-gray-400">Date:</span> <span
                                        className="font-medium">{formatDate(currentTime)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Time:</span> <span
                                        className="font-medium">{formatTime(currentTime)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full border border-dashed border-gray-600 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <VideoOff size={60} className="text-gray-400" strokeWidth={1}/>
                            <span className="text-base font-medium text-gray-400">
                                Camera is turned off
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} style={{display: 'none'}} />
        </>
    )
}

const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
};