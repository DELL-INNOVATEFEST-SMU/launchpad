import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

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
 * Gemini 2.5 Flash Chat API endpoint
 * Implements Google's Gemini API for advanced AI capabilities
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

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API not configured" },
        { status: 500 }
      )
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    })

    // Enhanced system prompt for mental health context
    const systemPrompt = `You are Co-Pilot Samantha, an advanced AI assistant specialized in supporting mental health professionals with case analysis, clinical documentation, and therapeutic insights.

PROFESSIONAL CONTEXT:
- You're assisting licensed mental health professionals
- Focus on evidence-based practices and ethical guidelines
- Maintain strict confidentiality and professional boundaries
- Provide supportive, non-judgmental guidance

CURRENT SESSION CONTEXT:
- Active section: ${context?.currentSection || "General Notes"}
- Case notes available: ${context?.caseNotes ? "Yes" : "No"}

${context?.caseNotes ? `CASE CONTEXT:
${context.caseNotes}

` : ""}CAPABILITIES:
• Case analysis and pattern recognition
• Clinical documentation improvement
• Treatment planning and intervention strategies
• Risk assessment and safety planning
• Professional development guidance
• Evidence-based practice recommendations

GUIDELINES:
- Provide concise, actionable insights
- Suggest relevant questions for deeper exploration
- Reference appropriate therapeutic frameworks when relevant
- Maintain professional, supportive tone
- Focus on practical case management assistance
- Respect client confidentiality and dignity

Please provide helpful, professional assistance based on the conversation and available context.`

    // Convert message history to Gemini format
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }))

    const currentMessage = messages[messages.length - 1]

    const chat = model.startChat({
      history,
    })

    const result = await chat.sendMessage([
      systemPrompt,
      currentMessage.content
    ].join("\n\n"))

    const response = await result.response
    const text = response.text()

    const chatResponse: ChatResponse = {
      message: {
        role: "assistant",
        content: text
      },
      model: "gemini-2.5-flash",
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(chatResponse)

  } catch (error) {
    console.error("Gemini API error:", error)
    
    // Provide more specific error handling
    if (error instanceof Error) {
      if (error.message.includes("API_KEY")) {
        return NextResponse.json(
          { error: "Gemini API key not configured" },
          { status: 500 }
        )
      }
      if (error.message.includes("quota")) {
        return NextResponse.json(
          { error: "Gemini API quota exceeded" },
          { status: 429 }
        )
      }
    }

    return NextResponse.json(
      { error: "Gemini service temporarily unavailable" },
      { status: 500 }
    )
  }
}
