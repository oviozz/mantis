"use client";
import React from "react";
import { useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import {api} from "../../../../../convex/_generated/api";

function capitalize(str: string) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTime(isoString: string) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
}

function getAlertColors(type: "theft" | "weapon" | "repeat" | "other") {
    const colorMap = {
        weapon: {
            bg: "bg-neutral-50",
            border: "border-red-400",
            text: "text-red-700",
            badge: "bg-red-600"
        },
        theft: {
            bg: "bg-neutral-50",
            border: "border-orange-400",
            text: "text-orange-700",
            badge: "bg-orange-600"
        },
        repeat: {
            bg: "bg-neutral-50",
            border: "border-yellow-400",
            text: "text-yellow-700",
            badge: "bg-yellow-600"
        },
        other: {
            bg: "bg-neutral-50",
            border: "border-blue-600",
            text: "text-blue-700",
            badge: "bg-blue-600"
        }
    };
    return colorMap[type];
}

export default function LiveAlerts() {
    const alerts = useQuery(api.alerts.getAll) ?? [];

    return (
        <div className="flex flex-col self-start">
            <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-bold">Live Alerts</h3>
                <div className="text-sm text-gray-600">({alerts.length})</div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
                Recent detections
            </p>

            <div className="overflow-y-auto space-y-3 max-h-[calc(100vh-150px)] pr-2 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {alerts.map((alert) => {
                        const colors = getAlertColors(alert.type);
                        return (
                            <motion.div
                                key={alert._id}
                                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: -100, scale: 0.95 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 300,
                                    damping: 30
                                }}
                                layout
                                className={`p-2.5 bg-neutral-50 flex gap-3`}
                            >
                                {alert.imageUrl && (
                                    <img
                                        loading={"lazy"}
                                        src={alert.imageUrl}
                                        alt={alert.type}
                                        className="w-20 h-16 object-cover border border-gray-300 flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0 w-full">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <div className={`font-semibold text-base ${colors.text} flex items-center gap-2`}>
                                            <span className={`w-2 h-2 ${colors.badge}`}></span>
                                            {capitalize(alert.type)}
                                        </div>
                                        <div className="text-xs text-gray-500 whitespace-nowrap">
                                            {formatTime(alert.createdAt)}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 mb-2 line-clamp-2">
                                        {alert.summary}
                                    </div>
                                    <div className="flex gap-2">
                                        {alert.type === "repeat" ? (
                                            <button className="text-xs py-1 px-2 bg-gray-700 text-white hover:bg-gray-800 transition-colors">
                                                View Person
                                            </button>
                                        ) : (
                                            <button className="text-xs py-1 px-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                                                View Report
                                            </button>
                                        )}
                                        <button className="text-xs py-1 px-2 bg-red-600 text-white hover:bg-red-700 transition-colors">
                                            Contact Police
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>

                {alerts.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        No alerts yet
                    </div>
                )}
            </div>
        </div>
    );
}