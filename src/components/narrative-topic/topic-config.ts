import { merge } from "lodash";
import { SHARED_CONFIG } from "../shared/visualization-config";

export const TOPIC_CONFIG = merge({}, SHARED_CONFIG, {
  edge: {
    strokeWidth: 2,
    opacity: 0.4,
    dashArray: "3,3",
    minOpacity: 0.2,
    maxOpacity: 0.8,
  },
});
