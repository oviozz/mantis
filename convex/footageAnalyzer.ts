import {v} from "convex/values";
import {action, internalAction, internalMutation, query} from "./_generated/server";
import {groq} from '@ai-sdk/groq';
import {generateObject} from 'ai';
import {z} from 'zod';
import {internal} from "./_generated/api";

const analysisSchema = z.object({
    detectionType: z.string(),
    timestamps: z.array(
        z.object({
            timestamp: z.string(),
            action: z.enum(['Weapon', 'Theft', 'Suspicious', 'Normal']),
            description: z.string(),
            severity: z.enum(['low', 'medium', 'high', 'critical']),
        })
    ),
});

const subtitleSchema = z.object({
    subtitles: z.array(
        z.object({
            start: z.string(), // HH:MM:SS format
            end: z.string(),   // HH:MM:SS format
            speaker: z.enum(['Bystander', 'Person Shooting', 'Person Stealing', 'Person with Weapon', 'Unknown']),
            text: z.string(),
            tone: z.enum(['Threat', 'Calm', 'Scared', 'Angry', 'Neutral', 'Panic']),
        })
    ),
});

// Action to upload video to Reka and get analysis
export const analyzeFootage = action({
    args: {
        footageId: v.id("footages"),
        videoUrl: v.string(),
        footageName: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            console.log("Uploading video to Reka...");

            // Create FormData for Reka API (they expect form data, not JSON!)
            const formData = new FormData();
            formData.append('video_url', args.videoUrl);
            formData.append('video_name', args.footageName);
            formData.append('index', 'true'); // Must be string 'true', not boolean
            formData.append('enable_thumbnails', 'true');

            const rekaUploadResponse = await fetch(
                "https://vision-agent.api.reka.ai/videos/upload",
                {
                    method: "POST",
                    headers: {
                        "X-Api-Key": process.env.NEXT_PUBLIC_REKA_API_KEY!,
                        // DO NOT set Content-Type - let browser set it with boundary
                    },
                    body: formData,
                }
            );

            if (!rekaUploadResponse.ok) {
                const errorText = await rekaUploadResponse.text();
                console.error("Reka upload error:", errorText);
                throw new Error(`Reka upload failed: ${errorText}`);
            }

            const rekaData = await rekaUploadResponse.json();
            const videoId = rekaData.video_id;

            console.log("Video uploaded to Reka:", videoId);

            // Wait for video to be indexed
            await waitForIndexing(videoId);

            console.log("Querying Reka for analysis using /qa/chat...");

            // Use the /qa/chat endpoint for better Q&A
            const rekaAnalysisResponse = await fetch(
                "https://vision-agent.api.reka.ai/qa/chat",
                {
                    method: "POST",
                    headers: {
                        "X-Api-Key": process.env.NEXT_PUBLIC_REKA_API_KEY!,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        video_id: videoId,
                        messages: [
                            {
                                role: "user",
                                content: `You are a professional security analyst reviewing surveillance footage. Provide a COMPREHENSIVE, CHRONOLOGICAL timeline of ALL significant events in this video.

CRITICAL REQUIREMENTS:
1. Watch the ENTIRE video from start to finish
2. Provide EXACT timestamps for every event in MM:SS format (e.g., 00:05, 01:23, 02:47)
3. Create entries for EVERY 5-10 seconds of activity, not just major incidents
4. Include mundane activities to establish baseline behavior

FOR EACH TIMESTAMP, DOCUMENT:
- Exact time (MM:SS)
- Person's location in frame (entering from left/right, near shelf/counter/door, etc.)
- Physical appearance (clothing color, body type, accessories like bags/backpacks)
- Specific action being performed (walking, reaching, looking, bending, concealing, etc.)
- Body language indicators (nervous glances, rushed movements, hesitation, normal behavior)
- Environmental context (other people present, lighting, camera angle)

CLASSIFICATION GUIDELINES:
- Normal: Typical shopping/browsing behavior, direct movements, casual body language
- Suspicious: Repeated glances around, loitering, hovering near exits, concealing motions, nervousness
- Theft: Hand-to-pocket movements, hiding items under clothing, placing items in bags without paying, removing security tags
- Weapon: Visible firearms, knives, or threatening objects being displayed or brandished

SEVERITY LEVELS:
- Low: Normal activity, standard shopping behavior
- Medium: Slightly unusual behavior but not clearly criminal (extended browsing, frequent looking around)
- High: Clear indicators of suspicious intent (concealment gestures, furtive movements, evasive behavior)
- Critical: Confirmed criminal activity (theft in progress, weapon visible, threatening behavior)

Analyze the entire video duration and provide a complete timeline with as many timestamps as necessary to document all activities.`
                            }
                        ]
                    }),
                }
            );

            if (!rekaAnalysisResponse.ok) {
                const errorText = await rekaAnalysisResponse.text();
                console.error("Reka analysis error:", errorText);
                throw new Error(`Reka analysis failed: ${errorText}`);
            }

            const rekaAnalysisData = await rekaAnalysisResponse.json();
            const rekaAnalysisText = rekaAnalysisData.answer || JSON.stringify(rekaAnalysisData);

            console.log("Reka analysis received:", rekaAnalysisText.substring(0, 200) + "...");
            console.log("Structuring with Groq...");

            // Use Groq to structure the analysis into our schema
            const {object: structuredAnalysis} = await generateObject({
                model: groq('moonshotai/kimi-k2-instruct'),
                schema: analysisSchema,
                prompt: `You are analyzing security footage. Based on the following analysis from a video AI system, 
        extract and structure the information into a timeline of events.

        Video Analysis:
        ${rekaAnalysisText}

        Instructions:
        - Extract all timestamps and convert them to MM:SS format (e.g., "00:15", "01:23")
        - Categorize each action as: Normal, Suspicious, Theft, or Weapon
        - Provide a detailed description for each timestamp (40-100 words)
        - Assign appropriate severity: low (normal behavior), medium (slightly suspicious), high (clear suspicious activity), critical (theft/weapon detected)
        - Determine the overall detection type based on the most severe incidents found
        - If no specific timestamps are mentioned, create a logical timeline based on the description (start at 00:00)
        - Minimum 5 timestamp entries (unless video is very short)

        Return a structured timeline of events.`,
            });

            console.log("Analysis structured successfully!");

            // Get screenshot URLs for each timestamp
            const timestampsWithScreenshots = await Promise.all(
                structuredAnalysis.timestamps.map(async (ts) => ({
                    ...ts,
                    screenshot: await getScreenshotForTimestamp(videoId, ts.timestamp),
                }))
            );

            // Save analysis to database
            await ctx.runMutation(internal.footageAnalyzer.saveAnalysis, {
                footageId: args.footageId,
                detectionType: structuredAnalysis.detectionType,
                timestamps: timestampsWithScreenshots,
            });

            // Schedule subtitle generation to run immediately after this completes
            // This runs asynchronously and won't block the main analysis completion
            await ctx.scheduler.runAfter(0, internal.footageAnalyzer.generateSubtitlesInternal, {
                footageId: args.footageId,
                videoId: videoId,
            });

            // Update footage status to COMPLETED
            await ctx.runMutation(internal.footageAnalyzer.updateFootageStatus, {
                footageId: args.footageId,
                status: "COMPLETED",
            });

            console.log("Analysis complete and saved! Subtitle generation scheduled.");

            return {
                success: true,
                analysisData: structuredAnalysis,
            };
        } catch (error) {
            console.error("Error analyzing footage:", error);

            // Update footage status to indicate failure (keep as REVIEWING for retry)
            await ctx.runMutation(internal.footageAnalyzer.updateFootageStatus, {
                footageId: args.footageId,
                status: "REVIEWING",
            });

            throw error;
        }
    },
});

