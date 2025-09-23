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
 * This endpoint connects to a local AI model running on NPU via LOCAL_NPU_BASE_URL
 * The local NPU service should be running at LOCAL_NPU_BASE_URL/chat
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

    // Get the local NPU base URL from environment variable
    const localNpuBaseUrl = process.env.LOCAL_NPU_BASE_URL
    
    if (!localNpuBaseUrl) {
      return NextResponse.json(
        { error: "LOCAL_NPU_BASE_URL environment variable not configured" },
        { status: 500 }
      )
    }

    // Construct the full endpoint URL
    const localNpuEndpoint = `${localNpuBaseUrl}/chat`

    // Ensure the first message is always a system message with prompt
    const systemPrompt = `You are Co-Pilot Samantha, a specialized AI assistant for mental health professionals.
You're running locally on NPU for maximum privacy and speed.

Current session context:
- Active section: ${context?.currentSection || "General Notes"}
- Case notes available: ${context?.caseNotes ? "Yes" : "No"}

${context?.caseNotes ? `Case context:\n${context.caseNotes}\n\n` : ""}

You should provide helpful, professional assistance with case documentation, clinical insights, treatment planning, and evidence-based recommendations. Always maintain confidentiality and professional standards.`

    // Prepend system message if not already present
    const messagesWithSystem = messages[0]?.role === "system" 
      ? messages 
      : [
          {
            role: "system" as const,
            content: systemPrompt
          },
          ...messages
        ]

    // Forward the request to the local NPU service
    const npuResponse = await fetch(localNpuEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messagesWithSystem,
        context,
      }),
    })

    if (!npuResponse.ok) {
      const errorText = await npuResponse.text()
      console.error("Local NPU service error:", errorText)
      return NextResponse.json(
        { error: "Local NPU service unavailable" },
        { status: 503 }
      )
    }

    const npuData = await npuResponse.json()

    // Transform the response to match our expected format
    const response: ChatResponse = {
      message: {
        role: "assistant",
        content: npuData.text || npuData.message?.content || npuData.content || "No response from local NPU",
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
