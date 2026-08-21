import { NextRequest, NextResponse } from "next/server";
import { CitizenService } from "@/core/use-cases/citizens/CitizenService";

const citizenService = new CitizenService();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const province = searchParams.get("province") || undefined;
    const vulnerabilityLevel = searchParams.get("vulnerabilityLevel") || undefined;

    const result = await citizenService.getCitizens({
      search,
      province,
      vulnerabilityLevel,
    });

    return NextResponse.json({
      success: true,
      data: result.citizens,
      total: result.total,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch citizens" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await citizenService.createCitizen(body);

    return NextResponse.json({
      success: true,
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create citizen" },
      { status: 400 }
    );
  }
}