// Helper function to wait for Reka video indexing
async function waitForIndexing(videoId: string, maxAttempts = 30): Promise<void> {
    console.log("Waiting for video indexing...");

    for (let i = 0; i < maxAttempts; i++) {
        const response = await fetch("https://vision-agent.api.reka.ai/videos/get", {
            method: "POST",
            headers: {
                "X-Api-Key": process.env.NEXT_PUBLIC_REKA_API_KEY!,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                video_ids: [videoId],
            }),
        });

        if (!response.ok) {
            console.error("Failed to check indexing status:", await response.text());
            throw new Error("Failed to check video indexing status");
        }

        const data = await response.json();
        const video = data.results?.[0];

        console.log(`Indexing status (attempt ${i + 1}/${maxAttempts}):`, video?.indexing_status);

        if (video?.indexing_status === "indexed") {
            console.log("Video indexed successfully!");
            return;
        } else if (video?.indexing_status === "failed") {
            throw new Error("Video indexing failed");
        }

        // Wait 10 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 10000));
    }

    throw new Error("Video indexing timeout - exceeded maximum wait time");
}

// Helper function to get screenshot for a timestamp
async function getScreenshotForTimestamp(
    videoId: string,
    timestamp: string
): Promise<string> {
    return "";
}

// Internal mutation to save analysis results
export const saveAnalysis = internalMutation({
    args: {
        footageId: v.id("footages"),
        detectionType: v.string(),
        timestamps: v.array(
            v.object({
                timestamp: v.string(),
                action: v.string(),
                description: v.string(),
                screenshot: v.string(),
                severity: v.union(
                    v.literal("low"),
                    v.literal("medium"),
                    v.literal("high"),
                    v.literal("critical")
                ),
            })
        ),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("footageAnalysis", {
            footageID: args.footageId,
            detectionType: args.detectionType,
            timestamps: args.timestamps,
        });
    },
});

