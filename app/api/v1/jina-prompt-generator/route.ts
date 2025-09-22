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
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent prompt generation
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 2048, // Increased for more detailed prompts
      }
    })

    const systemPrompt = `You are a Jina AI Deep Search Prompt Generator that converts a rough user query into a precise search string. 
Your search strings must be tuned to return **links to actual online spaces** (Discord invite links, subreddit URLs, forum threads, social groups) relevant for mental-health outreach in Singapore. This means detecting youths that might be venting, stressed, lonely etc.

## Output
Return ONLY valid JSON:
{
  "optimizedPrompt": "<single search string ready for Jina Deep Search>"
}

## Inputs
- userQuery: the user's rough request (one sentence or phrase).
- context (optional object):
  - targetAudience (default: "Singapore youths aged 12-19")
  - platform (default: "Any")  // e.g. "Reddit", "Discord", "Forums", "Social", "Any"
  - outreachGoal (default: "Mental health support")
  - location (default: "Singapore")

## Rules
1. Your optimized prompt must bias toward **discovering joinable communities or group URLs**, not general info articles.
2. Use site operators to surface actual communities:
   - Reddit: site:reddit.com (inurl:/r/ OR intitle:subreddit OR "r/")
   - Discord: (site:discord.com OR site:discord.gg OR inurl:discord.gg OR inurl:/invite/)
   - Forums: (site:forums.* OR inurl:forum OR "join our community")
   - Social: (site:facebook.com/groups OR site:telegram.me OR site:t.me OR site:instagram.com)
3. Always anchor location: ("Singapore" OR "SG" OR "S'pore" OR "sgp").
4. Always anchor demographics: ("youth" OR "teen" OR "students" OR "secondary school" OR "poly" OR "JC").
5. Always anchor topic: ("mental health" OR "emotional support" OR anxiety OR depression OR "peer support" OR "struggles").
6. Expand with userQuery-specific add-ons (e.g., "gaming", "Valorant", "Roblox").
7. Exclude noise/irrelevant results: (-NSFW -18+ -dating -porn -gambling -betting -crypto -promo -giveaway -botlist).
8. Output only ONE well-formed query string.

## Example
Input userQuery: Find gaming Discord servers and communities popular among Singapore teens with mental health discussions
→ Output optimizedPrompt:
("Singapore" OR "SG" OR "S'pore") AND ("youth" OR "teens" OR "students") AND ("mental health" OR "emotional support" OR anxiety OR depression OR "peer support") AND (site:discord.com OR site:discord.gg OR inurl:discord.gg OR inurl:/invite/ OR site:reddit.com) AND (gaming OR "gamer" OR esports OR Valorant OR Minecraft OR Roblox) -NSFW -18+ -dating -porn -gambling -betting -crypto -promo -giveaway -botlist

## Final Instruction
Generate an optimized Jina AI Deep Search prompt for: "${userQuery}".
Focus on **returning community/join links**. Respond ONLY with JSON containing the optimizedPrompt field.`

    console.log("Sending request to Gemini with userQuery:", userQuery)
    const result = await model.generateContent(systemPrompt)
    const response = await result.response
    const text = response.text()
    
    console.log("Raw Gemini response:", text)

    // Parse the JSON response
    let parsedResponse
    try {
      // Extract JSON from the response (handle potential markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        console.log("Found JSON match:", jsonMatch[0])
        parsedResponse = JSON.parse(jsonMatch[0])
        console.log("Parsed response:", parsedResponse)
      } else {
        console.log("No JSON found in response, full text:", text)
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON response, using fallback:", parseError)
      console.log("Full response text that failed to parse:", text)
      
      // Fallback if JSON parsing fails
      const platform = context?.platform || "Any"
      
      let fallbackPrompt = ""
      if (platform === "Reddit") {
        fallbackPrompt = `site:reddit.com "Singapore" ("mental health" OR "emotional support" OR "personal struggles" OR "seeking advice") (subreddit OR r/) ("youth" OR "teens" OR "students")`
      } else if (platform === "Discord") {
        fallbackPrompt = `"Singapore" ("Discord" OR "discord.gg") ("mental health" OR "support" OR "anxiety" OR "depression") ("youth" OR "teens" OR "students")`
      } else {
        fallbackPrompt = `"Singapore" ("mental health" OR "emotional support" OR "personal struggles") ("youth" OR "teens" OR "students") (${platform === "Any" ? "Reddit OR Discord OR forums" : platform})`
      }
      
      parsedResponse = {
        optimizedPrompt: fallbackPrompt
      }
    }

    // Validate required fields
    if (!parsedResponse.optimizedPrompt) {
      parsedResponse.optimizedPrompt = `site:reddit.com "Singapore" ("mental health" OR "emotional support" OR "personal struggles") ("youth" OR "teens" OR "students")`
    }

    const finalResponse: JinaPromptResponse = {
      optimizedPrompt: parsedResponse.optimizedPrompt
    }

    console.log("Final response:", finalResponse)
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