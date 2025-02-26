import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), "public");
    const files = fs.readdirSync(publicDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    return NextResponse.json(jsonFiles);
  } catch (error) {
    console.error("Error reading public directory:", error);
    return NextResponse.json(
      { error: "Failed to read directory" },
      { status: 500 }
    );
  }
}
