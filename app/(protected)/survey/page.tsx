"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  ChevronDown,
  Calendar,
  Mail,
  Phone,
  Globe,
} from "lucide-react";

const PAGE_SIZE = 10;

interface SurveyRow {
  id: string;
  email: string | null;
  phone: string | null;
  quiz_answers: Record<string, unknown>;
  phq_total: number;
  phq_band: string;
  dominant_flavor: string;
  planet_id: string;
  planet_name: string;
  age: number | null;
  nationality: string | null;
  referral: string;
  user_agent: string | null;
  source: string;
  created_at: string;
  updated_at: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
}

interface SurveyResponse {
  data: SurveyRow[];
  total: number;
  page: number;
  pageSize: number;
}

export default function SurveyRespondents() {
  const [data, setData] = useState<SurveyRow[]>([]);
  const [search, setSearch] = useState("");
  const [phqBand, setPhqBand] = useState("");
  const [planetName, setPlanetName] = useState("");
  const [nationality, setNationality] = useState("");
  const [source, setSource] = useState("");
  const [dateBefore, setDateBefore] = useState("");
  const [anxietyFilter, setAnxietyFilter] = useState("");
  const [depressionFilter, setDepressionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageGroup, setPageGroup] = useState(1);
  const [rowStatuses, setRowStatuses] = useState<{ [key: string]: string }>({});

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
      });

      if (search) params.append("search", search);
      if (phqBand) params.append("phqBand", phqBand);
      if (planetName) params.append("planetName", planetName);
      if (nationality) params.append("nationality", nationality);
      if (source) params.append("source", source);
      if (dateBefore) params.append("dateBefore", dateBefore);

      const response = await fetch(`/api/survey?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: SurveyResponse = await response.json();

      // Apply client-side filtering for anxiety and depression
      let filteredData = result.data;

      if (anxietyFilter) {
        filteredData = filteredData.filter((row) => {
          const anxietyScore = getAnxietyScore(row.q1, row.q2);
          if (anxietyFilter === "present") {
            return anxietyScore >= 3;
          } else if (anxietyFilter === "absent") {
            return anxietyScore < 3;
          }
          return true;
        });
      }

      if (depressionFilter) {
        filteredData = filteredData.filter((row) => {
          const depressionScore = getDepressionScore(row.q3, row.q4);
          if (depressionFilter === "present") {
            return depressionScore >= 3;
          } else if (depressionFilter === "absent") {
            return depressionScore < 3;
          }
          return true;
        });
      }

      setData(filteredData);
      setTotal(filteredData.length);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    search,
    phqBand,
    planetName,
    nationality,
    source,
    dateBefore,
    anxietyFilter,
    depressionFilter,
    page,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const phqBands = [
    "minimal",
    "mild",
    "moderate",
    "moderately-severe",
    "severe",
  ];
  const planetNames = [
    "Mercury",
    "Venus",
    "Earth",
    "Mars",
    "Jupiter",
    "Saturn",
    "Uranus",
    "Neptune",
  ];
  const nationalities = ["SG", "Others"];
  const sources = [
    "cosmic-compass-react",
    "cosmic-compass-web",
    "cosmic-compass-mobile",
  ];

  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>(
    {}
  );

  const toggleExpandRow = (rowId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
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

  const handleStatusChange = (rowId: string, status: string) => {
    setRowStatuses((prev) => ({
      ...prev,
      [rowId]: status,
    }));
  };

  const getPhqBandColor = (band: string) => {
    switch (band) {
      case "minimal":
        return "bg-green-100 text-green-800 border-green-200";
      case "mild":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "moderate":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "moderately-severe":
        return "bg-red-100 text-red-800 border-red-200";
      case "severe":
        return "bg-red-200 text-red-900 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  /**
   * Calculate anxiety score from PHQ-4 questions 1 and 2
   * Anxiety: Q1 + Q2 (nervous/anxious + worrying)
   */
  const getAnxietyScore = (q1: number | null, q2: number | null): number => {
    return (q1 || 0) + (q2 || 0);
  };

  /**
   * Calculate depression score from PHQ-4 questions 3 and 4
   * Depression: Q3 + Q4 (down/depressed + little interest)
   */
  const getDepressionScore = (q3: number | null, q4: number | null): number => {
    return (q3 || 0) + (q4 || 0);
  };

  /**
   * Get anxiety category based on score
   * Score ≥ 3 suggests anxiety
   */
  const getAnxietyCategory = (
    score: number
  ): { category: string; color: string } => {
    if (score >= 3) {
      return {
        category: "Anxiety Present",
        color: "bg-red-100 text-red-800 border-red-200",
      };
    }
    return {
      category: "No Anxiety",
      color: "bg-green-100 text-green-800 border-green-200",
    };
  };

  /**
   * Get depression category based on score
   * Score ≥ 3 suggests depression
   */
  const getDepressionCategory = (
    score: number
  ): { category: string; color: string } => {
    if (score >= 3) {
      return {
        category: "Depression Present",
        color: "bg-red-100 text-red-800 border-red-200",
      };
    }
    return {
      category: "No Depression",
      color: "bg-green-100 text-green-800 border-green-200",
    };
  };

  /**
   * Get PHQ-4 question labels
   */
  const getQuestionLabel = (questionNumber: number): string => {
    switch (questionNumber) {
      case 1:
        return "Feeling nervous, anxious or on edge";
      case 2:
        return "Not being able to stop or control worrying";
      case 3:
        return "Feeling down, depressed or hopeless";
      case 4:
        return "Little interest or pleasure in doing things";
      default:
        return "Unknown question";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-6 py-8">
        <div className="w-full flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-black">
              Survey Respondents
            </h2>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gray-50 px-6 py-4 rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by email, phone..."
                className="pl-10 pr-4 py-2 w-full bg-white border border-gray-200 rounded-md text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={phqBand}
                onChange={(e) => setPhqBand(e.target.value)}
              >
                <option value="">PHQ Band</option>
                {phqBands.map((band) => (
                  <option value={band} key={band}>
                    {band.charAt(0).toUpperCase() +
                      band.slice(1).replace("-", " ")}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={planetName}
                onChange={(e) => setPlanetName(e.target.value)}
              >
                <option value="">Planet</option>
                {planetNames.map((planet) => (
                  <option value={planet} key={planet}>
                    {planet}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
              >
                <option value="">Nationality</option>
                {nationalities.map((nat) => (
                  <option value={nat} key={nat}>
                    {nat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option value="">Source</option>
                {sources.map((src) => (
                  <option value={src} key={src}>
                    {src
                      .replace("cosmic-compass-", "")
                      .charAt(0)
                      .toUpperCase() +
                      src.replace("cosmic-compass-", "").slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <input
                type="date"
                className="bg-white border border-gray-200 rounded-md px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={dateBefore}
                onChange={(e) => setDateBefore(e.target.value)}
                placeholder="Before date"
              />
              <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={anxietyFilter}
                onChange={(e) => setAnxietyFilter(e.target.value)}
              >
                <option value="">Anxiety Status</option>
                <option value="present">Anxiety Present (≥3)</option>
                <option value="absent">No Anxiety (&lt;3)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-200 rounded-md px-4 py-2 pr-8 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                value={depressionFilter}
                onChange={(e) => setDepressionFilter(e.target.value)}
              >
                <option value="">Depression Status</option>
                <option value="present">Depression Present (≥3)</option>
                <option value="absent">No Depression (&lt;3)</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto bg-gray-50 rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr className="text-gray-600 text-sm font-medium">
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Contact Info
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Demographics
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Survey Date
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    PHQ Results
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Planet
                  </th>
                  <th className="py-3 px-4 text-left border-r border-gray-200">
                    Source
                  </th>
                  <th className="py-3 px-4 text-left">Outreach Status</th>
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
                    <React.Fragment key={row.id}>
                      <tr
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-gray-100 transition-colors`}
                      >
                        {/* Contact Info Column */}
                        <td className="py-4 px-4 border-r border-gray-200">
                          <div className="space-y-2">
                            {row.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  {row.email}
                                </span>
                                <button
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={() => copyToClipboard(row.email!)}
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
                            )}
                            {row.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  {row.phone}
                                </span>
                                <button
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={() => copyToClipboard(row.phone!)}
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
                            )}
                          </div>
                        </td>

                        {/* Demographics Column */}
                        <td className="py-4 px-4 border-r border-gray-200">
                          <div className="space-y-1">
                            {row.age && (
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">Age:</span>{" "}
                                {row.age}
                              </div>
                            )}
                            {row.nationality && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-gray-400" />
                                <span className="text-sm text-gray-700">
                                  {row.nationality}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Survey Date Column */}
                        <td className="py-4 px-4 border-r border-gray-200">
                          <div className="text-sm text-gray-600">
                            {new Date(row.created_at).toLocaleDateString(
                              undefined,
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </div>
                        </td>

                        {/* PHQ Results Column */}
                        <td className="py-4 px-4 border-r border-gray-200">
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">
                              Total: {row.phq_total}
                            </div>
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPhqBandColor(
                                row.phq_band
                              )}`}
                            >
                              {row.phq_band.charAt(0).toUpperCase() +
                                row.phq_band.slice(1).replace("-", " ")}
                            </span>

                            {/* Anxiety and Depression Categories */}
                            <div className="space-y-1">
                              {(() => {
                                const anxietyScore = getAnxietyScore(
                                  row.q1,
                                  row.q2
                                );
                                const anxietyCategory =
                                  getAnxietyCategory(anxietyScore);
                                return (
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${anxietyCategory.color}`}
                                  >
                                    Anxiety: {anxietyScore} (
                                    {anxietyCategory.category})
                                  </span>
                                );
                              })()}

                              {(() => {
                                const depressionScore = getDepressionScore(
                                  row.q3,
                                  row.q4
                                );
                                const depressionCategory =
                                  getDepressionCategory(depressionScore);
                                return (
                                  <span
                                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${depressionCategory.color}`}
                                  >
                                    Depression: {depressionScore} (
                                    {depressionCategory.category})
                                  </span>
                                );
                              })()}
                            </div>

                            {/* Expandable Details Button */}
                            <button
                              onClick={() => toggleExpandRow(row.id)}
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              {expandedRows[row.id]
                                ? "Hide Details"
                                : "Show Details"}
                            </button>
                          </div>
                        </td>

                        {/* Planet Column */}
                        <td className="py-4 px-4 border-r border-gray-200">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium text-gray-700">
                              {row.planet_name}
                            </span>
                          </div>
                        </td>

                        {/* Source Column */}
                        <td className="py-4 px-4 border-r border-gray-200">
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Source:</span>{" "}
                            {row.source.replace("cosmic-compass-", "")}
                          </div>
                        </td>

                        {/* Outreach Status Column */}
                        <td className="py-4 px-4">
                          <div className="relative">
                            <select
                              value={rowStatuses[row.id] || ""}
                              onChange={(e) =>
                                handleStatusChange(row.id, e.target.value)
                              }
                              className={`appearance-none px-4 py-2 pr-8 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                                rowStatuses[row.id] === "contacted"
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : rowStatuses[row.id] === "responded"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : rowStatuses[row.id] === "not-interested"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                              }`}
                            >
                              <option value="">Not Contacted</option>
                              <option value="contacted">Contacted</option>
                              <option value="responded">Responded</option>
                              <option value="not-interested">
                                Not Interested
                              </option>
                            </select>
                            <ChevronDown
                              className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                                rowStatuses[row.id] === "contacted"
                                  ? "text-blue-600"
                                  : rowStatuses[row.id] === "responded"
                                  ? "text-green-600"
                                  : rowStatuses[row.id] === "not-interested"
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {expandedRows[row.id] && (
                        <tr
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } border-t border-gray-200`}
                        >
                          <td colSpan={7} className="py-4 px-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="text-sm font-semibold text-gray-800 mb-3">
                                PHQ-4 Detailed Breakdown
                              </h4>

                              {/* Individual Question Scores */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="space-y-2">
                                  <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                    Anxiety Questions
                                  </h5>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-700">
                                        Q1: {getQuestionLabel(1)}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          (row.q1 || 0) >= 2
                                            ? "bg-red-100 text-red-800"
                                            : (row.q1 || 0) >= 1
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {row.q1 || 0}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-700">
                                        Q2: {getQuestionLabel(2)}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          (row.q2 || 0) >= 2
                                            ? "bg-red-100 text-red-800"
                                            : (row.q2 || 0) >= 1
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {row.q2 || 0}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    <strong>Anxiety Subtotal:</strong>{" "}
                                    {getAnxietyScore(row.q1, row.q2)}
                                    {getAnxietyScore(row.q1, row.q2) >= 3 && (
                                      <span className="text-red-600 ml-1">
                                        (≥3 suggests anxiety)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                    Depression Questions
                                  </h5>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-700">
                                        Q3: {getQuestionLabel(3)}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          (row.q3 || 0) >= 2
                                            ? "bg-red-100 text-red-800"
                                            : (row.q3 || 0) >= 1
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {row.q3 || 0}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-gray-700">
                                        Q4: {getQuestionLabel(4)}
                                      </span>
                                      <span
                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                          (row.q4 || 0) >= 2
                                            ? "bg-red-100 text-red-800"
                                            : (row.q4 || 0) >= 1
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-green-100 text-green-800"
                                        }`}
                                      >
                                        {row.q4 || 0}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    <strong>Depression Subtotal:</strong>{" "}
                                    {getDepressionScore(row.q3, row.q4)}
                                    {getDepressionScore(row.q3, row.q4) >=
                                      3 && (
                                      <span className="text-red-600 ml-1">
                                        (≥3 suggests depression)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Scoring Legend */}
                              <div className="border-t border-gray-200 pt-3">
                                <h6 className="text-xs font-medium text-gray-600 mb-2">
                                  Scoring Legend:
                                </h6>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-green-100 border border-green-200 rounded"></span>
                                    <span className="text-gray-600">
                                      0: Not at all
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></span>
                                    <span className="text-gray-600">
                                      1: Several days
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-red-100 border border-red-200 rounded"></span>
                                    <span className="text-gray-600">
                                      2-3: More than half/Nearly every day
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="w-3 h-3 bg-red-200 border border-red-300 rounded"></span>
                                    <span className="text-gray-600">
                                      ≥3: Clinical significance
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
