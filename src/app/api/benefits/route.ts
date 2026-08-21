import { NextRequest, NextResponse } from "next/server";
import { PrismaBenefitProgramRepository } from "@/infrastructure/database/repositories/PrismaBenefitProgramRepository";

const programRepo = new PrismaBenefitProgramRepository();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") as any;
    const activeOnly = searchParams.get("activeOnly") === "true";

    const programs = await programRepo.findAll({
      category: category || undefined,
      activeOnly: activeOnly || undefined,
    });

    return NextResponse.json({
      success: true,
      data: programs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch programs" },
      { status: 500 }
    );
  }
}
