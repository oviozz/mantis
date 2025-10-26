"use client";
import React, { useState, useRef, useEffect } from "react";
import { Search, PlayCircle, Clock, MapPin, Loader2 } from "lucide-react";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface SearchResult {
    id: string;
    timestamp: string;
    location: string;
    eventType: string;
    duration: string;
}

interface SearchSession {
    id: string;
    query: string;
    results: SearchResult[];
    timestamp: Date;
}

export default function AnimatedFaceSearch() {
    const [searchQuery, setSearchQuery] = useState("");
    const [searchSessions, setSearchSessions] = useState<SearchSession[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const mockResults: SearchResult[] = [
        {
            id: "1",
            timestamp: "2025-10-25T09:32:00Z",
            location: "Main Entrance",
            eventType: "Weapon Detection",
            duration: "1m 24s",
        },
        {
            id: "2",
            timestamp: "2025-10-25T10:22:00Z",
            location: "Checkout Area",
            eventType: "Theft Attempt",
            duration: "2m 12s",
        },
        {
            id: "3",
            timestamp: "2025-10-24T18:15:00Z",
            location: "Electronics Section",
            eventType: "Suspicious Loitering",
            duration: "3m 45s",
        },
    ];

    useEffect(() => {
        if (scrollRef.current && searchSessions.length > 0) {
            const scrollToBottom = () => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTo({
                        top: scrollRef.current.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            };
            setTimeout(scrollToBottom, 100);
        }
    }, [searchSessions]);

    const handleSearch = () => {
        if (!searchQuery.trim() || isSearching) return;

        setIsSearching(true);

        const loadingSession: SearchSession = {
            id: Date.now().toString(),
            query: searchQuery,
            results: [],
            timestamp: new Date(),
        };

        setSearchSessions((prev) => [...prev, loadingSession]);
        setSearchQuery("");

        setTimeout(() => {
            setSearchSessions((prev) =>
                prev.map((session) =>
                    session.id === loadingSession.id
                        ? { ...session, results: mockResults }
                        : session
                )
            );
            setIsSearching(false);
        }, 1500);
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                damping: 15
            }
        }
    };

    const sessionVariants: Variants = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                stiffness: 80,
                damping: 20
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Results Area - Scrollable */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
                <div className="max-w-6xl mx-auto p-8">
                    {searchSessions.length === 0 ? (
                        <div className="text-center text-gray-400 mt-32">
                            <Search className="mx-auto mb-4" size={48} />
                            <p className="text-lg font-medium">Search for footage, events, or descriptions</p>
                            <p className="text-sm mt-2">Results will appear here as you search</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <AnimatePresence mode="popLayout">
                                {searchSessions.map((session, sessionIndex) => (
                                    <motion.div
                                        key={session.id}
                                        variants={sessionVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit={{ opacity: 0, y: -20 }}
                                        className="space-y-4"
                                    >
                                        {/* Query Display */}
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                duration: 0.5,
                                                ease: [0.22, 1, 0.36, 1]
                                            }}
                                            className="flex items-center gap-3"
                                        >
                                            <div className="bg-gray-900 text-white px-4 py-2 font-mono text-sm">
                                                QUERY {sessionIndex + 1}
                                            </div>
                                            <div className="text-gray-700 font-medium">
                                                &ldquo;{session.query}&rdquo;
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">
                                                {session.timestamp.toLocaleTimeString()}
                                            </div>
                                        </motion.div>

                                        {/* Results or Loading */}
                                        {session.results.length === 0 ? (
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                            >
                                                {Array.from({ length: 3 }).map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        variants={itemVariants}
                                                        className="bg-white border border-gray-200"
                                                    >
                                                        <div className="h-40 bg-gray-100 flex items-center justify-center">
                                                            <Loader2 className="text-gray-400 animate-spin" size={32} />
                                                        </div>
                                                        <div className="p-4 space-y-2">
                                                            <motion.div
                                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                                transition={{
                                                                    repeat: Infinity,
                                                                    duration: 1.5,
                                                                    ease: "easeInOut"
                                                                }}
                                                                className="h-4 bg-gray-200"
                                                            />
                                                            <motion.div
                                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                                transition={{
                                                                    repeat: Infinity,
                                                                    duration: 1.5,
                                                                    delay: 0.2,
                                                                    ease: "easeInOut"
                                                                }}
                                                                className="h-3 bg-gray-100"
                                                            />
                                                            <motion.div
                                                                animate={{ opacity: [0.5, 1, 0.5] }}
                                                                transition={{
                                                                    repeat: Infinity,
                                                                    duration: 1.5,
                                                                    delay: 0.4,
                                                                    ease: "easeInOut"
                                                                }}
                                                                className="h-3 bg-gray-100 w-2/3"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                                            >
                                                {session.results.map((result) => (
                                                    <motion.div
                                                        key={result.id}
                                                        variants={itemVariants}
                                                        whileHover={{
                                                            y: -8,
                                                            transition: {
                                                                type: "spring",
                                                                stiffness: 300,
                                                                damping: 20
                                                            }
                                                        }}
                                                        className="bg-white border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                                                    >
                                                        <div className="bg-gray-100 h-40 flex items-center justify-center relative overflow-hidden group">
                                                            <PlayCircle className="text-gray-400 group-hover:scale-110 transition-transform duration-300" size={40} />
                                                            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-mono px-2 py-1">
                                                                {result.duration}
                                                            </div>
                                                        </div>
                                                        <div className="p-4 space-y-2">
                                                            <p className="font-semibold text-gray-900">
                                                                {result.eventType}
                                                            </p>
                                                            <div className="text-sm text-gray-600 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin size={14} />
                                                                    <span>{result.location}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Clock size={14} />
                                                                    <span className="font-mono text-xs">
                                                                        {new Date(result.timestamp).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </motion.div>
                                        )}

                                        {/* Results Summary */}
                                        {session.results.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{
                                                    delay: 0.6,
                                                    duration: 0.5,
                                                    ease: [0.22, 1, 0.36, 1]
                                                }}
                                                className="text-sm text-gray-500 font-mono"
                                            >
                                                Found {session.results.length} results
                                            </motion.div>
                                        )}

                                        {/* Divider */}
                                        {sessionIndex < searchSessions.length - 1 && (
                                            <motion.div
                                                initial={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{
                                                    duration: 0.6,
                                                    ease: [0.22, 1, 0.36, 1]
                                                }}
                                                className="border-t border-gray-200 mt-8 origin-left"
                                            />
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Fixed Search Bar */}
            <div className="sticky bottom-0 left-0 right-0 bg-white border-t p-5">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-center bg-neutral-50 border focus-within:border-blue-600 transition-all duration-300">
                        <Search className="text-gray-400 ml-4" size={20} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search footage, events, or descriptions..."
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            disabled={isSearching}
                            className="flex-1 px-4 py-4 bg-transparent focus:outline-none text-gray-800 placeholder:text-gray-400"
                        />
                        {isSearching && (
                            <Loader2 className="text-blue-600 animate-spin mr-4" size={20} />
                        )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center font-mono">
                        Press Enter to search • Each search creates a new result section
                    </p>
                </div>
            </div>

            {/* Hide scrollbar */}
            <style jsx global>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}