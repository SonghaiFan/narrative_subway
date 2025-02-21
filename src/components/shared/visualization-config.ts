export const SHARED_CONFIG = {
  margin: {
    top: 30,
    right: 40,
    bottom: 20,
    left: 40,
  },
  axis: {
    tickSize: 5,
    tickPadding: 5,
    labelOffset: 40,
    fontSize: 12,
  },
  animation: {
    duration: 200,
  },
  header: {
    height: 40,
  },
  minHeight: 800,
};

export const ENTITY_COLORS = {
  agent: "#2563EB", // Strong blue for primary actors
  patient: "#DC2626", // Red for those affected
  protagonist: "#059669", // Green for main positive actors
  antagonist: "#7C3AED", // Purple for main negative actors
  secondary: "#6B7280", // Gray for supporting entities
  expert: "#EA580C", // Orange for expert entities
};

export const ENTITY_CONFIG = {
  ...SHARED_CONFIG,
  entity: {
    labelFontSize: 14,
    lineStrokeWidth: 6,
    columnPadding: 0.2,
  },
  event: {
    nodeRadius: 6,
    nodeStrokeWidth: 2,
    connectorStrokeWidth: 3,
    labelFontSize: 12,
  },
};

export const TIME_CONFIG = {
  ...SHARED_CONFIG,
  point: {
    radius: 6,
    strokeWidth: 2,
    hoverRadius: 8,
  },
  curve: {
    strokeWidth: 20,
    opacity: 0.8,
  },
};
