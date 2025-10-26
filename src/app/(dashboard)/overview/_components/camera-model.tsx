"use client";
import { VideoOff, AlertTriangle } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";

interface Box {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    w: number;
    h: number;
}

interface Detection {
    box: Box;
    conf: number;
    class_id: number;
    class_name: string;
}

interface ModelResult {
    ok: boolean;
    model: string;
    detections: Detection[] | any;
    count?: number;
    error?: string;
}

interface DetectionData {
    theft: ModelResult;
    weapon: ModelResult;
    face: ModelResult;
}

export default function CameraModel() {
    const [cameraOn, setCameraOn] = useState(false);
    const [currentTime, setCurrentTime] = useState(() => new Date());
    const [error, setError] = useState<string | null>(null);
    const [detections, setDetections] = useState<DetectionData | null>(null);
    const [wsConnected, setWsConnected] = useState(false);
    const [confThreshold, setConfThreshold] = useState(0.4);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // WebSocket connection
    useEffect(() => {
        if (!cameraOn) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            setWsConnected(false);
            return;
        }

        const ws = new WebSocket('ws://127.0.0.1:8000/ws');

        ws.onopen = () => {
            console.log('WebSocket connected');
            setWsConnected(true);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === 'detections') {
                console.log('📥 Received detections:', message.data);
                setDetections(message.data);
            } else if (message.type === 'error') {
                console.error('WebSocket error:', message.message);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            setWsConnected(false);
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
            setWsConnected(false);
        };

        wsRef.current = ws;

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [cameraOn]);

    // Handle camera stream
    useEffect(() => {
        let isSubscribed = true;

        const startCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1920 },
                        height: { ideal: 1080 }
                    },
                    audio: false
                });

                if (!isSubscribed) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }

                if (isSubscribed) {
                    setError(null);
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                if (isSubscribed) {
                    setError("Failed to access camera. Please check permissions.");
                    setCameraOn(false);
                }
            }
        };

        const stopCamera = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };

        if (cameraOn) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            isSubscribed = false;
            stopCamera();
        };
    }, [cameraOn]);

    // Send frames to WebSocket
    useEffect(() => {
        if (!cameraOn || !wsConnected || !videoRef.current) {
            return;
        }

        const sendFrame = async () => {
            try {
                if (!videoRef.current || !canvasRef.current || !wsRef.current) return;
                if (wsRef.current.readyState !== WebSocket.OPEN) return;

                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');

                if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                const base64 = dataUrl.split(',')[1];

                wsRef.current.send(JSON.stringify({
                    type: 'frame',
                    image: base64,
                    conf_thresh: confThreshold,
                    timestamp: Date.now()
                }));
            } catch (err) {
                console.error('Error sending frame:', err);
            }
        };

        frameIntervalRef.current = setInterval(sendFrame, 500); // Send frame every 500ms

        return () => {
            if (frameIntervalRef.current) {
                clearInterval(frameIntervalRef.current);
            }
        };
    }, [cameraOn, wsConnected, confThreshold]);

    /**
     * Helper function to safely convert detections to array
     * Handles cases where detections might be:
     * - An array (normal case)
     * - An object with nested data
     * - Null/undefined
     */
    const getDetectionsArray = (detectionData: any): Detection[] => {
        if (!detectionData) return [];
        if (Array.isArray(detectionData)) return detectionData;
        if (typeof detectionData === 'object' && detectionData.detections && Array.isArray(detectionData.detections)) {
            return detectionData.detections;
        }
        return [];
    };

    // Draw bounding boxes
    useEffect(() => {
        if (!detections || !overlayCanvasRef.current || !videoRef.current) return;

        const canvas = overlayCanvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) return;

        // Match canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Clear previous drawings
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw detections
        const drawDetections = (modelResult: ModelResult, color: string, lineWidth: number = 2) => {
            if (!modelResult || !modelResult.ok) return;

            // Safely get detections array
            const detectionsArray = getDetectionsArray(modelResult.detections);

            if (!Array.isArray(detectionsArray) || detectionsArray.length === 0) {
                return;
            }

            detectionsArray.forEach((det: Detection) => {
                if (!det || !det.box) return;

                const { box, conf, class_name } = det;

                // Draw rectangle
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.strokeRect(box.x1, box.y1, box.w, box.h);

                // Draw label background
                const label = `${class_name} ${(conf * 100).toFixed(1)}%`;
                ctx.font = 'bold 16px Arial';
                const textMetrics = ctx.measureText(label);
                const textWidth = textMetrics.width + 10;
                const textHeight = 25;

                ctx.fillStyle = color;
                ctx.fillRect(box.x1, box.y1 - textHeight, textWidth, textHeight);

                // Draw label text
                ctx.fillStyle = 'white';
                ctx.textBaseline = 'bottom';
                ctx.fillText(label, box.x1 + 5, box.y1 - 5);
            });
        };

        // Draw each model's detections with different colors
        if (detections.face) drawDetections(detections.face, '#3b82f6', 2);      // Blue for faces
        if (detections.weapon) drawDetections(detections.weapon, '#ef4444', 4);  // Red for weapons
        if (detections.theft) drawDetections(detections.theft, '#f59e0b', 3);    // Orange for theft

    }, [detections]);

    /**
     * Helper function to safely get detection count
     */
    const getDetectionCount = (modelResult: ModelResult | undefined): number => {
        if (!modelResult) return 0;
        const detectionsArray = getDetectionsArray(modelResult.detections);
        return Array.isArray(detectionsArray) ? detectionsArray.length : 0;
    };

    const hasWeaponDetection = detections?.weapon?.ok && getDetectionCount(detections.weapon) > 0;
    const hasTheftDetection = detections?.theft?.ok && getDetectionCount(detections.theft) > 0;
    const hasFaceDetection = detections?.face?.ok && getDetectionCount(detections.face) > 0;

    const weaponCount = getDetectionCount(detections?.weapon);
    const theftCount = getDetectionCount(detections?.theft);
    const faceCount = getDetectionCount(detections?.face);

    const totalDetections = faceCount + weaponCount + theftCount;

    // Determine overall status
    const getStatusInfo = () => {
        if (hasWeaponDetection) {
            return { status: 'WEAPON ALERT', color: 'text-red-400', bgColor: 'bg-red-600/95' };
        }
        if (hasTheftDetection) {
            return { status: 'THEFT ALERT', color: 'text-orange-400', bgColor: 'bg-orange-600/95' };
        }
        if (hasFaceDetection) {
            return { status: 'MONITORING', color: 'text-yellow-400', bgColor: 'bg-yellow-600/50' };
        }
        return { status: 'Clear', color: 'text-green-400', bgColor: 'bg-green-600/30' };
    };

    const statusInfo = getStatusInfo();

    return (
        <>
            <div className="flex items-end justify-between mb-3">
                <div className="flex items-center gap-4">
                    <div className="text-base">
                        Status:{" "}
                        <span className={`font-semibold ${cameraOn ? "text-green-600" : "text-red-600"}`}>
                            {cameraOn ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <div className="text-sm">
                        WebSocket:{" "}
                        <span className={`font-semibold ${wsConnected ? "text-green-600" : "text-gray-500"}`}>
                            {wsConnected ? "Connected" : "Disconnected"}
                        </span>
                    </div>
                    {error && (
                        <div className="text-xs text-red-600">
                            {error}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Confidence:</label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={confThreshold}
                            onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                            className="w-24 h-2 bg-gray-300 appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-semibold min-w-12 text-right">{(confThreshold * 100).toFixed(0)}%</span>
                    </div>
                    <button
                        onClick={() => setCameraOn(!cameraOn)}
                        className={`px-4 py-2 font-medium text-white text-sm ${
                            cameraOn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                        } transition-colors`}
                    >
                        {cameraOn ? "Turn Off Camera" : "Turn On Camera"}
                    </button>
                </div>
            </div>

            <div className="flex-1 border border-gray-300 flex items-center justify-center min-h-[500px] relative bg-black">
                {cameraOn ? (
                    <>
                        {/* Video container with relative positioning */}
                        <div className="relative w-full h-full">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay canvas for bounding boxes */}
                            <canvas
                                ref={overlayCanvasRef}
                                className="absolute top-0 left-0 w-full h-full object-cover pointer-events-none"
                            />
                        </div>

                        {/* Hidden canvas for frame capture */}
                        <canvas ref={canvasRef} className="hidden" />

                        {/* Weapon detection alert overlay */}
                        {hasWeaponDetection && (
                            <div className="absolute top-4 left-4 right-4 bg-red-600/95 text-white px-4 py-3 border-2 border-red-400 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={24} className="flex-shrink-0" />
                                    <div>
                                        <div className="font-bold text-lg">⚠️ WEAPON DETECTED</div>
                                        <div className="text-sm mt-1">
                                            {getDetectionsArray(detections?.weapon?.detections).map((detection, idx) => (
                                                <div key={idx}>
                                                    {detection.class_name} (Confidence: {(detection.conf * 100).toFixed(1)}%)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Theft detection alert overlay */}
                        {hasTheftDetection && !hasWeaponDetection && (
                            <div className="absolute top-4 left-4 right-4 bg-orange-600/95 text-white px-4 py-3 border-2 border-orange-400 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <AlertTriangle size={24} className="flex-shrink-0" />
                                    <div>
                                        <div className="font-bold text-lg">⚠️ THEFT ALERT</div>
                                        <div className="text-sm mt-1">
                                            {getDetectionsArray(detections?.theft?.detections).map((detection, idx) => (
                                                <div key={idx}>
                                                    {detection.class_name} (Confidence: {(detection.conf * 100).toFixed(1)}%)
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Detection summary grid */}
                        <div className="absolute top-4 right-4 bg-black/85 text-white px-5 py-4 space-y-2 text-sm border border-gray-700">
                            <div className="font-bold border-b border-gray-600 pb-2 text-base">Detections</div>

                            {/* Face Detection */}
                            <div className="flex items-center justify-between gap-5">
                                <span className="text-blue-400">👤 Faces:</span>
                                <span className="font-bold text-lg">{faceCount}</span>
                            </div>

                            {/* Weapon Detection */}
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-red-400">🔫 Weapons:</span>
                                <span className="font-bold text-lg">{weaponCount}</span>
                            </div>

                            {/* Theft Detection */}
                            <div className="flex items-center justify-between gap-6">
                                <span className="text-orange-400">🚨 Theft:</span>
                                <span className="font-bold text-lg">{theftCount}</span>
                            </div>

                            <div className="border-t border-gray-600 pt-3 flex items-center justify-between gap-4">
                                <span className="font-semibold">Total:</span>
                                <span className="font-bold text-lg text-blue-300">{totalDetections}</span>
                            </div>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white px-4 py-2 border-t border-gray-600">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                                        <span className="font-medium">REC</span>
                                    </div>
                                    {cameraOn && (
                                        <div>
                                            <span className="text-gray-400">Status:</span>{" "}
                                            <span className={`font-medium ${
                                                hasWeaponDetection ? 'text-red-400' : 
                                                hasFaceDetection || hasTheftDetection ? 'text-yellow-400' : 
                                                'text-green-400'
                                            }`}>
                                                {hasWeaponDetection ? 'WEAPON ALERT' :
                                                 totalDetections > 0 ? 'MONITORING' :
                                                 'Clear'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div>
                                        <span className="text-gray-400">Date:</span>{" "}
                                        <span className="font-medium">{formatDate(currentTime)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Time:</span>{" "}
                                        <span className="font-medium">{formatTime(currentTime)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full border border-dashed border-gray-600 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <VideoOff size={60} className="text-gray-400" strokeWidth={1} />
                            <span className="text-base font-medium text-gray-400">
                                Camera is turned off
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
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