// Internal mutation to update footage status
export const updateFootageStatus = internalMutation({
    args: {
        footageId: v.id("footages"),
        status: v.union(v.literal("COMPLETED"), v.literal("REVIEWING")),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.footageId, {
            status: args.status,
        });
    },
});

// Internal action for scheduled subtitle generation
export const generateSubtitlesInternal = internalAction({
    args: {
        footageId: v.id("footages"),
        videoId: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            console.log("🎬 Starting scheduled subtitle generation for footage:", args.footageId);

            // Query Reka for audio/dialogue analysis
            const rekaSubtitleResponse = await fetch(
                "https://vision-agent.api.reka.ai/qa/chat",
                {
                    method: "POST",
                    headers: {
                        "X-Api-Key": process.env.NEXT_PUBLIC_REKA_API_KEY!,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        video_id: args.videoId,
                        messages: [
                            {
                                role: "user",
                                content: `Analyze the audio and dialogue in this security footage video. Extract ALL spoken words, conversations, and vocal interactions.

FOR EACH PIECE OF DIALOGUE, PROVIDE:

1. EXACT TIMING:
   - Start time in HH:MM:SS format (e.g., "00:00:05")
   - End time in HH:MM:SS format (e.g., "00:00:09")
   - Be precise to the second

2. SPEAKER IDENTIFICATION:
   Based on context and actions, identify the speaker as:
   - "Person Shooting" / "Person with Weapon" - If they are threatening or have a weapon
   - "Person Stealing" - If they are committing theft
   - "Bystander" - Victims, witnesses, or innocent people present
   - "Unknown" - If speaker cannot be identified

3. EXACT DIALOGUE:
   - Transcribe the EXACT words spoken
   - Include exclamations, questions, commands
   - Capture emotional expressions like "Help!", "Stop!", "No!"

4. TONE ANALYSIS:
   Based on voice quality, context, and delivery, classify tone as:
   - "Threat" - Intimidating, menacing, commanding
   - "Scared" - Fearful, panicked, pleading
   - "Calm" - Collected, matter-of-fact, controlled
   - "Angry" - Hostile, aggressive, confrontational
   - "Panic" - Extreme fear, screaming, chaotic
   - "Neutral" - Normal conversation tone

IMPORTANT:
- If there is NO audible dialogue in the video, return "NO_AUDIO_DETECTED"
- Only transcribe actual spoken words, not sound effects
- Include background conversations if audible

EXAMPLE OUTPUT FORMAT:
00:00:05 to 00:00:09 - Bystander (Scared): "Please don't hurt me!"
00:00:10 to 00:00:13 - Person with Weapon (Threat): "Stay where you are!"

Provide a complete transcript of all dialogue with timestamps.`
                            }
                        ]
                    }),
                }
            );

            if (!rekaSubtitleResponse.ok) {
                const errorText = await rekaSubtitleResponse.text();
                console.error("Reka subtitle analysis error:", errorText);
                throw new Error(`Reka subtitle analysis failed: ${errorText}`);
            }

            const rekaSubtitleData = await rekaSubtitleResponse.json();
            const rekaTranscript = rekaSubtitleData.answer || JSON.stringify(rekaSubtitleData);

            console.log("📝 Transcript received");

            if (rekaTranscript.includes("NO_AUDIO_DETECTED") ||
                rekaTranscript.toLowerCase().includes("no audio") ||
                rekaTranscript.toLowerCase().includes("no dialogue")) {
                console.log("🔇 No audio detected in video, saving empty subtitles");

                await ctx.runMutation(internal.footageAnalyzer.updateSubtitles, {
                    footageId: args.footageId,
                    subtitles: [],
                });

                return {
                    success: true,
                    subtitles: [],
                    message: "No audio detected in video",
                };
            }

            console.log("🤖 Structuring subtitles with Groq...");

            // Use Groq to structure the subtitles into our schema
            const {object: structuredSubtitles} = await generateObject({
                model: groq('moonshotai/kimi-k2-instruct'),
                schema: subtitleSchema,
                prompt: `You are structuring subtitle data from a security footage transcript. Extract and organize ALL dialogue from the transcript below.

TRANSCRIPT:
${rekaTranscript}

EXTRACTION INSTRUCTIONS:

1. TIME FORMAT:
   - Convert all timestamps to strict HH:MM:SS format
   - Examples: "00:00:05", "00:01:23", "00:12:47"
   - Pad with zeros: 5 seconds = "00:00:05", not "0:0:5"
   - Start time must be before end time

2. SPEAKER CLASSIFICATION (must be ONE of these):
   - "Person Shooting" - If explicitly shooting
   - "Person with Weapon" - If threatening with weapon
   - "Person Stealing" - If actively stealing
   - "Bystander" - Victims, witnesses, innocent parties
   - "Unknown" - Cannot determine speaker

3. DIALOGUE TEXT:
   - Extract EXACT words spoken
   - Maximum 100 characters per subtitle
   - Split long dialogue into multiple entries

4. TONE ASSIGNMENT (must be ONE of these):
   - "Threat", "Scared", "Calm", "Angry", "Panic", "Neutral"

5. CONSISTENCY:
   - Match speaker to context
   - Match tone to dialogue content
   - Maintain chronological order

Return the complete structured subtitles array.`,
            });

            console.log(`✅ Generated ${structuredSubtitles.subtitles.length} subtitle entries`);

            // Update the footage analysis with subtitles
            await ctx.runMutation(internal.footageAnalyzer.updateSubtitles, {
                footageId: args.footageId,
                subtitles: structuredSubtitles.subtitles,
            });

            console.log("💾 Subtitles saved to database!");

            return {
                success: true,
                subtitles: structuredSubtitles.subtitles,
            };
        } catch (error) {
            console.error("❌ Error generating subtitles:", error);
            // Don't throw - we don't want subtitle failure to break the main analysis
            // Just log the error and save empty subtitles
            await ctx.runMutation(internal.footageAnalyzer.updateSubtitles, {
                footageId: args.footageId,
                subtitles: [],
            });

            return {
                success: false,
                subtitles: [],
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    },
});

