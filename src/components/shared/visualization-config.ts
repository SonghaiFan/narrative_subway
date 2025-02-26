export const SHARED_CONFIG = {
  margin: {
    top: 30,
    right: 40,
    bottom: 20,
    left: 150,
  },
  axis: {
    tickSize: 5,
    tickPadding: 10,
    labelOffset: 45,
    fontSize: 12,
  },
  animation: {
    duration: 200,
  },
  header: {
    height: 40,
  },
  minHeight: 800,
  point: {
    radius: 6,
    strokeWidth: 2,
    hoverRadius: 9,
    hoverStrokeWidth: 3,
  },
  edge: {
    strokeWidth: 1.5,
    opacity: 0.4,
    dashArray: "4,4",
  },
};

export const ENTITY_COLORS = {
  agent: "#2563eb", // blue-600
  patient: "#dc2626", // red-600
  protagonist: "#059669", // emerald-600
  antagonist: "#9333ea", // purple-600
  secondary: "#ca8a04", // yellow-600
  expert: "#0891b2", // cyan-600
};

export const SOCIAL_ROLE_COLORS = {
  government: "#2563eb", // blue-600
  organization: "#059669", // emerald-600
  expert: "#0891b2", // cyan-600
  public: "#dc2626", // red-600
  stakeholder: "#ca8a04", // yellow-600
  geographical: "#9333ea", // purple-600
  infrastructure: "#0d9488", // teal-600
  object: "#94a3b8", // slate-400
};

export const ENTITY_CONFIG = {
  ...SHARED_CONFIG,
  margin: {
    top: 30,
    right: 20,
    bottom: 20,
    left: 50,
  },
  entity: {
    labelFontSize: 14,
    lineStrokeWidth: 6,
    columnPadding: 0.2,
    minColumnWidth: 50,
    maxColumnWidth: 200,
    columnGap: 20,
  },
  event: {
    nodeRadius: 6,
    nodeStrokeWidth: 2,
    connectorStrokeWidth: 3,
    labelFontSize: 12,
  },
};

export const EVENT_COLORS = {
  positiveFill: "#ffffff",
  negativeFill: "#f3f3f3",
  neutralFill: "#ffffff",
  positiveStroke: "#000000",
  negativeStroke: "#666666",
  neutralStroke: "#999999",
};

export const TIME_CONFIG = {
  ...SHARED_CONFIG,
  axis: {
    ...SHARED_CONFIG.axis,
    tickPadding: 5,
  },
  curve: {
    strokeWidth: 6,
    opacity: 0.2,
  },
};
