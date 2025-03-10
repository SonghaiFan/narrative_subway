import { OpenAI } from "openai";
import { NextRequest, NextResponse } from "next/server";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, events, selectedEventId } = await request.json();

    // Prepare the system message with context about the narrative
    const systemMessage = {
      role: "system",
      content: `You are an AI assistant helping users analyze a narrative. 
      You have access to a list of narrative events. 
      ${
        selectedEventId
          ? `The user has selected event #${selectedEventId}.`
          : ""
      }
      ${
        events && events.length > 0
          ? `Here are the events in the narrative: ${JSON.stringify(
              events.slice(0, 10)
            )}...`
          : "No events are currently available."
      }
      
      IMPORTANT FORMATTING INSTRUCTION:
      When referring to specific events in your responses, always use the format [Event #X] where X is the event ID.
      For example: "As we can see in [Event #5], the character's motivation becomes clear."
      This allows the interface to create clickable links to those events.
      
      Try to reference specific event IDs when relevant to your answer, but don't force references if they're not relevant.
      
      Do not validate or check if the user's references to events are correct. Simply respond to their questions and store their answers.`,
    };

    // Format messages for OpenAI API
    const formattedMessages = [
      systemMessage,
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
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

    // Return the response with timestamp as ISO string
    return NextResponse.json({
      message: {
        role: "assistant",
        content: assistantResponse.content,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("OpenAI API error:", error);
    return NextResponse.json(
      { error: "Failed to get response from OpenAI" },
      { status: 500 }
    );
  }
}
