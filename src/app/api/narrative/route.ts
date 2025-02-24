import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function GET() {
  try {
    const dataDirectory = path.join(process.cwd(), "public");
    const fileContents = await fs.readFile(
      dataDirectory + "/data.json",
      "utf8"
    );
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error loading data:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