// Public action for manual subtitle generation (can be called from UI)
export const generateSubtitles = action({
    args: {
        footageId: v.id("footages"),
        videoId: v.string(),
    },
    handler: async (ctx, args) => {
        // Just schedule the internal action
        await ctx.scheduler.runAfter(0, internal.footageAnalyzer.generateSubtitlesInternal, {
            footageId: args.footageId,
            videoId: args.videoId,
        });

        return {
            success: true,
            message: "Subtitle generation scheduled",
        };
    },
});

// Internal mutation to update subtitles in footage analysis
export const updateSubtitles = internalMutation({
    args: {
        footageId: v.id("footages"),
        subtitles: v.array(
            v.object({
                start: v.string(),
                end: v.string(),
                speaker: v.string(),
                text: v.string(),
                tone: v.string(),
            })
        ),
    },
    handler: async (ctx, args) => {
        // Find the analysis for this footage
        const analysis = await ctx.db
            .query("footageAnalysis")
            .withIndex("by_footage", (q) => q.eq("footageID", args.footageId))
            .first();

        if (!analysis) {
            throw new Error("Footage analysis not found");
        }

        // Update with subtitles
        await ctx.db.patch(analysis._id, {
            subtitles: args.subtitles,
        });
    },
});

// Query to get subtitles for a footage
export const getSubtitles = query({
    args: {
        footageId: v.id("footages"),
    },
    handler: async (ctx, args) => {
        const analysis = await ctx.db
            .query("footageAnalysis")
            .withIndex("by_footage", (q) => q.eq("footageID", args.footageId))
            .first();

        if (!analysis) {
            return null;
        }

        return {
            subtitles: analysis.subtitles || [],
            detectionType: analysis.detectionType,
        };
    },
});