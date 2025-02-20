import { TimelineData } from "@/types/article";
import fs from "fs";
import path from "path";

export async function getTimelineData(filename: string): Promise<TimelineData> {
  const dataDirectory = path.join(process.cwd(), "src/data");
  const filePath = path.join(dataDirectory, filename);

  try {
    const jsonData = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(jsonData) as TimelineData;
    return data;
  } catch (error) {
    console.error("Error loading timeline data:", error);
    throw new Error("Failed to load timeline data");
  }
}

export async function getAllTimelineFiles(): Promise<string[]> {
  const dataDirectory = path.join(process.cwd(), "src/data");

  try {
    const files = await fs.promises.readdir(dataDirectory);
    return files.filter((file) => file.endsWith(".json"));
  } catch (error) {
    console.error("Error reading timeline directory:", error);
    return [];
  }
}
