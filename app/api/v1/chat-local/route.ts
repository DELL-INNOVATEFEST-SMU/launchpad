import { NextRequest, NextResponse } from "next/server"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  context?: {
    currentSection?: string
    caseNotes?: string
  }
}

interface ChatResponse {
  message: ChatMessage
  model: string
  timestamp: string
}

/**
 * Local NPU Chat API endpoint
 * This endpoint simulates interaction with a local AI model running on NPU
 * In production, this would connect to your local NPU service
 */
export async function POST(request: NextRequest): Promise<NextResponse<ChatResponse | { error: string }>> {
  try {
    const body: ChatRequest = await request.json()
    const { messages, context } = body

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 })
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json({ error: "Last message must be from user" }, { status: 400 })
    }

    // Simulate NPU processing delay (typically faster than cloud APIs)
    await new Promise(resolve => setTimeout(resolve, 800))

    // Enhanced system context for local model
    const systemContext = `You are Co-Pilot Samantha, a specialized AI assistant for mental health professionals.
You're running locally on NPU for maximum privacy and speed.

Current session context:
- Active section: ${context?.currentSection || "General Notes"}
- Case notes available: ${context?.caseNotes ? "Yes" : "No"}

${context?.caseNotes ? `Case context:\n${context.caseNotes}\n\n` : ""}`

    // Simulate intelligent local NPU response
    const userQuery = lastMessage.content.toLowerCase()
    let responseContent = ""

    if (userQuery.includes("help") || userQuery.includes("assist")) {
      responseContent = `I'm here to help with your case work! Based on your current section (${context?.currentSection || "General Notes"}), I can assist with:

• Case analysis and pattern recognition
• Note organization and structuring  
• Clinical observation insights
• Treatment planning suggestions
• Documentation review and improvement

What specific aspect would you like help with?`
    } else if (userQuery.includes("analyze") || userQuery.includes("review")) {
      responseContent = `I can help analyze your case notes. ${context?.caseNotes ? 
        "I can see you have case notes available. Let me review the key patterns and provide insights." : 
        "I don't see any case notes yet. Could you share what you'd like me to analyze?"
      }

Key areas I can help analyze:
• Risk assessment indicators
• Treatment progress patterns
• Client engagement levels
• Intervention effectiveness
• Documentation completeness`
    } else if (userQuery.includes("plan") || userQuery.includes("intervention")) {
      responseContent = `For intervention planning, I can help structure your approach:

${context?.currentSection === "Intervention Plan" ? 
  "I see you're working on the Intervention Plan section. " : 
  "Let's focus on intervention planning. "
}

Consider these elements:
• Client-specific goals and objectives
• Evidence-based intervention strategies
• Measurable outcomes and metrics
• Timeline and milestones
• Risk mitigation strategies

What specific intervention area would you like to develop?`
    } else {
      responseContent = `I understand you're asking: "${lastMessage.content}"

As your local NPU-powered assistant, I'm processing this request privately on your device. I can help with:

• Case documentation and organization
• Clinical insights and analysis
• Treatment planning and interventions
• Risk assessment and safety planning
• Professional development and best practices

${context?.caseNotes ? "I have access to your current case notes for context-aware assistance." : "Feel free to share case details for more specific guidance."}

How can I best support your case work today?`
    }

    const response: ChatResponse = {
      message: {
        role: "assistant",
        content: responseContent
      },
      model: "local-npu-v1",
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error("Local NPU API error:", error)
    return NextResponse.json(
      { error: "Local NPU service temporarily unavailable" },
      { status: 500 }
    )
  }
}
