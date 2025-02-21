export interface Entity {
  id: string; // unique and unifined id
  name: string;
  role_type: "agent" | "patient" | "protagonist" | "antagonist" | "secondary";
  social_role:
    | "government"
    | "organization"
    | "expert"
    | "public"
    | "stakeholder"
    | "object";
}

export interface Topic {
  main_topic: string;
  sub_topic: string[];
  sentiment: {
    polarity: "positive" | "negative" | "neutral";
    intensity: number;
  };
}

export interface TimelineEvent {
  index: number;
  text: string;
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

export interface TimelineMetadata {
  title: string;
  description: string;
  author: string;
  publishDate: string;
  imageUrl?: string | null;
}

export interface TimelineData {
  metadata: TimelineMetadata;
  events: TimelineEvent[];
}
