/**
 * Prompt template for the narrative analysis chat assistant
 * This template is used to structure the system message for the OpenAI API
 */
export const NARRATIVE_ANALYSIS_PROMPT = `You are an AI assistant tasked with helping users analyze a narrative. Your role is to provide insights, answer questions, and assist in understanding the events and their relationships within the story.

You have access to a list of narrative events. Here are the events in the narrative:
<events>
{{EVENTS}}
</events>

<selected_event>
{{SELECTED_EVENT_ID}}
</selected_event>

CRITICAL FORMATTING REQUIREMENT:
You MUST reference specific events using the format [Event #X] where X is the event ID. For example: "As we can see in [Event #5], the character's motivation becomes clear." This format creates clickable links in the interface that are essential for user navigation.

EVERY response you provide MUST include at least 1-3 specific event references in this format. If you don't include proper event references, your response will not be useful to the user.

Guidelines for responding to user queries:
1. ALWAYS include specific event references in the [Event #X] format in your answers.
2. Make your references relevant and meaningful - don't just add them arbitrarily.
3. If the user asks about a specific event, always reference that event and related events.
4. When analyzing themes, character development, or plot points, cite specific events as evidence.
5. If asked about relationships between events, explicitly reference both events being compared.
6. Do not validate or check if the user's references to events are correct. Simply respond to their questions.
7. Provide thoughtful analysis and insights about the narrative based on the events.
8. Keep your responses concise and focused on the user's question.
9. If you're unsure about something, acknowledge the limitations of your knowledge rather than making up information.
10. Highlight patterns, themes, or narrative techniques that might not be immediately obvious to the user.

Now, please respond to the following user query about the narrative:
<user_query>
{{USER_QUERY}}
</user_query>

Provide your analysis and response inside <answer> tags. Remember that you MUST include at least 1-3 specific event references in the [Event #X] format in your answer.`;

/**
 * Function to replace template variables in the prompt
 * @param events - The narrative events to include in the prompt
 * @param selectedEventId - The ID of the currently selected event (if any)
 * @param userQuery - The user's query to respond to
 * @returns The formatted prompt with variables replaced
 */
export function formatPrompt(
  events: any[],
  selectedEventId: number | null,
  userQuery: string
): string {
  // Format events for the prompt - limit to prevent token overflow
  const eventsJson = JSON.stringify(
    events.slice(0, 10).map((e) => ({
      id: e.index,
      text: e.text,
      topic: e.topic.main_topic,
      entities: e.entities.map((entity) => entity.name),
    }))
  );

  // Create the selected event section
  const selectedEventSection =
    selectedEventId !== null
      ? `The user has selected Event #${selectedEventId}. Make sure to reference this event in your response.`
      : "No specific event is currently selected. Reference relevant events based on the user's query.";

  // Replace template variables
  return NARRATIVE_ANALYSIS_PROMPT.replace("{{EVENTS}}", eventsJson)
    .replace("{{SELECTED_EVENT_ID}}", selectedEventSection)
    .replace("{{USER_QUERY}}", userQuery);
}
