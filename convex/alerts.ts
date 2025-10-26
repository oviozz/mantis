import {mutation, query} from "./_generated/server";
import {v} from "convex/values";

export const create = mutation({
    args: {
        type: v.union(
            v.literal("theft"),
            v.literal("weapon"),
            v.literal("repeat"),
            v.literal("other")
        ),
        summary: v.string(),
        faceID: v.union(
            v.id("faces"),
            v.null()
        ),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const alertId = await ctx.db.insert("alerts", {
            type: args.type,
            summary: args.summary,
            ...(args.faceID && {faceID: args.faceID}),
            imageUrl: args.imageUrl,
            createdAt: new Date().toISOString(),
        });
        return alertId;
    },
});


export const getAll = query({
    args: {},
    handler: async (ctx) => {
        const alerts = await ctx.db
            .query("alerts")
            .withIndex("by_created_at")
            .order("desc")
            .collect();

        return alerts;
    },
});