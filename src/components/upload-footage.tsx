"use client";

import React, { useState } from "react";
import { X, Upload, Loader2, CheckCircle } from "lucide-react";
import { useUploadStore } from "@/store/upload-store";
import { supabase } from "@/lib/supabase";
import { useMutation } from "convex/react";
import {api} from "../../convex/_generated/api";

type FootageType = "upload" | "weapon" | "theft";

export default function UploadDialog() {

    const { isOpen, videoBlob, fileName, close, setFileName } = useUploadStore();
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState("");
    const [type, setType] = useState<FootageType>("upload");

    const createFootage = useMutation(api.footages.create);

    // Get video/image duration in seconds
    const getMediaDuration = (blob: Blob): Promise<number> => {
        return new Promise((resolve) => {
            // Check if it's a video file
            if (!blob.type.startsWith('video/')) {
                resolve(0);
                return;
            }

            const video = document.createElement('video');
            video.preload = 'metadata';

            const timeout = setTimeout(() => {
                resolve(0);
                window.URL.revokeObjectURL(video.src);
            }, 5000);

            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                window.URL.revokeObjectURL(video.src);
                const durationInSeconds = Math.floor(video.duration);
                resolve(durationInSeconds);
            };

            video.onerror = () => {
                clearTimeout(timeout);
                resolve(0);
                window.URL.revokeObjectURL(video.src);
            };

            video.src = URL.createObjectURL(blob);
        });
    };

    const handleUpload = async () => {
        if (!videoBlob || !fileName.trim()) {
            setError("Please provide a file name");
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const timestamp = Date.now();
            const sanitizedFileName = fileName.trim().replace(/[^a-zA-Z0-9-_]/g, '_');

            // Determine file type and extension
            const isVideo = videoBlob.type.startsWith('video/');
            const extension = isVideo ? 'webm' : 'jpg';
            const fileNameWithExt = `${timestamp}_${sanitizedFileName}.${extension}`;
            const contentType = isVideo ? videoBlob.type : 'image/jpeg';

            setProgressMessage("Analyzing media...");
            setUploadProgress(15);

            // Get duration in seconds
            const durationInSeconds = await getMediaDuration(videoBlob);

            setProgressMessage("Uploading file...");
            setUploadProgress(30);

            // Upload file
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('detectBucket')
                .upload(fileNameWithExt, videoBlob, {
                    contentType,
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error("Upload error:", uploadError);
                throw new Error(`Upload failed: ${uploadError.message}`);
            }

            setProgressMessage("Getting URL...");
            setUploadProgress(70);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('detectBucket')
                .getPublicUrl(fileNameWithExt);

            setProgressMessage("Saving metadata...");
            setUploadProgress(85);

            // Save to Convex with duration in seconds
            await createFootage({
                type,
                duration: durationInSeconds,
                thumbnailUrl: publicUrl,
                videoUrl: publicUrl,
                footageName: fileName,
                status: "REVIEWING",
            });

            setProgressMessage("Complete!");
            setUploadProgress(100);
            setSuccess(true);

            setTimeout(() => {
                close();
                setSuccess(false);
                setFileName("");
                setUploadProgress(0);
                setProgressMessage("");
            }, 2000);

        } catch (err) {
            console.error("Upload error:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to upload file";
            setError(errorMessage);
            setUploadProgress(0);
            setProgressMessage("");
        } finally {
            setUploading(false);
        }
    };

    if (!isOpen) return null;

    const isVideo = videoBlob?.type.startsWith('video/');

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-200 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold">Upload {isVideo ? 'Video' : 'Image'}</h2>
                    <button
                        onClick={close}
                        disabled={uploading}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle size={48} className="text-green-600 mb-4" />
                            <p className="text-lg font-semibold text-gray-900">Upload Successful!</p>
                            <p className="text-sm text-gray-600 mt-2">Your {isVideo ? 'video' : 'image'} has been saved.</p>
                        </div>
                    ) : (
                        <>
                            {/* File Name Input */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    File Name
                                </label>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    placeholder={`Enter ${isVideo ? 'video' : 'image'} name`}
                                    disabled={uploading}
                                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-600 disabled:bg-gray-100"
                                />
                            </div>

                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Type
                                </label>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as FootageType)}
                                    disabled={uploading}
                                    className="w-full px-3 py-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-600 disabled:bg-gray-100"
                                >
                                    <option value="upload">Upload</option>
                                    <option value="weapon">Weapon Detection</option>
                                    <option value="theft">Theft Detection</option>
                                </select>
                            </div>

                            {/* Media Preview */}
                            {videoBlob && !uploading && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Preview
                                    </label>
                                    {isVideo ? (
                                        <video
                                            src={URL.createObjectURL(videoBlob)}
                                            controls
                                            className="w-full border border-gray-300 max-h-64"
                                        />
                                    ) : (
                                        <img
                                            src={URL.createObjectURL(videoBlob)}
                                            alt="Preview"
                                            className="w-full border border-gray-300 max-h-64 object-contain"
                                        />
                                    )}
                                </div>
                            )}

                            {/* Progress Bar */}
                            {uploading && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-gray-700">
                                            {progressMessage}
                                        </span>
                                        <span className="text-xs text-gray-600">
                                            {uploadProgress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2">
                                        <div
                                            className="bg-blue-600 h-2 transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
                                    {error}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
                        <button
                            onClick={close}
                            disabled={uploading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleUpload}
                            disabled={uploading || !fileName.trim()}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Upload
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
