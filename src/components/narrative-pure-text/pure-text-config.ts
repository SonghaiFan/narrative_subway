import { merge } from "lodash";
import { SHARED_CONFIG } from "../shared/visualization-config";

// Merge with SHARED_CONFIG but don't override header settings
export const PURE_TEXT_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    top: 20,
    bottom: 20,
  },
  text: {
    cardSpacing: 16,
    cardPadding: 16,
    maxWidth: 768,
    fontSize: {
      title: 16,
      content: 14,
      meta: 12,
    },
    colors: {
      mainTopic: "#1e40af",
      subTopic: "#4b5563",
      selected: "#dbeafe",
      hover: "#f9fafb",
    },
    iconSize: 16,
  },
});
