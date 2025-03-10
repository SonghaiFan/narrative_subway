import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { formatPrompt } from "@/lib/prompts/chat-prompt";

// Check if OpenAI API key is available
const apiKey = process.env.OPENAI_API_KEY;

// Initialize OpenAI client if API key is available
const openai = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI client is initialized
    if (!openai) {
      console.error(
        "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable."
      );
      return NextResponse.json(
        {
          error:
            "OpenAI API key is not configured. Please contact the administrator.",
          message: {
            role: "assistant",
            content:
              "I'm sorry, but I'm not available at the moment due to a configuration issue. Please try again later or contact the administrator.",
            timestamp: new Date().toISOString(),
          },
        },
        { status: 500 }
      );
    }

    const { messages, events, selectedEventId } = await request.json();

    // Get the user's latest message
    const userLatestMessage = messages[messages.length - 1].content;

    // Create the system message using the prompt template
    const systemMessage = {
      role: "system",
      content: formatPrompt(events, selectedEventId, userLatestMessage),
    };

    // Format messages for OpenAI API - exclude the latest user message as it's included in the system prompt
    const formattedMessages = [
      systemMessage,
      ...messages.slice(0, -1).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content:
          "Please analyze based on the information provided. Remember to include specific event references in your answer using the [Event #X] format.",
      },
    ];

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Extract the assistant's response
    const assistantResponse = response.choices[0].message;

    // Extract content from <answer> tags if present
    let content = assistantResponse.content || "";
    const answerMatch = content.match(/<answer>([\s\S]*?)<\/answer>/);
    if (answerMatch && answerMatch[1]) {
      content = answerMatch[1].trim();
    }

    // Check if the response contains event references
    const hasEventReferences = content.match(/\[Event #\d+\]/);
    if (!hasEventReferences) {
      // If no event references, add a reminder
      content = `${content}\n\n(Remember to reference specific events using the [Event #X] format in your future questions for more detailed analysis.)`;
    }

    // Return the response with timestamp as ISO string
    return NextResponse.json({
      message: {
        role: "assistant",
        content: content,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      {
        error: "Failed to get response from OpenAI",
        message: {
          role: "assistant",
          content:
            "I'm sorry, but I encountered an error while processing your request. Please try again later.",
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}
