"use client";

import React, { useState, useRef } from "react";
import CoPilotSamantha from "@/components/CoPilotSamantha";
import {
  Bold,
  Italic,
  List,
  Save,
  Download,
  Type,
  Info,
  Copy,
  MessageSquare,
} from "lucide-react";

interface NoteSection {
  id: string;
  title: string;
  content: string;
  infoText?: string;
}

export default function CaseWriter() {
  const [sections, setSections] = useState<NoteSection[]>([
    {
      id: "general-session-notes",
      title: "General Notes",
      content: "",
      infoText:
        "- Concise descriptions of issues, facts, significant observations and risk assessments, if any\n- Problem definition and genogram for initial sessions\n- Interventions, actions and any referrals made in session\n- Case conference notes, if any",
    },
    {
      id: "session-evaluation",
      title: "Evaluation / Action Plans",
      content: "",
      infoText:
        "Session Evaluation\n- Message or task for client and any follow up\n- Outcomes or decisions at end of session",
    },
    {
      id: "intervention-plan",
      title: "Intervention Plan",
      content: "",
    },
  ]);

  const [activeSection, setActiveSection] = useState<string>(
    "general-session-notes"
  );
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isCoPilotOpen, setIsCoPilotOpen] = useState(false);
  const textareaRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>(
    {}
  );

  const updateSectionContent = (sectionId: string, content: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, content } : section
      )
    );
  };

  const copyToClipboard = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.content.trim()) return;

    try {
      await navigator.clipboard.writeText(section.content);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000); // Reset after 2 seconds
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  const formatText = (format: "bold" | "italic" | "list") => {
    const textarea = textareaRefs.current[activeSection];
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);

    let formattedText = "";

    switch (format) {
      case "bold":
        formattedText = selectedText ? `**${selectedText}**` : "**bold text**";
        break;
      case "italic":
        formattedText = selectedText ? `*${selectedText}*` : "*italic text*";
        break;
      case "list":
        formattedText = selectedText
          ? selectedText
              .split("\n")
              .map((line) => `• ${line}`)
              .join("\n")
          : "• List item";
        break;
    }

    const newContent = beforeText + formattedText + afterText;
    updateSectionContent(activeSection, newContent);

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };


  const saveNotes = () => {
    const notesData = {
      timestamp: new Date().toISOString(),
      sections: sections,
    };
    localStorage.setItem("session-notes", JSON.stringify(notesData));
    // You could also implement cloud saving here
  };

  const exportNotes = () => {
    const notesText = sections
      .map(
        (section) =>
          `${section.title}\n${"=".repeat(section.title.length)}\n\n${
            section.content
          }\n\n`
      )
      .join("");

    const blob = new Blob([notesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-notes-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Prepare context for Co-Pilot Samantha
  const activeSectionData = sections.find((s) => s.id === activeSection);
  const coPilotContext = {
    currentSection: activeSectionData?.title || "General Notes",
    caseNotes: sections
      .filter((s) => s.content.trim())
      .map((s) => `${s.title}:\n${s.content}`)
      .join("\n\n"),
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row h-full min-h-0">
        {/* Main Content Area */}
        <div className="flex-1 px-3 sm:px-4 lg:px-6 lg:py-8 min-w-0 flex flex-col">
          {/* Header - Fixed */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 gap-3 flex-shrink-0">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-black">Session Notes</h2>
            </div>
            <button
              onClick={() => setIsCoPilotOpen(!isCoPilotOpen)}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors w-fit ${
                isCoPilotOpen
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 hover:bg-gray-50 text-gray-700"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isCoPilotOpen ? "Hide" : "Show"} Co-Pilot
              </span>
              <span className="sm:hidden">
                {isCoPilotOpen ? "Hide" : "Show"}
              </span>
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="space-y-4 lg:space-y-8">
              {/* Toolbar */}
              <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 border-r pr-3">
                    <button
                      onClick={() => formatText("bold")}
                      className="h-8 w-8 p-0 border border-gray-200 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center"
                      title="Bold"
                    >
                      <Bold className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => formatText("italic")}
                      className="h-8 w-8 p-0 border border-gray-200 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center"
                      title="Italic"
                    >
                      <Italic className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => formatText("list")}
                      className="h-8 w-8 p-0 border border-gray-200 rounded-md bg-white hover:bg-gray-50 flex items-center justify-center"
                      title="List"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={saveNotes}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      <span className="hidden sm:inline">Save</span>
                    </button>
                    <button
                      onClick={exportNotes}
                      className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Note Sections - Responsive Grid */}
              <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="bg-white rounded-lg border border-gray-200 flex flex-col"
                  >
                    <div className="p-3 sm:p-4 border-b border-gray-200 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-base sm:text-lg font-medium text-black truncate">
                            {section.title}
                          </h3>
                          {section.infoText && (
                            <div className="relative flex-shrink-0">
                              <button
                                onMouseEnter={() =>
                                  setHoveredTooltip(section.id)
                                }
                                onMouseLeave={() => setHoveredTooltip(null)}
                                className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600 flex items-center justify-center"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                              {hoveredTooltip === section.id && (
                                <div className="absolute left-0 top-6 z-10 w-72 sm:w-80 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
                                  <div className="whitespace-pre-line">
                                    {section.infoText}
                                  </div>
                                  <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => copyToClipboard(section.id)}
                            disabled={!section.content.trim()}
                            className={`h-8 w-8 p-0 border rounded-md flex items-center justify-center ${
                              copiedSection === section.id
                                ? "bg-green-500 text-white border-green-500"
                                : section.content.trim()
                                ? "bg-white border-gray-200 hover:bg-gray-50"
                                : "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                            title={
                              copiedSection === section.id
                                ? "Copied!"
                                : "Copy content"
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setActiveSection(section.id)}
                            className={`h-8 w-8 p-0 border rounded-md flex items-center justify-center ${
                              activeSection === section.id
                                ? "bg-blue-500 text-white border-blue-500"
                                : "bg-white border-gray-200 hover:bg-gray-50"
                            }`}
                            title="Focus this section"
                          >
                            <Type className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 sm:p-4 flex-1">
                      <textarea
                        ref={(el) => {
                          textareaRefs.current[section.id] = el;
                        }}
                        value={section.content}
                        onChange={(e) =>
                          updateSectionContent(section.id, e.target.value)
                        }
                        onFocus={() => setActiveSection(section.id)}
                        placeholder={`Enter your ${section.title.toLowerCase()} here...`}
                        className="w-full min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] resize-none border-0 p-0 focus:outline-none focus:ring-0 bg-transparent"
                        style={{
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                          lineHeight: "1.6",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Co-Pilot Samantha Sidebar - Responsive */}
        <CoPilotSamantha
          isOpen={isCoPilotOpen}
          onToggle={() => setIsCoPilotOpen(!isCoPilotOpen)}
          context={coPilotContext}
        />
      </div>
    </div>
  );
}