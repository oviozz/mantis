import {v} from "convex/values";
import {mutation, query} from "./_generated/server";
import {api} from "./_generated/api";

export const create = mutation({
    args: {
        type: v.union(
            v.literal("upload"),
            v.literal("weapon"),
            v.literal("theft")
        ),
        duration: v.number(),
        thumbnailUrl: v.string(),
        videoUrl: v.string(),
        footageName: v.string(),
        status: v.union(
            v.literal("COMPLETED"),
            v.literal("REVIEWING")
        ),
    },
    handler: async (ctx, args) => {
        const footageId = await ctx.db.insert("footages", {
            type: args.type,
            duration: args.duration,
            thumbnailUrl: args.thumbnailUrl,
            videoUrl: args.videoUrl,
            footageName: args.footageName,
            status: args.status,
            createdAt: new Date().toISOString(),
        });

        await ctx.scheduler.runAfter(0, api.footageAnalyzer.analyzeFootage, {
            footageId,
            videoUrl: args.videoUrl,
            footageName: args.footageName,
        });

        return footageId;
    },
});

// Separate mutation to trigger analysis on existing footage
export const scheduleAnalysis = mutation({
    args: {
        footageId: v.id("footages"),
    },
    handler: async (ctx, args) => {
        const footage = await ctx.db.get(args.footageId);

        if (!footage) {
            throw new Error("Footage not found");
        }

        // Update status to REVIEWING
        await ctx.db.patch(args.footageId, {
            status: "REVIEWING",
        });

        // Schedule the analysis action
        await ctx.scheduler.runAfter(0, api.footageAnalyzer.analyzeFootage, {
            footageId: args.footageId,
            videoUrl: footage.videoUrl,
            footageName: footage.footageName,
        });

        return {success: true};
    },
});

export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const footages = await ctx.db
            .query("footages")
            .withIndex("by_created_at")
            .order("desc")
            .collect();

        return footages;
    },
});

export const getById = query({
    args: {id: v.id("footages")},
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Query to get footage with its analysis
export const getWithAnalysis = query({
    args: {id: v.id("footages")},
    handler: async (ctx, args) => {
        const footage = await ctx.db.get(args.id);

        if (!footage) {
            return null;
        }

        const analysis = await ctx.db
            .query("footageAnalysis")
            .withIndex("by_footage", (q) => q.eq("footageID", args.id))
            .first();

        return {
            ...footage,
            analysis,
        };
    },
});

export const getAnalysisById = query({
    args: {id: v.id("footages")},
    handler: async (ctx, args) => {
        const footage = await ctx.db.get(args.id);

        if (!footage) {
            return null;
        }

        const analysis = await ctx.db
            .query("footageAnalysis")
            .withIndex("by_footage", (q) => q.eq("footageID", args.id))
            .first();

        return {
            ...footage,
            analysis,
        };
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getFileUrl = mutation({
    args: {storageId: v.id("_storage")},
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        return url;
    },
});