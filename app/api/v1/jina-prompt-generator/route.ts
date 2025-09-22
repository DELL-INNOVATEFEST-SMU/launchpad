import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

interface JinaPromptRequest {
  userQuery: string
  context?: {
    targetAudience?: string
    platform?: string
    outreachGoal?: string
    location?: string
  }
}

interface JinaPromptResponse {
  optimizedPrompt: string
  searchStrategy: string
  expectedResults: string[]
  jinaSearchUrl: string
  reasoning: string
}

/**
 * Jina AI Prompt Generator API
 * Uses Gemini 2.5 Flash to generate optimized prompts for Jina AI Deep Search
 * Specialized in finding online communities for mental health outreach in Singapore
 */
export async function POST(request: NextRequest): Promise<NextResponse<JinaPromptResponse | { error: string }>> {
  try {
    const body: JinaPromptRequest = await request.json()
    const { userQuery, context } = body

    if (!userQuery) {
      return NextResponse.json({ error: "User query is required" }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API not configured" }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent prompt generation
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 1024,
      }
    })

    const systemPrompt = `You are a Jina AI Deep Search Prompt Generator specialized in finding online communities for mental health outreach in Singapore.

YOUR ROLE:
- Analyze user queries about finding online spaces
- Generate optimized prompts for Jina AI Deep Search
- Focus on subreddits, Discord servers, forums, and social platforms
- Prioritize Singapore-specific and youth-focused communities

SEARCH STRATEGIES:
1. Direct Community Search: "Singapore youth mental health Discord servers"
2. Platform-Specific: "Reddit communities for Singapore teens with anxiety"
3. Topic-Based: "Online support groups for Singapore students depression"
4. Cultural Context: "Singapore Chinese/Malay/Indian youth mental health forums"

OUTPUT FORMAT (JSON):
{
  "optimizedPrompt": "Detailed prompt for Jina AI Deep Search",
  "searchStrategy": "Explanation of search approach",
  "expectedResults": ["List of expected result types"],
  "reasoning": "Why this prompt will be effective"
}

FOCUS AREAS:
- Singapore-specific communities
- Youth (12-19 years old) focused spaces
- Mental health, emotional support, peer groups
- Gaming communities, Discord servers, Reddit subreddits
- Cultural and language-specific platforms

CONTEXT:
- Target Audience: ${context?.targetAudience || "Singapore youths aged 12-19"}
- Platform Preference: ${context?.platform || "Any"}
- Outreach Goal: ${context?.outreachGoal || "Mental health support"}
- Location: ${context?.location || "Singapore"}

Generate an optimized Jina AI Deep Search prompt for: "${userQuery}"

Respond ONLY with valid JSON in the exact format specified above.`

    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()

    // Parse the JSON response
    let parsedResponse
    try {
      // Extract JSON from the response (handle potential markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON response, using fallback:", parseError)
      // Fallback if JSON parsing fails
      parsedResponse = {
        optimizedPrompt: `Find online communities and digital spaces where ${context?.targetAudience || "Singapore youths aged 12-19"} gather to discuss mental health, share struggles, or seek peer support. Focus on ${context?.platform || "various platforms"} including Reddit subreddits, Discord servers, online forums, and social media groups. Prioritize Singapore-specific communities and consider cultural context.`,
        searchStrategy: "Direct community search with platform-specific focus",
        expectedResults: ["Online communities", "Support groups", "Discussion forums", "Discord servers", "Reddit subreddits"],
        reasoning: "Generated based on user query and context parameters"
      }
    }

    // Validate required fields
    if (!parsedResponse.optimizedPrompt) {
      parsedResponse.optimizedPrompt = `Find online communities where ${context?.targetAudience || "Singapore youths"} discuss mental health and seek support.`
    }
    if (!parsedResponse.searchStrategy) {
      parsedResponse.searchStrategy = "Direct search approach"
    }
    if (!parsedResponse.expectedResults || !Array.isArray(parsedResponse.expectedResults)) {
      parsedResponse.expectedResults = ["Online communities", "Support groups", "Discussion forums"]
    }
    if (!parsedResponse.reasoning) {
      parsedResponse.reasoning = "Generated based on user query"
    }

    // Create Jina AI search URL
    const jinaSearchUrl = `https://search.jina.ai/?q=${encodeURIComponent(parsedResponse.optimizedPrompt)}`

    const finalResponse: JinaPromptResponse = {
      ...parsedResponse,
      jinaSearchUrl
    }

    return NextResponse.json(finalResponse)

  } catch (error) {
    console.error("Jina Prompt Generator error:", error)
    
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
      { error: "Failed to generate Jina AI prompt" },
      { status: 500 }
    )
  }
}
