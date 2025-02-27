// generateMockData.mjs
import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extract level 1 topics from IPTC-Subject-NewsCodes.json
const iptcFilePath = path.resolve(__dirname, "IPTC-Subject-NewsCodes.json");
// Read file and fix NaN values which are invalid in JSON
const iptcFileContent = fs
  .readFileSync(iptcFilePath, "utf8")
  .replace(/:\s*NaN/g, ': "N/A"');
const iptcData = JSON.parse(iptcFileContent);

// First, select a level 1 topic for metadata
const selectedLevel1Key = faker.helpers.arrayElement(
  Object.keys(iptcData).filter((key) => iptcData[key].level === 1)
);
const selectedLevel1Topic = iptcData[selectedLevel1Key];

// Extract level 2 topics under the selected level 1 topic
const level2TopicsUnderSelected = Object.entries(
  selectedLevel1Topic.subcategories
).map(([key, value]) => ({ key, ...value }));

// Create a pool of unique topics using level 2 topics from the selected level 1
const topicPool = Array.from({ length: 4 }, () => {
  // Select a random level 2 topic from the available ones
  const selectedLevel2 = faker.helpers.arrayElement(level2TopicsUnderSelected);

  // Get level 3 topics (subcategories) for the selected level 2 topic
  const level3Topics = Object.values(selectedLevel2.subcategories || {}).map(
    (subcat) => subcat.name
  );

  // Select 1-2 random level 3 topics as sub_topics or generate if none available
  const subTopics =
    level3Topics.length > 0
      ? faker.helpers.arrayElements(
          level3Topics,
          Math.min(2, level3Topics.length)
        )
      : [faker.lorem.word(), faker.lorem.word()]; // Fallback if no level 3 topics

  return {
    main_topic: selectedLevel2.name,
    sub_topic: subTopics,
    sentiment: {
      polarity: faker.helpers.arrayElement(["positive", "negative", "neutral"]),
      intensity: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
    },
  };
});

// Define arrays for each role type based on the updated Entity interface
const narrativeRoles = [
  "subject",
  "object",
  "sender",
  "receiver",
  "helper",
  "opponent",
];

const archetypeRoles = [
  "hero",
  "villain",
  "donor",
  "helper",
  "princess",
  "dispatcher",
  "false_hero",
];

const social_role = [
  "government",
  "corporate",
  "expert",
  "media",
  "activist",
  "public",
  "stakeholder",
  "object",
];

const discourse_role = [
  "agent",
  "patient",
  "narrator",
  "source",
  "genericized",
  "individualized",
];

const importanceLevels = ["primary", "secondary", "mentioned"];

// Create a pool of unique entities with the updated structure
const entityPool = Array.from({ length: 30 }, () => {
  // Base entity object
  const entity = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
  };

  entity.narrative_role = faker.helpers.arrayElement(narrativeRoles);
  entity.archetypal_role = faker.helpers.arrayElement(archetypeRoles);
  entity.social_role = faker.helpers.arrayElement(social_role);
  entity.discourse_role = faker.helpers.arrayElement(discourse_role);
  entity.importance_level = faker.helpers.arrayElement(importanceLevels);

  return entity;
});

// Generate events - increased to 50 events
const events = Array.from({ length: 50 }, (_, index) => {
  // Base event structure
  const event = {
    index: index + 1,
    text: faker.lorem.paragraphs(2),
    short_text: faker.lorem.sentence(),
    narrative_level: faker.lorem.word(),
    narrator_type: faker.lorem.word(),
    temporal_position: faker.lorem.word(),
    source_name: faker.internet.domainName(),
    narrative_phase: faker.lorem.word(),
    temporal_anchoring: {
      real_time: faker.date.past().toISOString(),
      narrative_time: index + 1,
      temporal_type: faker.helpers.arrayElement(["relative", "absolute"]),
      anchor: faker.lorem.word(),
    },
    entities: faker.helpers.arrayElements(
      entityPool,
      faker.number.int({ min: 0, max: 10 })
    ),
    topic: faker.helpers.arrayElement(topicPool),
  };

  // Only add lead_title for every 10th event (0, 10, 20, 30, 40...)
  if (index % 10 === 0) {
    event.lead_title = faker.lorem.sentence();
  }

  return event;
});

// Generate metadata
const metadata = {
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  topic: selectedLevel1Topic.name,
  author: faker.person.fullName(),
  publishDate: faker.date.past().toISOString(),
  imageUrl: faker.image.url(),
};

// Combine into TimelineData
const timelineData = {
  metadata,
  events,
};

// Output the generated data
// console.log(JSON.stringify(timelineData, null, 2));

// Save the generated data to a JSON file in the public directory
const outputPath = path.resolve(
  process.cwd(),
  "..",
  "..",
  "public",
  "data.json"
);
fs.writeFileSync(outputPath, JSON.stringify(timelineData, null, 2));
console.log(`Mock data saved to ${outputPath}`);
