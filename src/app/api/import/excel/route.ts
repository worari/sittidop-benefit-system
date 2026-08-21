import { NextRequest, NextResponse } from "next/server";
import { ExcelImportService } from "@/core/use-cases/import/ExcelImportService";
import { AuditLogger } from "@/infrastructure/logging/audit-logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "template") {
      const buffer = ExcelImportService.generateTemplateBuffer();
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Disposition": `attachment; filename="sittidop_import_template.xlsx"`,
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const commit = formData.get("commit") === "true";

    if (!file) {
      return NextResponse.json({ success: false, error: "กรุณาแนบไฟล์ Excel (.xlsx, .xls)" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Parse and Validate
    const validationResult = ExcelImportService.parseAndValidate(buffer, file.name);

    // 2. Commit if requested and valid
    let commitResult = null;
    if (commit && validationResult.isValid) {
      commitResult = ExcelImportService.commitData(validationResult.parsedData);

      await AuditLogger.log({
        action: "EXCEL_IMPORT_COMMITTED",
        resource: "MilitaryPersonnel",
        resourceId: file.name,
        details: {
          personnelSaved: commitResult.personnelSaved,
          familyLinked: commitResult.familyLinked,
          benefitsSaved: commitResult.benefitsSaved,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...validationResult,
        committed: commit && validationResult.isValid,
        commitResult,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
