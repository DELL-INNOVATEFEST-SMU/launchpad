'use client';

import React, { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PAGE_SIZE = 3;

interface Row {
    id: number;
    source: string;
    username: string;
    score: number;
    suggested_outreach: string;
    content: string;
    link: string;
    timestamp: string;
}

const PLATFORM_ICONS: Record<string, JSX.Element> = {
    reddit: <span>🟧</span>,
    discord: <span>🟪</span>

    // Replace with SVG or images as needed
};

const SEVERITY_COLORS: Record<number, string> = {
    '-1': "bg-green-600",
    '-2': "bg-yellow-500",
    '-3': "bg-yellow-600",
    '-4': "bg-orange-500",
    '-5': "bg-red-600",
};

interface SubredditInput {
    name: string;
    numPosts: number | "";
}

export default function StartingPointAggregator() {
    const [data, setData] = useState<Row[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [search, setSearch] = useState('');
    const [platform, setPlatform] = useState('');
    const [severity, setSeverity] = useState<number | ''>('');
    const [date, setDate] = useState('');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
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

    const fetchData = async () => {
        setLoading(true);
        let query = supabase.from('messages').select('*', { count: 'exact' }).order('timestamp', { ascending: false });

        if (search) query = query.ilike('username', `%${search}%`);
        if (platform) query = query.eq('source', platform);
        if (severity) query = query.eq('score', severity);
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            query = query.gte('timestamp', start.toISOString());
            query = query.lte('timestamp', end.toISOString());
        }

        // Pagination
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);

        const { data: rows, count, error } = await query;
        if (!error && rows) {
            setData(rows);
            setTotal(count || 0);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [search, platform, severity, date, page]);

    const platforms = ['reddit', 'discord'];


    return (
        <div className=" min-h-screen flex flex-col items-center justify-start px-6 py-8">
            <div className="w-full max-w-4xl  rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Starting Point Aggregator</h2>
                    <div className="text-gray-400">SAMH Staff Portal</div>
                </div>
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        placeholder="Search by username, keyword..."
                        className=" text-white rounded px-4 py-2 w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className=" text-white rounded px-4 py-2"
                        value={platform}
                        onChange={e => setPlatform(e.target.value)}
                    >
                        <option value="">Platform</option>
                        {platforms.map(p => (
                            <option value={p} key={p}>{p}</option>
                        ))}
                    </select>
                    <select
                        className=" text-white rounded px-4 py-2"
                        value={severity}
                        onChange={e => setSeverity(e.target.value === '' ? '' : Number(e.target.value))}
                    >
                        <option value="">Severity</option>
                        {[5, 4, 3, 2, 1].map(s => (
                            <option value={s} key={s}>{s}</option>
                        ))}
                    </select>
                    <input
                        type="date"
                        className=" text-white rounded px-4 py-2"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>

                <div className="w-full overflow-x-auto ">
                    <br />
                    <table className="w-full border-collapse border-t text-left ">
                        <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                                <th className="py-2 border-l ">Platform</th>
                                <th className="py-2 border-l">Link</th>
                                <th className="py-2 border-l">Username</th>
                                <th className="py-2 border-l">Content</th>
                                <th className="py-2 border-l">Severity Index</th>
                                <th className="py-2 border-l">Saved Date</th>
                                <th className="py-2 border-l border-r w-1/3">Suggested Outreach</th>


                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td>
                                </tr>
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-400">No results found.</td>
                                </tr>
                            ) : (
                                data.map(row => (
                                    console.log(row),
                                    <tr key={row.id} className="border border-gray-800 transition ">
                                        <td className="py-3 flex items-center gap-2 ">
                                            {PLATFORM_ICONS[row.source] || row.source}
                                            {row.source}

                                        </td>
                                        <td className='border-l px-2 py-1'>
                                            {row.source === 'discord' ? (
                                                // Show Discord server name (assuming stored in row.discord_server_name)
                                                <span className="text-gray-300 ">{row.link || 'Unknown Server'}</span>
                                            ) : (
                                                // For Reddit and others, show View Post link
                                                <a
                                                    href={row.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 underline"
                                                >
                                                    View Post
                                                </a>
                                            )}
                                        </td>
                                        <td className='border-l px-2 py-1'>
                                            <span className=" text-gray-200 rounded px-2 py-1  text-xs">{row.username}</span>
                                        </td>
                                        <td className='border-l px-2 py-1 max-w-xs overflow-hidden text-ellipsis'>
                                            <span className=" text-gray-200 rounded px-2 py-1 text-xs">{row.content}</span>
                                        </td>
                                        <td className='border-l px-2 py-1'>
                                            <span className={`rounded-full px-3 py-1 text-white font-bold ${SEVERITY_COLORS[row.score]}`}>
                                                {row.score}
                                            </span>
                                        </td>
                                        <td className='border-l px-2 py-1 max-w-xs overflow-hidden text-ellipsis'>
                                            <span>{new Date(row.timestamp).toLocaleString(undefined, {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                second: "2-digit",
                                                hour12: false,
                                            })}</span>
                                        </td>
                                        <td className='border-l px-2 py-1 max-w-xs overflow-hidden text-ellipsis'>
                                            <span>{row.suggested_outreach}</span>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-gray-400">
                    <span>
                        Showing {PAGE_SIZE * (page - 1) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} results
                    </span>
                    <div className="flex gap-1">
                        <button
                            className={`px-2 py-1 rounded ${page === 1 ? 'bg-[#00000] text-gray-500' : ' text-white'}`}
                            onClick={() => setPage(page - 1)}
                            disabled={page === 1}
                        >Previous</button>
                        {[...Array(Math.ceil(total / PAGE_SIZE)).keys()].map(i =>
                            <button
                                key={i + 1}
                                className={`px-2 py-1 rounded ${page === i + 1 ? 'bg-blue-500 text-white' : ' text-white'}`}
                                onClick={() => setPage(i + 1)}
                            >{i + 1}</button>
                        )}
                        <button
                            className={`px-2 py-1 rounded ${page === Math.ceil(total / PAGE_SIZE) ? ' text-gray-500' : ' text-white'}`}
                            onClick={() => setPage(page + 1)}
                            disabled={page === Math.ceil(total / PAGE_SIZE)}
                        >Next</button>
                    </div>
                </div>
            </div>
            <div className="max-w-xl mx-auto p-4 space-y-4">
                {inputs.map((input, index) => (
                    <div key={index} className="flex space-x-4 items-center">
                        <input
                            type="text"
                            placeholder="Subreddit name"
                            className="flex-1 border border-gray-300 rounded px-3 py-2"
                            value={input.name}
                            onChange={(e) => handleNameChange(index, e.target.value)}
                        />
                        <input
                            type="number"
                            placeholder="Number of posts"
                            min={1}
                            className="w-36 border border-gray-300 rounded px-3 py-2"
                            value={input.numPosts === "" ? "" : input.numPosts}
                            onChange={(e) => handleNumPostsChange(index, e.target.value)}
                        />
                    </div>
                ))}

                <button
                    onClick={addInputRow}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2"
                >
                    + Add another subreddit
                </button>
            </div>
            <div className="pt-4">
                <button
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white rounded px-6 py-2 disabled:opacity-50"
                    disabled={loading}
                    type="button"
                >
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </div>

            {error && <div className="text-red-500 mt-2">{error}</div>}
            {success && <div className="text-green-500 mt-2">Submitted successfully!</div>}
        </div>
    );
}