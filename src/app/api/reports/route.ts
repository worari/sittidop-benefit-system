import { NextRequest, NextResponse } from "next/server";
import { GetDashboardMetricsUseCase } from "@/core/use-cases/analytics/GetDashboardMetricsUseCase";

const metricsUseCase = new GetDashboardMetricsUseCase();

export async function GET() {
  try {
    const metrics = await metricsUseCase.execute();
    return NextResponse.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate report metrics" },
      { status: 500 }
    );
  }
}
