import { NextRequest, NextResponse } from "next/server"

interface ModelInfo {
  id: string
  name: string
  description: string
  capabilities: string[]
  status: "available" | "unavailable" | "maintenance"
  responseTime: "fast" | "medium" | "slow"
  privacy: "local" | "cloud"
}

interface ModelConfig {
  selectedModel: string
  availableModels: ModelInfo[]
  defaultModel: string
}

/**
 * Model configuration and management API endpoint
 * Provides information about available AI models and manages user preferences
 */
export async function GET(): Promise<NextResponse<ModelConfig>> {
  const models: ModelInfo[] = [
    {
      id: "local-npu",
      name: "Local Model",
      description: "Fast, private AI running on your device's Neural Processing Unit",
      capabilities: [
        "Case analysis",
        "Note organization", 
        "Pattern recognition",
        "Clinical insights",
        "Privacy-first processing"
      ],
      status: "available",
      responseTime: "fast",
      privacy: "local"
    },
    {
      id: "gemini-flash",
      name: "Gemini 2.5 Flash",
      description: "Google's advanced AI model with enhanced reasoning capabilities",
      capabilities: [
        "Advanced reasoning",
        "Comprehensive analysis",
        "Evidence-based insights",
        "Treatment planning",
        "Professional development"
      ],
      status: process.env.GOOGLE_API_KEY ? "available" : "unavailable",
      responseTime: "medium",
      privacy: "cloud"
    }
  ]

  const config: ModelConfig = {
    selectedModel: "local-npu", // Default to local as requested
    availableModels: models,
    defaultModel: "local-npu"
  }

  return NextResponse.json(config)
}

export async function POST(request: NextRequest): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  try {
    const { selectedModel } = await request.json()
    
    // Validate model selection
    const validModels = ["local-npu", "gemini-flash"]
    if (!selectedModel || !validModels.includes(selectedModel)) {
      return NextResponse.json(
        { error: "Invalid model selection" },
        { status: 400 }
      )
    }

    // In a production app, you would:
    // 1. Store this preference in a database
    // 2. Associate it with the user session
    // 3. Implement proper user authentication
    
    // For now, we'll just validate the selection
    console.log(`Model preference updated to: ${selectedModel}`)

    return NextResponse.json({
      success: true,
      message: `Model preference updated to ${selectedModel}`
    })

  } catch (error) {
    console.error("Model configuration error:", error)
    return NextResponse.json(
      { error: "Failed to update model configuration" },
      { status: 500 }
    )
  }
}
