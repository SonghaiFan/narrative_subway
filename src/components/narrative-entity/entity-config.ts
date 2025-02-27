import { merge } from "lodash";
import { SHARED_CONFIG } from "../shared/visualization-config";

export const ENTITY_CONFIG = merge({}, SHARED_CONFIG, {
  margin: {
    left: 120,
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
});
