'use client';

import React, { useState } from 'react';
import { Plus, Send } from 'lucide-react';
import Navbar from '../../components/Navbar';

interface SubredditInput {
    name: string;
    numPosts: number | "";
}

export default function SubredditScraper() {
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inputs, setInputs] = useState<SubredditInput[]>([
        { name: "", numPosts: "" },
    ]);

    const handleNameChange = (index: number, value: string) => {
        const newInputs = [...inputs];
        newInputs[index].name = value;
        setInputs(newInputs);
    };

    const handleNumPostsChange = (index: number, value: string) => {
        const newInputs = [...inputs];
        // Only allow numbers or empty string to allow clearing field
        newInputs[index].numPosts = value === "" ? "" : Number(value);
        setInputs(newInputs);
    };

    const addInputRow = () => {
        setInputs((prev) => [...prev, { name: "", numPosts: "" }]);
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        // Filter out rows with empty name or invalid numPosts
        const validInputs = inputs.filter(
            ({ name, numPosts }) => name.trim() && numPosts && numPosts > 0
        );

        if (validInputs.length === 0) {
            setError("Please enter at least one valid subreddit and number of posts.");
            setLoading(false);
            return;
        }
        const payload = {
            subreddits: validInputs.reduce<Record<string, number>>((acc, cur) => {
                acc[cur.name.trim()] = cur.numPosts as number;
                return acc;
            }, {}),
        };

        try {
            console.log("Submitting payload:", payload);
            const response = await fetch("http://localhost:8000/scrape", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            setSuccess(true);
            window.location.reload();
        } catch (err: unknown) {
            setError(
                typeof err === "object" && err !== null && "message" in err
                    ? String((err as { message?: unknown }).message)
                    : "Unknown error"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <div className="flex-1 px-6 py-8">
                <div className="w-full flex-1 p-8">
                    <div className="w-full max-w-2xl mx-auto mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-black">Subreddit Content Finder</h2>
                            <p>Enter the subreddit name(s) and the number of posts you need. We'll gather the content for you automatically.</p>
                        </div>
                    </div>

                <div className="w-full max-w-2xl mx-auto bg-gray-100 rounded-lg px-6 py-4">
                    <div className="space-y-4">
                        {inputs.map((input, index) => (
                            <div key={index} className="flex gap-4 items-center">
                                <input
                                    type="text"
                                    placeholder="Subreddit name (e.g., depression)"
                                    className="flex-1 bg-white border border-gray-200 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={input.name}
                                    onChange={(e) => handleNameChange(index, e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Posts"
                                    min={1}
                                    className="w-24 bg-white border border-gray-200 rounded-md px-4 py-2 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={input.numPosts === "" ? "" : input.numPosts}
                                    onChange={(e) => handleNumPostsChange(index, e.target.value)}
                                />
                            </div>
                        ))}

                        <button
                            onClick={addInputRow}
                            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add another subreddit
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            onClick={handleSubmit}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                            disabled={loading}
                            type="button"
                        >
                            <Send className="w-4 h-4" />
                            {loading ? "Scraping..." : "Start Searching"}
                        </button>
                    </div>

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-red-600 text-sm">{error}</p>
                        </div>
                    )}
                    {success && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-green-600 text-sm">Scraping started successfully!</p>
                        </div>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
}