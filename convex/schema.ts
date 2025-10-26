import {defineSchema, defineTable} from "convex/server";
import {v} from "convex/values";

export default defineSchema({
    alerts: defineTable({
        type: v.union(
            v.literal("theft"),
            v.literal("weapon"),
            v.literal("repeat"),
            v.literal("other")
        ),
        faceID: v.optional((v.id("faces"))),
        summary: v.string(),
        imageUrl: v.optional(v.string()),
        createdAt: v.string(),
    }).index("by_created_at", ["createdAt"]),

    footages: defineTable({
        type: v.union(
            v.literal("upload"),
            v.literal("weapon"),
            v.literal("theft")
        ),
        duration: v.number(), // seconds
        thumbnailUrl: v.string(),
        videoUrl: v.string(),
        footageName: v.string(),
        status: v.union(
            v.literal("COMPLETED"),
            v.literal("REVIEWING")
        ),
        createdAt: v.optional(v.string()),
    }).index("by_created_at", ["createdAt"]),

    footageAnalysis: defineTable({
        footageID: v.id("footages"),
        detectionType: v.string(), // e.g., "Theft Attempt", "Weapon Detection", "Suspicious Activity"
        timestamps: v.array(
            v.object({
                timestamp: v.string(), // e.g., "00:15", "01:23"
                action: v.string(), // "Weapon", "Theft", "Suspicious", "Normal"
                description: v.string(), // Detailed description of what's happening
                screenshot: v.optional(v.string()), // URL to screenshot at this timestamp
                severity: v.union(
                    v.literal("low"),
                    v.literal("medium"),
                    v.literal("high"),
                    v.literal("critical")
                ),
            })
        ),
        subtitles: v.optional(
            v.array(
                v.object({
                    start: v.string(), // HH:MM:SS format (e.g., "00:00:05")
                    end: v.string(),   // HH:MM:SS format (e.g., "00:00:09")
                    speaker: v.string(), // "Bystander", "Person Shooting", "Person Stealing", "Person with Weapon", "Unknown"
                    text: v.string(),    // Actual dialogue spoken
                    tone: v.string(),    // "Threat", "Calm", "Scared", "Angry", "Neutral", "Panic"
                })
            )
        ),
        faces_detected: v.optional(
            v.object({
                status: v.union(
                    v.literal("processing"),
                    v.literal("completed")
                ),
                faceID: v.optional(v.string()),
            })
        ),
    }).index("by_footage", ["footageID"]),

    faces: defineTable({
        vectors: v.array(v.number()),
        faceID: v.string(),
        faceUrl: v.string(),
        createdAt: v.string(),
        threatType: v.optional(
            v.union(
                v.literal("theft"),
                v.literal("weapon")
            )
        ),
    }),
});