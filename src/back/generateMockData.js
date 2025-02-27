// generateMockData.js
const { faker } = require("@faker-js/faker");
const fs = require("fs");
const path = require("path");

// Create a pool of unique entities
const entityPool = Array.from({ length: 30 }, () => ({
  id: faker.string.uuid(),
  name: faker.person.fullName(),
  role_type: faker.helpers.arrayElement([
    "agent",
    "patient",
    "protagonist",
    "antagonist",
    "secondary",
  ]),
  social_role: faker.helpers.arrayElement([
    "government",
    "organization",
    "expert",
    "public",
    "stakeholder",
    "object",
  ]),
}));

// Create a pool of unique topics
const topicPool = Array.from({ length: 4 }, () => ({
  main_topic: faker.lorem.word(),
  sub_topic: [faker.lorem.word(), faker.lorem.word()],
  sentiment: {
    polarity: faker.helpers.arrayElement(["positive", "negative", "neutral"]),
    intensity: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
  },
}));

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
  topic: faker.lorem.word(),
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
console.log(JSON.stringify(timelineData, null, 2));

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
