import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), "public", "data");
    const files = fs.readdirSync(dataDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    return NextResponse.json(jsonFiles);
  } catch (error) {
    console.error("Error reading data directory:", error);
    return NextResponse.json(
      { error: "Failed to read directory" },
      { status: 500 }
    );
  }
}
