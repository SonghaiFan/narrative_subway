export interface Entity {
  id: string; // Unique and unified entity ID
  name: string; // The name of the entity (person, organization, or abstract entity)
  // Narrative Role (Greimas' Actantial Model)
  narrative_role?:
    | "subject" // Protagonist, initiator of action (e.g., politician pushing reform)
    | "object" // Goal of the story (e.g., justice, policy change, election victory)
    | "sender" // Motivating force (e.g., public demand, breaking news event)
    | "receiver" // Beneficiary of the outcome (e.g., citizens, economy, victims)
    | "helper" // Aiding the subject (e.g., experts, media, allies)
    | "opponent"; // Obstructing the subject (e.g., political rivals, corporations)
  // Archetypal Role (Propp’s Character Model)
  archetypal_role?:
    | "hero" // Central positive figure (e.g., whistleblower, reformist)
    | "villain" // Antagonist causing conflict (e.g., corrupt politicians, criminals)
    | "donor" // Provider of resources (e.g., scientists, whistleblowers)
    | "helper" // Sidekick or ally (e.g., activist groups, media supporters)
    | "princess" // Goal to be achieved (e.g., justice, peace, policy change)
    | "dispatcher" // Instigator of the quest (e.g., news leaks, breaking events)
    | "false_hero"; // Pretender to heroism (e.g., politicians faking reform)
  // Social Representation (Van Leeuwen’s Framework)
  social_role?:
    | "government" // State actors (e.g., presidents, ministers, institutions)
    | "corporate" // Business entities (e.g., CEOs, banks, financial institutions)
    | "expert" // Analysts, scientists, professionals (e.g., economists, legal experts)
    | "media" // Journalists, news organizations, social media influencers
    | "activist" // NGOs, advocacy groups, grassroots leaders
    | "public" // General population, citizens
    | "stakeholder" // Investors, lobbyists, unions, interest groups
    | "object"; // Non-human elements (laws, policies, economic forces)
  // Discourse Role (Van Leeuwen’s Linguistic Representation)
  discourse_role?:
    | "agent" // Performs action (e.g., "The government passed the law.")
    | "patient" // Receives action (e.g., "Protesters were arrested.")
    | "narrator" // Provides information (e.g., journalists, spokespersons)
    | "source" // Quoted expert, testimony giver (e.g., witnesses, analysts)
    | "genericized" // Represented as a broad group (e.g., "Immigrants," "Voters")
    | "individualized"; // Specific named entity (e.g., "Elon Musk," "Angela Merkel")
  importance_level?:
    | "primary" // A main actor in the story
    | "secondary" // A supporting or background figure
    | "mentioned"; // Briefly referenced, not central to the story
  // Additional flexible attributes
  [key: string]: any; // Allow any additional attributes
}

export interface Topic {
  main_topic: string;
  sub_topic: string[];
  sentiment: {
    polarity: "positive" | "negative" | "neutral";
    intensity: number;
  };
}

export interface NarrativeEvent {
  index: number;
  text: string;
  short_text: string;
  lead_title?: string;
  narrative_level: string;
  narrator_type: string;
  temporal_position: string;
  source_name: string | null;
  narrative_phase: string;
  temporal_anchoring: {
    real_time: string | null;
    narrative_time: number;
    temporal_type: "relative" | "absolute";
    anchor: string;
  };
  entities: Entity[];
  topic: Topic;
}

export interface NarrativeMetadata {
  title: string;
  description: string;
  topic: string;
  author: string;
  publishDate: string;
  imageUrl?: string | null;
}

export interface NarrativeMatrixData {
  metadata: NarrativeMetadata;
  events: NarrativeEvent[];
}
