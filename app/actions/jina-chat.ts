"use server"

interface JinaChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

interface JinaChatRequest {
  model: string
  messages: JinaChatMessage[]
  stream: boolean
  reasoning_effort: string
  budget_tokens: number
  max_attempts: number
}

/**
 * Server action to interact with Jina.ai DeepSearch API
 * Optimized for finding youth outreach opportunities in Singapore
 */
export async function sendJinaMessage(messages: JinaChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.JINA_API_KEY
  
  if (!apiKey) {
    throw new Error("Jina API key not configured")
  }

  // Enhance messages with context for Singapore youth outreach
  const enhancedMessages: JinaChatMessage[] = [
    {
      role: "system",
      content: `You are an AI assistant helping Singapore mental health professionals find potential starting points and communities to reach out to youths aged 12-19 who may be experiencing mental health challenges.

Focus on:
- Digital spaces and online communities popular among Singapore teens
- Platforms where young people share emotional content, seek support, or vent
- Specific subreddits, Discord servers, social media groups relevant to Singapore youth
- Online forums, gaming communities, and social platforms
- Provide actionable insights about where and how to engage respectfully
- Consider cultural context and local Singapore online spaces
- Suggest appropriate outreach strategies that are non-intrusive and supportive

Please structure your response with clear sections and reasoning steps where applicable. Show your thinking process when analyzing different platforms or communities.

Always prioritize ethical, respectful approaches that respect privacy and consent.`
    },
    ...messages
  ]

  const requestBody: JinaChatRequest = {
    model: "jina-deepsearch-v1",
    messages: enhancedMessages,
    stream: true,
    reasoning_effort: "high", // Increased for more detailed reasoning
    budget_tokens: 75000, // Increased budget for more comprehensive responses
    max_attempts: 3
  }

  try {
    const response = await fetch("https://deepsearch.jina.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error("No response body received")
    }

    return response.body
  } catch (error) {
    console.error("Jina API error:", error)
    throw new Error("Failed to connect to Jina AI service")
  }
}
