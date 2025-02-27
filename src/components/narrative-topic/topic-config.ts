import { merge } from "lodash";
import { SHARED_CONFIG } from "../shared/visualization-config";

export const TOPIC_CONFIG = merge({}, SHARED_CONFIG, {});
