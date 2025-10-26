import {NextRequest, NextResponse} from "next/server";
import {exec} from "child_process";
import {promisify} from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

interface TimestampSegment {
    start: string;
    end: string;
}

function timestampToSeconds(timestamp: string): number {
    const parts = timestamp.split(":");
    if (parts.length === 2) {
        const [minutes, seconds] = parts.map(Number);
        return minutes * 60 + seconds;
    } else if (parts.length === 3) {
        const [hours, minutes, seconds] = parts.map(Number);
        return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
}

function createSegments(timestamps: string[], contextSeconds = 5): TimestampSegment[] {
    const timestampsInSeconds = timestamps.map(timestampToSeconds).sort((a, b) => a - b);
    const segments: TimestampSegment[] = [];

    for (const ts of timestampsInSeconds) {
        const start = Math.max(0, ts - contextSeconds);
        const end = ts + contextSeconds;

        // Merge overlapping segments
        if (segments.length > 0) {
            const lastSegment = segments[segments.length - 1];
            const lastEnd = timestampToSeconds(lastSegment.end);

            if (start <= lastEnd) {
                // Merge with previous segment
                lastSegment.end = formatSeconds(Math.max(end, lastEnd));
                continue;
            }
        }

        segments.push({
            start: formatSeconds(start),
            end: formatSeconds(end),
        });
    }

    return segments;
}

function formatSeconds(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
    let tempDir: string | null = null;

    try {
        const body = await request.json();
        const {videoUrl, timestamps} = body;

        if (!videoUrl || !timestamps || timestamps.length === 0) {
            return NextResponse.json(
                {error: "Missing videoUrl or timestamps"},
                {status: 400}
            );
        }

        tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-clip-"));

        const videoPath = path.join(tempDir, "input.mp4");
        const videoResponse = await fetch(videoUrl);
        const videoBuffer = await videoResponse.arrayBuffer();
        await fs.writeFile(videoPath, Buffer.from(videoBuffer));

        const segments = createSegments(timestamps);

        const segmentFiles: string[] = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const segmentPath = path.join(tempDir, `segment_${i}.mp4`);

            // Extract segment using FFmpeg
            const ffmpegCommand = `ffmpeg -i "${videoPath}" -ss ${segment.start} -to ${segment.end} -c copy -y "${segmentPath}"`;
            await execAsync(ffmpegCommand);

            segmentFiles.push(segmentPath);
        }

        // Create concat file
        const concatFilePath = path.join(tempDir, "concat.txt");
        const concatContent = segmentFiles.map((file) => `file '${file}'`).join("\n");
        await fs.writeFile(concatFilePath, concatContent);

        // Concatenate all segments
        const outputPath = path.join(tempDir, "output.mp4");
        const concatCommand = `ffmpeg -f concat -safe 0 -i "${concatFilePath}" -c copy -y "${outputPath}"`;
        await execAsync(concatCommand);

        // Read the output file
        const outputBuffer = await fs.readFile(outputPath);

        // Clean up temp directory
        await fs.rm(tempDir, {recursive: true, force: true});
        tempDir = null;

        // Return the video file
        return new NextResponse(outputBuffer, {
            headers: {
                "Content-Type": "video/mp4",
                "Content-Disposition": `attachment; filename="clip-${Date.now()}.mp4"`,
            },
        });
    } catch (error) {
        console.error("Error generating clip:", error);

        // Clean up on error
        if (tempDir) {
            try {
                await fs.rm(tempDir, {recursive: true, force: true});
            } catch (cleanupError) {
                console.error("Error cleaning up temp directory:", cleanupError);
            }
        }

        return NextResponse.json(
            {error: "Failed to generate video clip", details: error instanceof Error ? error.message : String(error)},
            {status: 500}
        );
    }
}