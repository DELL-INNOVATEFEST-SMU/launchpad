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
1. Site-specific searches: site:reddit.com "Singapore" ("mental health" OR "emotional support")
2. Platform-specific: "Singapore youth mental health Discord servers"
3. Topic-based: "Online support groups for Singapore students depression"
4. Cultural context: "Singapore Chinese/Malay/Indian youth mental health forums"

PROMPT FORMATTING GUIDELINES:
- Use specific site operators when targeting platforms (site:reddit.com, site:discord.com)
- Include relevant keywords in quotes for exact matches
- Use OR operators for related terms
- Include demographic terms (youth, teens, students, adolescents)
- Add location specificity (Singapore, SG, local)
- Include mental health related terms (anxiety, depression, support, struggles)

EXAMPLE PROMPT:
site:reddit.com "Singapore" ("mental health" OR "emotional support" OR "personal struggles" OR "seeking advice") (subreddit OR r/) ("youth" OR "teens" OR "students")

OUTPUT FORMAT (JSON):
{
  "optimizedPrompt": "Detailed, specific prompt for Jina AI Deep Search with site operators and keywords",
  "searchStrategy": "Explanation of search approach and why it will be effective",
  "expectedResults": ["List of expected result types"],
  "reasoning": "Why this prompt will be effective and what makes it optimized"
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

The prompt should be specific, use appropriate site operators, and include relevant keywords for maximum effectiveness.

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
      const platform = context?.platform || "Any"
      const audience = context?.targetAudience || "Singapore youths aged 12-19"
      
      let fallbackPrompt = ""
      if (platform === "Reddit") {
        fallbackPrompt = `site:reddit.com "Singapore" ("mental health" OR "emotional support" OR "personal struggles" OR "seeking advice") (subreddit OR r/) ("youth" OR "teens" OR "students")`
      } else if (platform === "Discord") {
        fallbackPrompt = `"Singapore" ("Discord" OR "discord.gg") ("mental health" OR "support" OR "anxiety" OR "depression") ("youth" OR "teens" OR "students")`
      } else {
        fallbackPrompt = `"Singapore" ("mental health" OR "emotional support" OR "personal struggles") ("youth" OR "teens" OR "students") (${platform === "Any" ? "Reddit OR Discord OR forums" : platform})`
      }
      
      parsedResponse = {
        optimizedPrompt: fallbackPrompt,
        searchStrategy: "Site-specific search with targeted keywords for maximum relevance",
        expectedResults: ["Online communities", "Support groups", "Discussion forums", "Discord servers", "Reddit subreddits"],
        reasoning: "Generated fallback prompt using site operators and targeted keywords for effective community discovery"
      }
    }

    // Validate required fields
    if (!parsedResponse.optimizedPrompt) {
      parsedResponse.optimizedPrompt = `site:reddit.com "Singapore" ("mental health" OR "emotional support" OR "personal struggles") ("youth" OR "teens" OR "students")`
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
