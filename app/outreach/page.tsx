"use client";

import React, { useEffect, useState, useCallback } from "react";
import type { JSX } from "react";
import { Search, ChevronDown, Calendar } from "lucide-react";
import Navbar from "../../components/Navbar";

const PAGE_SIZE = 10;

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

interface MessagesResponse {
  data: Row[];
  total: number;
  page: number;
  pageSize: number;
}

export default function StartingPointAggregator() {
  const [data, setData] = useState<Row[]>([]);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [severity, setSeverity] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageGroup, setPageGroup] = useState(1);
  const [rowStatuses, setRowStatuses] = useState<{ [key: number]: string }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });

      if (search) params.append("search", search);
      if (platform) params.append("platform", platform);
      if (severity !== "") params.append("severity", severity.toString());
      if (date) params.append("date", date);

      const response = await fetch(`/api/messages?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: MessagesResponse = await response.json();

      setData(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, platform, severity, date, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const platforms = ["reddit", "discord"];

  const [expandedRows, setExpandedRows] = useState<{ [key: number]: boolean }>(
    {}
  );

  const toggleExpandRow = (rowId: number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Optional: show a toast notification
      console.log("Copied to clipboard");
    });
  };

  // Calculate pagination values
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pagesPerGroup = 5;
  const startPage = (pageGroup - 1) * pagesPerGroup + 1;
  const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

  // Function to handle next group
  const goToNextGroup = () => {
    if (endPage < totalPages) {
      const newPageGroup = pageGroup + 1;
      setPageGroup(newPageGroup);
      setPage((newPageGroup - 1) * pagesPerGroup + 1);
    }
  };

  // Function to handle previous group
  const goToPrevGroup = () => {
    if (pageGroup > 1) {
      const newPageGroup = pageGroup - 1;
      setPageGroup(newPageGroup);
      setPage((newPageGroup - 1) * pagesPerGroup + 1);
    }
  };

  // Function to handle page change within group
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleStatusChange = (rowId: number, status: string) => {
    setRowStatuses((prev) => ({
      ...prev,
      [rowId]: status,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 px-6 py-8">
        <div className="w-full flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">All Posts</h2>
            {/* <h2 className="text-2xl font-bold text-black">Mission Reachout</h2> */}
          </div>

          {/* filter */}
          <div className="flex gap-4 mb-6 bg-gray-50 px-6 py-4 rounded-lg items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by username, keyword..."
                className="pl-10 pr-4 py-2 w-full bg-white border border-gray-200 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-32"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="">Platform</option>
                {platforms.map((p) => (
                  <option value={p} key={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-32"
                value={severity}
                onChange={(e) =>
                  setSeverity(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
              >
                <option value="">Severity</option>
                {[-1, -2, -3, -4, -5].map((s) => (
                  <option value={s} key={s}>
                    {Math.abs(s)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <input
                type="date"
                className="bg-white border border-gray-200 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* table */}
          <div className="w-full overflow-x-auto bg-gray-50 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr className="text-gray-600 text-sm font-medium">
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Source
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Username
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Saved Date
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Content
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Severity Index
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Suggested Outreach
                  </th>
                  <th className="py-3 px-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      No results found.
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-100 transition-colors`}
                    >
                      {/* Source Column */}
                      <td className="py-4 px-4 border-r border-gray-200">
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium text-white ${
                                row.source === "discord"
                                  ? "bg-indigo-500"
                                  : "bg-orange-500"
                              }`}
                            >
                              {row.source}
                            </span>
                          </div>
                          <div className="text-xs text-blue-500 flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M7 7l10 10M17 7v4m0 0h-4"
                              />
                            </svg>
                            {row.source === "discord" ? (
                              <span>{row.link || "Saurabh's server"}</span>
                            ) : (
                              <a
                                href={row.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                View Post
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Username Column */}
                      <td className="py-4 px-4 border-r border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-700 font-medium">
                            {row.username}
                          </span>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => copyToClipboard(row.username)}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>

                      {/* Saved Date Column */}
                      <td className="py-4 px-4 border-r border-gray-200">
                        <div className="text-sm text-gray-600">
                          {new Date(row.timestamp).toLocaleDateString(
                            undefined,
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </td>

                      {/* Content Column */}
                      <td className="py-4 px-4 border-r border-gray-200 max-w-xs">
                        <div className="text-sm text-gray-700">
                          {expandedRows[row.id]
                            ? row.content
                            : row.content?.slice(0, 100) +
                              (row.content?.length > 100 ? "..." : "")}
                        </div>
                        {row.content?.length > 100 && (
                          <button
                            className="text-xs text-blue-500 hover:text-blue-700 mt-1"
                            onClick={() => toggleExpandRow(row.id)}
                          >
                            {expandedRows[row.id] ? "Show less" : "Show more"}
                          </button>
                        )}
                      </td>

                      {/* Severity Index Column */}
                      <td className="py-4 px-4 border-r border-gray-200">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-6 rounded text-white text-sm font-bold ${
                            row.score <= -4
                              ? "bg-red-500"
                              : row.score <= -3
                              ? "bg-orange-500"
                              : row.score <= -2
                              ? "bg-yellow-500"
                              : row.score <= -1
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                        >
                          {Math.abs(row.score)}
                        </span>
                      </td>

                      {/* Suggested Outreach Column */}
                      <td className="py-4 px-4 border-r border-gray-200 max-w-md">
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                          <div className="text-sm text-gray-700 mb-3">
                            {expandedRows[row.id]
                              ? row.suggested_outreach
                              : row.suggested_outreach?.slice(0, 100) +
                                (row.suggested_outreach?.length > 100
                                  ? "..."
                                  : "")}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <button
                              className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
                              onClick={() =>
                                copyToClipboard(row.suggested_outreach)
                              }
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                              Copy
                            </button>
                            <span className="text-gray-400">•••</span>
                            <button
                              className="text-gray-600 hover:text-gray-800"
                              onClick={() => toggleExpandRow(row.id)}
                            >
                              {expandedRows[row.id] ? "Less" : "More"}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-4 px-4">
                        <div className="relative">
                          <select
                            value={rowStatuses[row.id] || ""}
                            onChange={(e) =>
                              handleStatusChange(row.id, e.target.value)
                            }
                            className={`appearance-none px-4 py-2 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                              rowStatuses[row.id] === "message-sent"
                                ? "bg-blue-100 text-blue-700 border border-blue-200"
                                : rowStatuses[row.id] === "user-replied"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            }`}
                          >
                            <option value="">Pending Action</option>
                            <option value="message-sent">Message Sent</option>
                            <option value="user-replied">User Replied</option>
                          </select>
                          <ChevronDown
                            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                              rowStatuses[row.id] === "message-sent"
                                ? "text-blue-600"
                                : rowStatuses[row.id] === "user-replied"
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center mt-6 px-4 py-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* Previous Group Button */}
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  pageGroup === 1
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={goToPrevGroup}
                disabled={pageGroup === 1}
              >
                ← Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
                  const pageNumber = startPage + index;
                  return (
                    <button
                      key={pageNumber}
                      className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                        page === pageNumber
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>

              {/* Next Group Button */}
              <button
                className={`px-3 py-2 rounded-md text-sm font-medium border transition-colors ${
                  endPage >= totalPages
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
                onClick={goToNextGroup}
                disabled={endPage >= totalPages}
              >
                Next →
              </button>
            </div>

            <span className="text-sm text-gray-600">
              Showing {PAGE_SIZE * (page - 1) + 1} to{" "}
              {Math.min(page * PAGE_SIZE, total)} of {total} results
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
