import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const archivedDir = path.join(publicDir, "archived");

    // Get files from the public directory
    const publicFiles = fs.readdirSync(publicDir);
    const publicJsonFiles = publicFiles
      .filter((file) => file.endsWith(".json"))
      .map((file) => file);

    // Get files from the archived directory if it exists
    let archivedJsonFiles: string[] = [];
    if (fs.existsSync(archivedDir)) {
      const archivedFiles = fs.readdirSync(archivedDir);
      archivedJsonFiles = archivedFiles
        .filter((file) => file.endsWith(".json"))
        .map((file) => `archived/${file}`);
    }

    // Sort each group alphabetically
    publicJsonFiles.sort();
    archivedJsonFiles.sort();

    // Move data.json to the front if it exists in public files
    const dataJsonIndex = publicJsonFiles.indexOf("data.json");
    if (dataJsonIndex !== -1) {
      publicJsonFiles.splice(dataJsonIndex, 1);
      publicJsonFiles.unshift("data.json");
    }

    // Combine both sets of files - public files first, then archived files
    const allJsonFiles = [...publicJsonFiles, ...archivedJsonFiles];

    return NextResponse.json(allJsonFiles);
  } catch (error) {
    console.error("Error reading directories:", error);
    return NextResponse.json(
      { error: "Failed to read directories" },
      { status: 500 }
    );
  }
}
