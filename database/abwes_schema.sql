-- ==============================================================================
-- ABWES - Army Personnel Benefit & Welfare Estimation System
-- SQL Server Database Schema
-- ฐานข้อมูลระบบประมาณสิทธิและสวัสดิการกำลังพลกองทัพบก
-- ==============================================================================
-- Design Principles:
--   - Third Normal Form (3NF): No repeating groups, no partial dependencies,
--     no transitive dependencies.
--   - Temporal Integrity: Rank/Unit/Salary history stored with effective dates.
--   - Financial Precision: All monetary columns use DECIMAL(15,2) or DECIMAL(18,2).
--   - Auditability: Append-only AuditLog with hash chain.
--   - Security: Sensitive PII columns marked for application-level encryption.
-- ==============================================================================

USE master;
GO

IF DB_ID('ABWES') IS NOT NULL
    DROP DATABASE ABWES;
GO

CREATE DATABASE ABWES
    COLLATE Thai_CI_AS;
GO

USE ABWES;
GO

-- ==============================================================================
-- Schemas
-- ==============================================================================
CREATE SCHEMA ref;
GO
CREATE SCHEMA core;
GO
CREATE SCHEMA hist;
GO
CREATE SCHEMA ent;
GO
CREATE SCHEMA wfl;
GO
CREATE SCHEMA bud;
GO
CREATE SCHEMA aud;
GO

-- ==============================================================================
-- 1. Reference / Master Data Tables
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- ref.MilitaryBranch : ทะเบียนเหล่าทัพ / สังกัดกระทรวง
-- -----------------------------------------------------------------------------
CREATE TABLE ref.MilitaryBranch (
    BranchId        BIGINT          IDENTITY(1,1) NOT NULL,
    BranchCode      VARCHAR(20)     NOT NULL,
    BranchNameTh    NVARCHAR(100)   NOT NULL,
    BranchNameEn    NVARCHAR(100)   NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_MilitaryBranch PRIMARY KEY CLUSTERED (BranchId),
    CONSTRAINT UQ_MilitaryBranch_Code UNIQUE (BranchCode)
);
GO

CREATE INDEX IX_MilitaryBranch_IsActive ON ref.MilitaryBranch (IsActive);
GO

-- -----------------------------------------------------------------------------
-- ref.MilitaryRank : ทะเบียนยศ ทบ.
-- -----------------------------------------------------------------------------
CREATE TABLE ref.MilitaryRank (
    RankId          BIGINT          IDENTITY(1,1) NOT NULL,
    RankCode        VARCHAR(20)     NOT NULL,
    RankNameTh      NVARCHAR(100)   NOT NULL,
    RankNameEn      NVARCHAR(100)   NULL,
    RankGroup       NVARCHAR(50)    NOT NULL,        -- OFFICER / NCO / ENLISTED / VOLUNTEER
    RankOrder       INT             NOT NULL,        -- ลำดับยศสำหรับเปรียบเทียบ
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_MilitaryRank PRIMARY KEY CLUSTERED (RankId),
    CONSTRAINT UQ_MilitaryRank_Code UNIQUE (RankCode),
    CONSTRAINT CK_MilitaryRank_Group CHECK (RankGroup IN ('OFFICER','NCO','ENLISTED','VOLUNTEER','CIVILIAN'))
);
GO

CREATE INDEX IX_MilitaryRank_Group ON ref.MilitaryRank (RankGroup, RankOrder);
GO

-- -----------------------------------------------------------------------------
-- ref.Corps : ทะเบียนเหล่า (ร., ม., ป., ช., ส., สพ., พธ., ขส., พ.)
-- -----------------------------------------------------------------------------
CREATE TABLE ref.Corps (
    CorpsId         BIGINT          IDENTITY(1,1) NOT NULL,
    CorpsCode       VARCHAR(20)     NOT NULL,
    CorpsNameTh     NVARCHAR(100)   NOT NULL,
    CorpsNameEn     NVARCHAR(100)   NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Corps PRIMARY KEY CLUSTERED (CorpsId),
    CONSTRAINT UQ_Corps_Code UNIQUE (CorpsCode)
);
GO

-- -----------------------------------------------------------------------------
-- ref.PersonnelType : ประเภทกำลังพล
-- -----------------------------------------------------------------------------
CREATE TABLE ref.PersonnelType (
    PersonnelTypeId BIGINT          IDENTITY(1,1) NOT NULL,
    TypeCode        VARCHAR(20)     NOT NULL,
    TypeNameTh      NVARCHAR(100)   NOT NULL,
    TypeNameEn      NVARCHAR(100)   NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PersonnelType PRIMARY KEY CLUSTERED (PersonnelTypeId),
    CONSTRAINT UQ_PersonnelType_Code UNIQUE (TypeCode),
    CONSTRAINT CK_PersonnelType_Code CHECK (TypeCode IN (
        'COMMISSIONED','NON_COMMISSIONED','CONSCRIPT','VOLUNTEER','GOVERNMENT_EMP','CONTRACT','CIVILIAN'
    ))
);
GO

-- -----------------------------------------------------------------------------
-- ref.Unit : ผังหน่วยงานแบบลำดับชั้น (Tree)
-- -----------------------------------------------------------------------------
CREATE TABLE ref.Unit (
    UnitId          BIGINT          IDENTITY(1,1) NOT NULL,
    UnitCode        VARCHAR(20)     NOT NULL,
    UnitNameTh      NVARCHAR(200)   NOT NULL,
    UnitNameEn      NVARCHAR(200)   NULL,
    ParentUnitId    BIGINT          NULL,
    UnitLevel       INT             NOT NULL,        -- 1=กองทัพบก, 2=กองทัพภาค, 3=กรม, 4=กองพัน, ...
    BranchId        BIGINT          NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Unit PRIMARY KEY CLUSTERED (UnitId),
    CONSTRAINT UQ_Unit_Code UNIQUE (UnitCode),
    CONSTRAINT FK_Unit_Parent FOREIGN KEY (ParentUnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT FK_Unit_Branch FOREIGN KEY (BranchId) REFERENCES ref.MilitaryBranch (BranchId),
    CONSTRAINT CK_Unit_Level CHECK (UnitLevel >= 1)
);
GO

CREATE INDEX IX_Unit_Parent ON ref.Unit (ParentUnitId);
CREATE INDEX IX_Unit_Level ON ref.Unit (UnitLevel, IsActive);
GO

-- -----------------------------------------------------------------------------
-- ref.Position : ทะเบียนอัตราตำแหน่ง (อฉก./อจย.)
-- -----------------------------------------------------------------------------
CREATE TABLE ref.Position (
    PositionId      BIGINT          IDENTITY(1,1) NOT NULL,
    PositionCode    VARCHAR(20)     NOT NULL,
    PositionNameTh  NVARCHAR(200)   NOT NULL,
    PositionNameEn  NVARCHAR(200)   NULL,
    PositionCategory NVARCHAR(100)  NOT NULL,        -- COMMAND / STAFF / TECHNICAL / FIELD
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Position PRIMARY KEY CLUSTERED (PositionId),
    CONSTRAINT UQ_Position_Code UNIQUE (PositionCode)
);
GO

-- -----------------------------------------------------------------------------
-- ref.DisabilityType : ทะเบียนประเภทความพิการทุพพลภาพ (DIS-01..DIS-99)
-- -----------------------------------------------------------------------------
CREATE TABLE ref.DisabilityType (
    DisabilityTypeId        BIGINT          IDENTITY(1,1) NOT NULL,
    TypeCode                VARCHAR(10)     NOT NULL,
    TypeNameTh              NVARCHAR(200)   NOT NULL,
    TypeNameEn              NVARCHAR(200)   NULL,
    SeverityLevel           NVARCHAR(50)    NOT NULL,    -- CRITICAL / SEVERE / MODERATE / MILD
    SuggestedPromotionStepsMin INT          NOT NULL DEFAULT 1,
    SuggestedPromotionStepsMax INT          NOT NULL DEFAULT 8,
    Description             NVARCHAR(MAX)   NULL,
    IsActive                BIT             NOT NULL DEFAULT 1,
    CreatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DisabilityType PRIMARY KEY CLUSTERED (DisabilityTypeId),
    CONSTRAINT UQ_DisabilityType_Code UNIQUE (TypeCode),
    CONSTRAINT CK_DisabilityType_Severity CHECK (SeverityLevel IN ('CRITICAL','SEVERE','MODERATE','MILD')),
    CONSTRAINT CK_DisabilityType_Steps CHECK (SuggestedPromotionStepsMin <= SuggestedPromotionStepsMax)
);
GO

-- -----------------------------------------------------------------------------
-- ref.EmergencyDeclaration : ทะเบียนประกาศเหตุฉุกเฉิน / กฎอัยการศึก / ภารกิจสู้รบ
-- -----------------------------------------------------------------------------
CREATE TABLE ref.EmergencyDeclaration (
    DeclarationId   BIGINT          IDENTITY(1,1) NOT NULL,
    DeclarationNo   NVARCHAR(100)   NOT NULL,
    DeclarationName NVARCHAR(500)   NOT NULL,
    AreaCoverage    NVARCHAR(500)   NOT NULL,
    StartDate       DATE            NOT NULL,
    EndDate         DATE            NULL,
    LegalReference  NVARCHAR(500)   NOT NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_EmergencyDeclaration PRIMARY KEY CLUSTERED (DeclarationId),
    CONSTRAINT UQ_EmergencyDeclaration_No UNIQUE (DeclarationNo),
    CONSTRAINT CK_EmergencyDeclaration_Date CHECK (EndDate IS NULL OR EndDate >= StartDate)
);
GO

CREATE INDEX IX_EmergencyDeclaration_Date ON ref.EmergencyDeclaration (StartDate, EndDate);
GO

-- -----------------------------------------------------------------------------
-- ref.BenefitCategoryRef : ทะเบียนหมวดสวัสดิการ
-- -----------------------------------------------------------------------------
CREATE TABLE ref.BenefitCategoryRef (
    CategoryId      BIGINT          IDENTITY(1,1) NOT NULL,
    CategoryCode    VARCHAR(50)     NOT NULL,
    CategoryNameTh  NVARCHAR(200)   NOT NULL,
    CategoryNameEn  NVARCHAR(200)   NULL,
    CategoryType    NVARCHAR(50)    NOT NULL,        -- MEDICAL / EDUCATION / HOUSING / ALLOWANCE / PENSION / LUMP_SUM
    Description     NVARCHAR(MAX)   NULL,
    LegalReference  NVARCHAR(500)   NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_BenefitCategoryRef PRIMARY KEY CLUSTERED (CategoryId),
    CONSTRAINT UQ_BenefitCategoryRef_Code UNIQUE (CategoryCode),
    CONSTRAINT CK_BenefitCategoryRef_Type CHECK (CategoryType IN (
        'MEDICAL','EDUCATION','HOUSING','ALLOWANCE','PENSION','LUMP_SUM','SCHOLARSHIP','COMPENSATION'
    ))
);
GO

-- -----------------------------------------------------------------------------
-- ref.RelationshipType : ความสัมพันธ์ของทายาท / ผู้มีสิทธิร่วม
-- -----------------------------------------------------------------------------
CREATE TABLE ref.RelationshipType (
    RelationshipTypeId  BIGINT          IDENTITY(1,1) NOT NULL,
    TypeCode              VARCHAR(50)     NOT NULL,
    TypeNameTh            NVARCHAR(100)   NOT NULL,
    IsActive              BIT             NOT NULL DEFAULT 1,
    CreatedAt             DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_RelationshipType PRIMARY KEY CLUSTERED (RelationshipTypeId),
    CONSTRAINT UQ_RelationshipType_Code UNIQUE (TypeCode)
);
GO

-- -----------------------------------------------------------------------------
-- ref.Province / District / Subdistrict : ทะเบียนที่อยู่
-- -----------------------------------------------------------------------------
CREATE TABLE ref.Province (
    ProvinceId      BIGINT          IDENTITY(1,1) NOT NULL,
    ProvinceCode    VARCHAR(10)     NOT NULL,
    ProvinceNameTh  NVARCHAR(100)   NOT NULL,
    ProvinceNameEn  NVARCHAR(100)   NULL,
    CONSTRAINT PK_Province PRIMARY KEY CLUSTERED (ProvinceId),
    CONSTRAINT UQ_Province_Code UNIQUE (ProvinceCode)
);
GO

CREATE TABLE ref.District (
    DistrictId      BIGINT          IDENTITY(1,1) NOT NULL,
    ProvinceId      BIGINT          NOT NULL,
    DistrictCode    VARCHAR(10)     NOT NULL,
    DistrictNameTh  NVARCHAR(100)   NOT NULL,
    CONSTRAINT PK_District PRIMARY KEY CLUSTERED (DistrictId),
    CONSTRAINT UQ_District_Code UNIQUE (DistrictCode),
    CONSTRAINT FK_District_Province FOREIGN KEY (ProvinceId) REFERENCES ref.Province (ProvinceId)
);
GO

CREATE INDEX IX_District_Province ON ref.District (ProvinceId);
GO

CREATE TABLE ref.Subdistrict (
    SubdistrictId       BIGINT          IDENTITY(1,1) NOT NULL,
    DistrictId          BIGINT          NOT NULL,
    SubdistrictCode   VARCHAR(10)     NOT NULL,
    SubdistrictNameTh NVARCHAR(100)   NOT NULL,
    PostalCode        VARCHAR(10)     NULL,
    CONSTRAINT PK_Subdistrict PRIMARY KEY CLUSTERED (SubdistrictId),
    CONSTRAINT UQ_Subdistrict_Code UNIQUE (SubdistrictCode),
    CONSTRAINT FK_Subdistrict_District FOREIGN KEY (DistrictId) REFERENCES ref.District (DistrictId)
);
GO

CREATE INDEX IX_Subdistrict_District ON ref.Subdistrict (DistrictId);
GO

-- ==============================================================================
-- 2. Core / Main Tables
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- core.[User] : บัญชีผู้ใช้งานระบบ (RBAC)
-- -----------------------------------------------------------------------------
CREATE TABLE core.[User] (
    UserId          BIGINT          IDENTITY(1,1) NOT NULL,
    Username        NVARCHAR(100)   NOT NULL,
    Email           NVARCHAR(255)   NOT NULL,
    PasswordHash    NVARCHAR(500)   NOT NULL,
    RoleCode        NVARCHAR(50)    NOT NULL,        -- SUPERADMIN / ADMIN / HQ_OFFICER / UNIT_OFFICER / MEDICAL_BOARD / FINANCE_OFFICER / AUDITOR / BENEFICIARY
    TitleTh         NVARCHAR(50)    NULL,
    FirstNameTh     NVARCHAR(100)   NOT NULL,
    LastNameTh      NVARCHAR(100)   NOT NULL,
    Phone           NVARCHAR(20)    NULL,
    UnitId          BIGINT          NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    LastLoginAt     DATETIME2(0)   NULL,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_User PRIMARY KEY CLUSTERED (UserId),
    CONSTRAINT UQ_User_Username UNIQUE (Username),
    CONSTRAINT UQ_User_Email UNIQUE (Email),
    CONSTRAINT FK_User_Unit FOREIGN KEY (UnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT CK_User_Role CHECK (RoleCode IN (
        'SUPERADMIN','ADMIN','HQ_OFFICER','UNIT_OFFICER','MEDICAL_BOARD','FINANCE_OFFICER','AUDITOR','BENEFICIARY'
    ))
);
GO

CREATE INDEX IX_User_Role ON core.[User] (RoleCode, IsActive);
CREATE INDEX IX_User_Unit ON core.[User] (UnitId);
GO

-- -----------------------------------------------------------------------------
-- core.RolePermission : สิทธิ์รายบทบาท (RBAC Matrix)
-- -----------------------------------------------------------------------------
CREATE TABLE core.RolePermission (
    RolePermissionId    BIGINT          IDENTITY(1,1) NOT NULL,
    RoleCode            NVARCHAR(50)    NOT NULL,
    ResourceType        NVARCHAR(100)   NOT NULL,    -- PERSONNEL / INCIDENT / CLAIM / RULE / PAYMENT / BUDGET / AUDIT
    PermissionCode      NVARCHAR(100)   NOT NULL,    -- CREATE / READ / UPDATE / DELETE / APPROVE / EXPORT
    CanCreate           BIT             NOT NULL DEFAULT 0,
    CanRead             BIT             NOT NULL DEFAULT 0,
    CanUpdate           BIT             NOT NULL DEFAULT 0,
    CanDelete           BIT             NOT NULL DEFAULT 0,
    CanApprove          BIT             NOT NULL DEFAULT 0,
    CanExport           BIT             NOT NULL DEFAULT 0,
    DataScope           NVARCHAR(50)    NOT NULL DEFAULT 'OWN', -- OWN / UNIT / SUBTREE / ALL
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_RolePermission PRIMARY KEY CLUSTERED (RolePermissionId),
    CONSTRAINT UQ_RolePermission UNIQUE (RoleCode, ResourceType, PermissionCode),
    CONSTRAINT CK_RolePermission_Scope CHECK (DataScope IN ('OWN','UNIT','SUBTREE','ALL','NONE'))
);
GO

CREATE INDEX IX_RolePermission_Role ON core.RolePermission (RoleCode);
GO

-- -----------------------------------------------------------------------------
-- core.Citizen : ทะเบียนข้อมูลบุคคลทั่วไป (กำลังพล / ครอบครัว / ทายาท)
-- -----------------------------------------------------------------------------
CREATE TABLE core.Citizen (
    CitizenId       BIGINT          IDENTITY(1,1) NOT NULL,
    NationalId      VARCHAR(13)     NOT NULL,       -- 13 หลัก (เข้ารหัสที่ Application)
    TitleTh         NVARCHAR(50)    NOT NULL,
    FirstNameTh     NVARCHAR(100)   NOT NULL,
    LastNameTh      NVARCHAR(100)   NOT NULL,
    TitleEn         NVARCHAR(50)    NULL,
    FirstNameEn     NVARCHAR(100)   NULL,
    LastNameEn      NVARCHAR(100)   NULL,
    BirthDate       DATE            NULL,
    Gender          NVARCHAR(10)    NULL,
    Phone           NVARCHAR(20)    NULL,
    Email           NVARCHAR(255)   NULL,
    AddressLine     NVARCHAR(500)   NULL,
    SubdistrictId   BIGINT          NULL,
    DistrictId      BIGINT          NULL,
    ProvinceId      BIGINT          NULL,
    PostalCode      VARCHAR(10)     NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Citizen PRIMARY KEY CLUSTERED (CitizenId),
    CONSTRAINT UQ_Citizen_NationalId UNIQUE (NationalId),
    CONSTRAINT FK_Citizen_Subdistrict FOREIGN KEY (SubdistrictId) REFERENCES ref.Subdistrict (SubdistrictId),
    CONSTRAINT FK_Citizen_District FOREIGN KEY (DistrictId) REFERENCES ref.District (DistrictId),
    CONSTRAINT FK_Citizen_Province FOREIGN KEY (ProvinceId) REFERENCES ref.Province (ProvinceId),
    CONSTRAINT CK_Citizen_Gender CHECK (Gender IS NULL OR Gender IN ('MALE','FEMALE','OTHER'))
);
GO

CREATE INDEX IX_Citizen_Name ON core.Citizen (FirstNameTh, LastNameTh);
CREATE INDEX IX_Citizen_Province ON core.Citizen (ProvinceId);
GO

-- -----------------------------------------------------------------------------
-- core.MilitaryPersonnel : ทะเบียนกำลังพลรายบุคคล
-- -----------------------------------------------------------------------------
CREATE TABLE core.MilitaryPersonnel (
    PersonnelId         BIGINT          IDENTITY(1,1) NOT NULL,
    MilitaryId          VARCHAR(10)     NOT NULL,       -- เลขประจำตัวกำลังพล 10 หลัก
    CitizenId           BIGINT          NOT NULL,       -- อ้างอิงทะเบียนบุคคล
    CurrentRankId       BIGINT          NOT NULL,
    CurrentCorpsId      BIGINT          NULL,
    CurrentUnitId       BIGINT          NOT NULL,
    CurrentPositionId   BIGINT          NOT NULL,
    PersonnelTypeId     BIGINT          NOT NULL,
    AppointmentDate     DATE            NOT NULL,       -- วันที่บรรจุ
    ServiceStatus       NVARCHAR(50)    NOT NULL DEFAULT 'ACTIVE', -- ACTIVE / DISCHARGED_DISABILITY / DECEASED / RETIRED
    BankName            NVARCHAR(100)   NULL,           -- ข้อมูลลับ
    BankAccountNumber   NVARCHAR(50)    NULL,           -- ข้อมูลลับ (เข้ารหัสที่ Application)
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CreatedByUserId     BIGINT          NULL,
    UpdatedByUserId     BIGINT          NULL,
    CONSTRAINT PK_MilitaryPersonnel PRIMARY KEY CLUSTERED (PersonnelId),
    CONSTRAINT UQ_MilitaryPersonnel_MilitaryId UNIQUE (MilitaryId),
    CONSTRAINT UQ_MilitaryPersonnel_CitizenId UNIQUE (CitizenId),
    CONSTRAINT FK_MilitaryPersonnel_Citizen FOREIGN KEY (CitizenId) REFERENCES core.Citizen (CitizenId),
    CONSTRAINT FK_MilitaryPersonnel_Rank FOREIGN KEY (CurrentRankId) REFERENCES ref.MilitaryRank (RankId),
    CONSTRAINT FK_MilitaryPersonnel_Corps FOREIGN KEY (CurrentCorpsId) REFERENCES ref.Corps (CorpsId),
    CONSTRAINT FK_MilitaryPersonnel_Unit FOREIGN KEY (CurrentUnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT FK_MilitaryPersonnel_Position FOREIGN KEY (CurrentPositionId) REFERENCES ref.Position (PositionId),
    CONSTRAINT FK_MilitaryPersonnel_Type FOREIGN KEY (PersonnelTypeId) REFERENCES ref.PersonnelType (PersonnelTypeId),
    CONSTRAINT FK_MilitaryPersonnel_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT FK_MilitaryPersonnel_UpdatedBy FOREIGN KEY (UpdatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_MilitaryPersonnel_MilitaryId CHECK (MilitaryId LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'),
    CONSTRAINT CK_MilitaryPersonnel_Status CHECK (ServiceStatus IN ('ACTIVE','DISCHARGED_DISABILITY','DECEASED','RETIRED','SUSPENDED'))
);
GO

CREATE INDEX IX_MilitaryPersonnel_Unit ON core.MilitaryPersonnel (CurrentUnitId);
CREATE INDEX IX_MilitaryPersonnel_Rank ON core.MilitaryPersonnel (CurrentRankId);
CREATE INDEX IX_MilitaryPersonnel_Type ON core.MilitaryPersonnel (PersonnelTypeId, ServiceStatus);
CREATE INDEX IX_MilitaryPersonnel_Appointment ON core.MilitaryPersonnel (AppointmentDate);
GO

-- -----------------------------------------------------------------------------
-- core.Spouse : ทะเบียนคู่สมรส
-- -----------------------------------------------------------------------------
CREATE TABLE core.Spouse (
    SpouseId                BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId             BIGINT          NOT NULL,
    CitizenId               BIGINT          NOT NULL,
    MarriageCertNumber      NVARCHAR(100)   NULL,
    IsLegallyMarried        BIT             NOT NULL DEFAULT 1,
    HasPensionRights        BIT             NOT NULL DEFAULT 1,
    AllocationPercentage    DECIMAL(5,2)    NOT NULL DEFAULT 50.00,
    BankName                NVARCHAR(100)   NULL,
    BankAccountNumber       NVARCHAR(50)    NULL,
    IsActive                BIT             NOT NULL DEFAULT 1,
    CreatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Spouse PRIMARY KEY CLUSTERED (SpouseId),
    CONSTRAINT UQ_Spouse_PersonnelId UNIQUE (PersonnelId),
    CONSTRAINT FK_Spouse_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_Spouse_Citizen FOREIGN KEY (CitizenId) REFERENCES core.Citizen (CitizenId),
    CONSTRAINT CK_Spouse_Allocation CHECK (AllocationPercentage >= 0 AND AllocationPercentage <= 100)
);
GO

CREATE INDEX IX_Spouse_Citizen ON core.Spouse (CitizenId);
GO

-- -----------------------------------------------------------------------------
-- core.Child : ทะเบียนบุตร
-- -----------------------------------------------------------------------------
CREATE TABLE core.Child (
    ChildId                 BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId             BIGINT          NOT NULL,
    CitizenId               BIGINT          NOT NULL,
    IsStudying              BIT             NOT NULL DEFAULT 1,
    EducationLevel          NVARCHAR(100)   NULL,
    ScholarshipEligible     BIT             NOT NULL DEFAULT 1,
    HasSuccessorRight       BIT             NOT NULL DEFAULT 0,
    AllocationPercentage    DECIMAL(5,2)    NOT NULL DEFAULT 25.00,
    IsActive                BIT             NOT NULL DEFAULT 1,
    CreatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Child PRIMARY KEY CLUSTERED (ChildId),
    CONSTRAINT FK_Child_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_Child_Citizen FOREIGN KEY (CitizenId) REFERENCES core.Citizen (CitizenId),
    CONSTRAINT CK_Child_Allocation CHECK (AllocationPercentage >= 0 AND AllocationPercentage <= 100)
);
GO

CREATE INDEX IX_Child_Personnel ON core.Child (PersonnelId);
CREATE INDEX IX_Child_Citizen ON core.Child (CitizenId);
GO

-- -----------------------------------------------------------------------------
-- core.Heir : ทะเบียนทายาท / ผู้มีสิทธิรับสิทธิแทน
-- -----------------------------------------------------------------------------
CREATE TABLE core.Heir (
    HeirId                  BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId             BIGINT          NOT NULL,
    CitizenId               BIGINT          NOT NULL,
    RelationshipTypeId      BIGINT          NOT NULL,
    Phone                   NVARCHAR(20)    NULL,
    AddressLine             NVARCHAR(500)   NULL,
    BankName                NVARCHAR(100)   NULL,
    BankAccountNumber       NVARCHAR(50)    NULL,
    AllocationPercentage    DECIMAL(5,2)    NOT NULL DEFAULT 0.00,
    IsDesignatedSuccessor   BIT             NOT NULL DEFAULT 0,
    DocumentsVerified       BIT             NOT NULL DEFAULT 0,
    IsActive                BIT             NOT NULL DEFAULT 1,
    CreatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_Heir PRIMARY KEY CLUSTERED (HeirId),
    CONSTRAINT FK_Heir_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_Heir_Citizen FOREIGN KEY (CitizenId) REFERENCES core.Citizen (CitizenId),
    CONSTRAINT FK_Heir_Relationship FOREIGN KEY (RelationshipTypeId) REFERENCES ref.RelationshipType (RelationshipTypeId),
    CONSTRAINT CK_Heir_Allocation CHECK (AllocationPercentage >= 0 AND AllocationPercentage <= 100)
);
GO

CREATE INDEX IX_Heir_Personnel ON core.Heir (PersonnelId);
CREATE INDEX IX_Heir_Citizen ON core.Heir (CitizenId);
GO

-- -----------------------------------------------------------------------------
-- core.IncidentRecord : เหตุการณ์สูญเสีย / บาดเจ็บ
-- -----------------------------------------------------------------------------
CREATE TABLE core.IncidentRecord (
    IncidentId          BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId         BIGINT          NOT NULL,
    IncidentDate        DATETIME2(0)    NOT NULL,
    IncidentLocation    NVARCHAR(500)   NULL,
    MissionType         NVARCHAR(100)   NOT NULL,
    IncidentType        NVARCHAR(100)   NOT NULL,
    LossType            NVARCHAR(50)    NOT NULL,        -- DEATH / TOTAL_PERMANENT_DISABILITY / PARTIAL_DISABILITY / SEVERE_WOUND / ...
    PeriodClass         NVARCHAR(20)    NOT NULL,        -- EMERGENCY / NORMAL
    DeclarationId       BIGINT          NULL,
    IncidentDescription NVARCHAR(MAX)   NULL,
    ReportedByUserId    BIGINT          NOT NULL,
    ReportedAt          DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_IncidentRecord PRIMARY KEY CLUSTERED (IncidentId),
    CONSTRAINT FK_IncidentRecord_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_IncidentRecord_Declaration FOREIGN KEY (DeclarationId) REFERENCES ref.EmergencyDeclaration (DeclarationId),
    CONSTRAINT FK_IncidentRecord_ReportedBy FOREIGN KEY (ReportedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_IncidentRecord_PeriodClass CHECK (PeriodClass IN ('EMERGENCY','NORMAL')),
    CONSTRAINT CK_IncidentRecord_LossType CHECK (LossType IN (
        'KIA_COMBAT_DEATH','DUTY_DEATH','TOTAL_PERMANENT_DISABILITY','PARTIAL_DISABILITY',
        'SEVERE_WOUND_WIA','MODERATE_INJURY','MINOR_INJURY'
    ))
);
GO

CREATE INDEX IX_IncidentRecord_Personnel ON core.IncidentRecord (PersonnelId);
CREATE INDEX IX_IncidentRecord_Date ON core.IncidentRecord (IncidentDate);
CREATE INDEX IX_IncidentRecord_Period ON core.IncidentRecord (PeriodClass, LossType);
GO

-- -----------------------------------------------------------------------------
-- core.DisabilityAssessment : ผลรับรองความพิการจากคณะกรรมการแพทย์
-- -----------------------------------------------------------------------------
CREATE TABLE core.DisabilityAssessment (
    AssessmentId        BIGINT          IDENTITY(1,1) NOT NULL,
    IncidentId          BIGINT          NOT NULL,
    DisabilityTypeId    BIGINT          NOT NULL,
    MedicalBoardRef     NVARCHAR(100)   NOT NULL,
    AssessedDate        DATE            NOT NULL,
    AssessmentResult    NVARCHAR(MAX)   NULL,
    IsPermanentTotal    BIT             NOT NULL DEFAULT 0,
    AssessedByUserId    BIGINT          NOT NULL,
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_DisabilityAssessment PRIMARY KEY CLUSTERED (AssessmentId),
    CONSTRAINT UQ_DisabilityAssessment_Incident UNIQUE (IncidentId),
    CONSTRAINT FK_DisabilityAssessment_Incident FOREIGN KEY (IncidentId) REFERENCES core.IncidentRecord (IncidentId),
    CONSTRAINT FK_DisabilityAssessment_Type FOREIGN KEY (DisabilityTypeId) REFERENCES ref.DisabilityType (DisabilityTypeId),
    CONSTRAINT FK_DisabilityAssessment_AssessedBy FOREIGN KEY (AssessedByUserId) REFERENCES core.[User] (UserId)
);
GO

CREATE INDEX IX_DisabilityAssessment_Type ON core.DisabilityAssessment (DisabilityTypeId);
GO

-- -----------------------------------------------------------------------------
-- core.SpecialPromotionCase : สำนวนพิจารณาปูนบำเหน็จพิเศษ
-- -----------------------------------------------------------------------------
CREATE TABLE core.SpecialPromotionCase (
    CaseId              BIGINT          IDENTITY(1,1) NOT NULL,
    CaseNumber          NVARCHAR(100)   NOT NULL,
    IncidentId          BIGINT          NOT NULL,
    PeriodClass         NVARCHAR(20)    NOT NULL,
    ProposedSteps       INT             NOT NULL,
    ApprovedSteps       INT             NULL,
    Status              NVARCHAR(50)    NOT NULL DEFAULT 'DRAFT', -- DRAFT / UNIT_REVIEW / HQ_REVIEW / APPROVED / REJECTED
    RuleVersionId       BIGINT          NULL,
    SubmittedByUserId   BIGINT          NULL,
    SubmittedAt         DATETIME2(0)   NULL,
    ReviewedByUserId    BIGINT          NULL,
    ReviewedAt          DATETIME2(0)   NULL,
    ApprovedByUserId    BIGINT          NULL,
    ApprovedAt          DATETIME2(0)   NULL,
    RejectionReason     NVARCHAR(MAX)   NULL,
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_SpecialPromotionCase PRIMARY KEY CLUSTERED (CaseId),
    CONSTRAINT UQ_SpecialPromotionCase_Number UNIQUE (CaseNumber),
    CONSTRAINT FK_SpecialPromotionCase_Incident FOREIGN KEY (IncidentId) REFERENCES core.IncidentRecord (IncidentId),
    CONSTRAINT FK_SpecialPromotionCase_RuleVersion FOREIGN KEY (RuleVersionId) REFERENCES ent.RuleVersion (RuleVersionId),
    CONSTRAINT FK_SpecialPromotionCase_SubmittedBy FOREIGN KEY (SubmittedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT FK_SpecialPromotionCase_ReviewedBy FOREIGN KEY (ReviewedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT FK_SpecialPromotionCase_ApprovedBy FOREIGN KEY (ApprovedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_SpecialPromotionCase_PeriodClass CHECK (PeriodClass IN ('EMERGENCY','NORMAL')),
    CONSTRAINT CK_SpecialPromotionCase_Steps CHECK (ProposedSteps > 0 AND ProposedSteps <= 8),
    CONSTRAINT CK_SpecialPromotionCase_Status CHECK (Status IN ('DRAFT','UNIT_REVIEW','HQ_REVIEW','APPROVED','REJECTED'))
);
GO

CREATE INDEX IX_SpecialPromotionCase_Incident ON core.SpecialPromotionCase (IncidentId);
CREATE INDEX IX_SpecialPromotionCase_Status ON core.SpecialPromotionCase (Status, PeriodClass);
GO

-- -----------------------------------------------------------------------------
-- core.PromotionOrder : คำสั่งปูนบำเหน็จพิเศษ / เลื่อนยศ
-- -----------------------------------------------------------------------------
CREATE TABLE core.PromotionOrder (
    OrderId             BIGINT          IDENTITY(1,1) NOT NULL,
    OrderNumber         NVARCHAR(100)   NOT NULL,
    CaseId              BIGINT          NULL,           -- อาจเป็น NULL สำหรับการเลื่อนยศปกติ
    PersonnelId         BIGINT          NOT NULL,
    OrderType           NVARCHAR(50)    NOT NULL,        -- SPECIAL_PROMOTION / REGULAR_PROMOTION
    GrantedSteps        INT             NOT NULL,
    NewRankId           BIGINT          NOT NULL,
    NewSalary           DECIMAL(15,2)   NULL,
    EffectiveDate       DATE            NOT NULL,
    OrderDocumentUrl    NVARCHAR(500)   NULL,
    IssuedByUserId      BIGINT          NOT NULL,
    IssuedAt            DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PromotionOrder PRIMARY KEY CLUSTERED (OrderId),
    CONSTRAINT UQ_PromotionOrder_Number UNIQUE (OrderNumber),
    CONSTRAINT FK_PromotionOrder_Case FOREIGN KEY (CaseId) REFERENCES core.SpecialPromotionCase (CaseId),
    CONSTRAINT FK_PromotionOrder_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_PromotionOrder_Rank FOREIGN KEY (NewRankId) REFERENCES ref.MilitaryRank (RankId),
    CONSTRAINT FK_PromotionOrder_IssuedBy FOREIGN KEY (IssuedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_PromotionOrder_Type CHECK (OrderType IN ('SPECIAL_PROMOTION','REGULAR_PROMOTION')),
    CONSTRAINT CK_PromotionOrder_Steps CHECK (GrantedSteps > 0 AND GrantedSteps <= 8)
);
GO

CREATE INDEX IX_PromotionOrder_Personnel ON core.PromotionOrder (PersonnelId);
CREATE INDEX IX_PromotionOrder_Effective ON core.PromotionOrder (EffectiveDate);
GO

-- ==============================================================================
-- 3. History / Temporal Tables
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- hist.RankHistory : ประวัติยศ (Temporal)
-- -----------------------------------------------------------------------------
CREATE TABLE hist.RankHistory (
    RankHistoryId   BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId     BIGINT          NOT NULL,
    RankId          BIGINT          NOT NULL,
    PromotionType   NVARCHAR(50)    NOT NULL,        -- REGULAR / SPECIAL
    OrderReference  NVARCHAR(100)   NULL,
    EffectiveFrom   DATE            NOT NULL,
    EffectiveTo     DATE            NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_RankHistory PRIMARY KEY CLUSTERED (RankHistoryId),
    CONSTRAINT FK_RankHistory_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_RankHistory_Rank FOREIGN KEY (RankId) REFERENCES ref.MilitaryRank (RankId),
    CONSTRAINT CK_RankHistory_Type CHECK (PromotionType IN ('REGULAR','SPECIAL')),
    CONSTRAINT CK_RankHistory_Date CHECK (EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom)
);
GO

CREATE INDEX IX_RankHistory_Personnel ON hist.RankHistory (PersonnelId, EffectiveFrom, EffectiveTo);
CREATE INDEX IX_RankHistory_Rank ON hist.RankHistory (RankId);
GO

-- ป้องกันช่วงเวลาซ้อนทับของยศเดียวกัน
CREATE TRIGGER trg_RankHistory_NoOverlap
ON hist.RankHistory
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM hist.RankHistory r1
        INNER JOIN inserted i ON r1.PersonnelId = i.PersonnelId
        WHERE r1.RankHistoryId <> i.RankHistoryId
          AND r1.IsActive = 1 AND i.IsActive = 1
          AND r1.EffectiveFrom < ISNULL(i.EffectiveTo, '9999-12-31')
          AND ISNULL(r1.EffectiveTo, '9999-12-31') > i.EffectiveFrom
    )
    BEGIN
        RAISERROR ('Rank history periods cannot overlap for the same personnel.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- -----------------------------------------------------------------------------
-- hist.UnitAssignment : ประวัติสังกัดและตำแหน่ง (Temporal)
-- -----------------------------------------------------------------------------
CREATE TABLE hist.UnitAssignment (
    AssignmentId    BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId     BIGINT          NOT NULL,
    UnitId          BIGINT          NOT NULL,
    PositionId      BIGINT          NOT NULL,
    OrderReference  NVARCHAR(100)   NULL,
    EffectiveFrom   DATE            NOT NULL,
    EffectiveTo     DATE            NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_UnitAssignment PRIMARY KEY CLUSTERED (AssignmentId),
    CONSTRAINT FK_UnitAssignment_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_UnitAssignment_Unit FOREIGN KEY (UnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT FK_UnitAssignment_Position FOREIGN KEY (PositionId) REFERENCES ref.Position (PositionId),
    CONSTRAINT CK_UnitAssignment_Date CHECK (EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom)
);
GO

CREATE INDEX IX_UnitAssignment_Personnel ON hist.UnitAssignment (PersonnelId, EffectiveFrom, EffectiveTo);
CREATE INDEX IX_UnitAssignment_Unit ON hist.UnitAssignment (UnitId);
GO

CREATE TRIGGER trg_UnitAssignment_NoOverlap
ON hist.UnitAssignment
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM hist.UnitAssignment u1
        INNER JOIN inserted i ON u1.PersonnelId = i.PersonnelId
        WHERE u1.AssignmentId <> i.AssignmentId
          AND u1.IsActive = 1 AND i.IsActive = 1
          AND u1.EffectiveFrom < ISNULL(i.EffectiveTo, '9999-12-31')
          AND ISNULL(u1.EffectiveTo, '9999-12-31') > i.EffectiveFrom
    )
    BEGIN
        RAISERROR ('Unit assignment periods cannot overlap for the same personnel.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- -----------------------------------------------------------------------------
-- hist.SalaryHistory : ประวัติเงินเดือน / ระดับ / ขั้น (Temporal)
-- -----------------------------------------------------------------------------
CREATE TABLE hist.SalaryHistory (
    SalaryHistoryId BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId     BIGINT          NOT NULL,
    SalaryLevel     NVARCHAR(20)    NOT NULL,
    SalaryStep      INT             NOT NULL,
    SalaryAmount    DECIMAL(15,2)   NOT NULL,
    OrderReference  NVARCHAR(100)   NULL,
    EffectiveFrom   DATE            NOT NULL,
    EffectiveTo     DATE            NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_SalaryHistory PRIMARY KEY CLUSTERED (SalaryHistoryId),
    CONSTRAINT FK_SalaryHistory_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT CK_SalaryHistory_Amount CHECK (SalaryAmount > 0),
    CONSTRAINT CK_SalaryHistory_Date CHECK (EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom)
);
GO

CREATE INDEX IX_SalaryHistory_Personnel ON hist.SalaryHistory (PersonnelId, EffectiveFrom, EffectiveTo);
GO

CREATE TRIGGER trg_SalaryHistory_NoOverlap
ON hist.SalaryHistory
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1
        FROM hist.SalaryHistory s1
        INNER JOIN inserted i ON s1.PersonnelId = i.PersonnelId
        WHERE s1.SalaryHistoryId <> i.SalaryHistoryId
          AND s1.IsActive = 1 AND i.IsActive = 1
          AND s1.EffectiveFrom < ISNULL(i.EffectiveTo, '9999-12-31')
          AND ISNULL(s1.EffectiveTo, '9999-12-31') > i.EffectiveFrom
    )
    BEGIN
        RAISERROR ('Salary history periods cannot overlap for the same personnel.', 16, 1);
        ROLLBACK TRANSACTION;
    END
END;
GO

-- ==============================================================================
-- 4. Entitlement / Rights Tables
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- ent.BenefitProgram : โครงการสวัสดิการ / สิทธิ
-- -----------------------------------------------------------------------------
CREATE TABLE ent.BenefitProgram (
    ProgramId           BIGINT          IDENTITY(1,1) NOT NULL,
    CategoryId          BIGINT          NOT NULL,
    ProgramCode         VARCHAR(50)     NOT NULL,
    ProgramNameTh       NVARCHAR(200)   NOT NULL,
    ProgramNameEn       NVARCHAR(200)   NULL,
    TargetGroup         NVARCHAR(200)   NULL,
    Description         NVARCHAR(MAX)   NULL,
    PaymentFrequency    NVARCHAR(50)    NOT NULL,        -- MONTHLY / ANNUAL / ONE_TIME / AS_NEEDED
    BaseAmount          DECIMAL(15,2)   NOT NULL DEFAULT 0,
    MaxAmount           DECIMAL(15,2)   NOT NULL DEFAULT 0,
    TotalBudgetYear     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    AllocatedBudget     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    BudgetDisbursed     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    FundingSource       NVARCHAR(200)   NULL,
    LegalBasis          NVARCHAR(MAX)   NULL,
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_BenefitProgram PRIMARY KEY CLUSTERED (ProgramId),
    CONSTRAINT UQ_BenefitProgram_Code UNIQUE (ProgramCode),
    CONSTRAINT FK_BenefitProgram_Category FOREIGN KEY (CategoryId) REFERENCES ref.BenefitCategoryRef (CategoryId),
    CONSTRAINT CK_BenefitProgram_Frequency CHECK (PaymentFrequency IN ('MONTHLY','ANNUAL','ONE_TIME','AS_NEEDED','LOAN_DISBURSEMENT')),
    CONSTRAINT CK_BenefitProgram_Amount CHECK (BaseAmount >= 0 AND MaxAmount >= 0)
);
GO

CREATE INDEX IX_BenefitProgram_Category ON ent.BenefitProgram (CategoryId);
CREATE INDEX IX_BenefitProgram_Frequency ON ent.BenefitProgram (PaymentFrequency, IsActive);
GO

-- -----------------------------------------------------------------------------
-- ent.BenefitRule : กฎการคำนวณสิทธิ (Rule as Data)
-- -----------------------------------------------------------------------------
CREATE TABLE ent.BenefitRule (
    RuleId                  BIGINT          IDENTITY(1,1) NOT NULL,
    ProgramId               BIGINT          NOT NULL,
    RuleCode                VARCHAR(50)     NOT NULL,
    RuleNameTh              NVARCHAR(200)   NOT NULL,
    RuleNameEn              NVARCHAR(200)   NULL,
    ApplicableLossType      NVARCHAR(50)   NULL,
    ApplicableMissionType   NVARCHAR(100)  NULL,
    ApplicablePersonnelType BIGINT          NULL,
    FormulaType             NVARCHAR(50)    NOT NULL DEFAULT 'MILITARY_FORMULA',
    IsActive                BIT             NOT NULL DEFAULT 1,
    CreatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_BenefitRule PRIMARY KEY CLUSTERED (RuleId),
    CONSTRAINT UQ_BenefitRule_Code UNIQUE (RuleCode),
    CONSTRAINT FK_BenefitRule_Program FOREIGN KEY (ProgramId) REFERENCES ent.BenefitProgram (ProgramId),
    CONSTRAINT FK_BenefitRule_PersonnelType FOREIGN KEY (ApplicablePersonnelType) REFERENCES ref.PersonnelType (PersonnelTypeId)
);
GO

CREATE INDEX IX_BenefitRule_Program ON ent.BenefitRule (ProgramId);
GO

-- -----------------------------------------------------------------------------
-- ent.RuleVersion : เวอร์ชันกฎพร้อมวันที่มีผล
-- -----------------------------------------------------------------------------
CREATE TABLE ent.RuleVersion (
    RuleVersionId       BIGINT          IDENTITY(1,1) NOT NULL,
    RuleId              BIGINT          NOT NULL,
    VersionNumber       INT             NOT NULL,
    EffectiveFrom       DATE            NOT NULL,
    EffectiveTo         DATE            NULL,
    ConditionsJson      NVARCHAR(MAX)   NULL,           -- เงื่อนไขการคำนวณ JSON
    FormulaParameters   NVARCHAR(MAX)   NULL,           -- พารามิเตอร์สูตร JSON
    ApprovedByUserId    BIGINT          NULL,
    PublishedAt         DATETIME2(0)   NULL,
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_RuleVersion PRIMARY KEY CLUSTERED (RuleVersionId),
    CONSTRAINT UQ_RuleVersion UNIQUE (RuleId, VersionNumber),
    CONSTRAINT FK_RuleVersion_Rule FOREIGN KEY (RuleId) REFERENCES ent.BenefitRule (RuleId),
    CONSTRAINT FK_RuleVersion_ApprovedBy FOREIGN KEY (ApprovedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_RuleVersion_Date CHECK (EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom)
);
GO

CREATE INDEX IX_RuleVersion_Rule ON ent.RuleVersion (RuleId, EffectiveFrom, EffectiveTo);
GO

-- -----------------------------------------------------------------------------
-- ent.RuleParameter : พารามิเตอร์ค่าคงที่ของแต่ละเวอร์ชันกฎ
-- -----------------------------------------------------------------------------
CREATE TABLE ent.RuleParameter (
    ParameterId     BIGINT          IDENTITY(1,1) NOT NULL,
    RuleVersionId   BIGINT          NOT NULL,
    ParameterName   VARCHAR(100)    NOT NULL,
    ParameterValue  DECIMAL(15,2)   NOT NULL,
    ParameterType   NVARCHAR(50)    NOT NULL,        -- AMOUNT / PERCENTAGE / YEARS / STEPS
    Description     NVARCHAR(500)   NULL,
    IsActive        BIT             NOT NULL DEFAULT 1,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_RuleParameter PRIMARY KEY CLUSTERED (ParameterId),
    CONSTRAINT FK_RuleParameter_Version FOREIGN KEY (RuleVersionId) REFERENCES ent.RuleVersion (RuleVersionId),
    CONSTRAINT UQ_RuleParameter_Name UNIQUE (RuleVersionId, ParameterName),
    CONSTRAINT CK_RuleParameter_Type CHECK (ParameterType IN ('AMOUNT','PERCENTAGE','YEARS','STEPS','COUNT','RATE'))
);
GO

CREATE INDEX IX_RuleParameter_Version ON ent.RuleParameter (RuleVersionId);
GO

-- -----------------------------------------------------------------------------
-- ent.EntitlementAccount : บัญชีสิทธิผูกพันรายบุคคล
-- -----------------------------------------------------------------------------
CREATE TABLE ent.EntitlementAccount (
    AccountId           BIGINT          IDENTITY(1,1) NOT NULL,
    AccountNumber       NVARCHAR(100)   NOT NULL,
    PersonnelId         BIGINT          NOT NULL,
    ProgramId           BIGINT          NOT NULL,
    RuleVersionId       BIGINT          NULL,
    EntitlementType     NVARCHAR(50)    NOT NULL,        -- MA2000 / SPECIAL_PENSION / CHILD_SCHOLARSHIP / ...
    AmountPerPeriod     DECIMAL(15,2)   NOT NULL,
    Frequency           NVARCHAR(50)    NOT NULL,        -- MONTHLY / ANNUAL / ONE_TIME
    Status              NVARCHAR(50)    NOT NULL DEFAULT 'ELIGIBLE', -- ELIGIBLE / ACTIVE / SUSPENDED / TERMINATED
    StartDate           DATE            NOT NULL,
    EndDate             DATE            NULL,
    BankAccountNumber   NVARCHAR(50)    NULL,           -- ข้อมูลลับ
    PayeeName           NVARCHAR(200)   NULL,
    CreatedByUserId     BIGINT          NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_EntitlementAccount PRIMARY KEY CLUSTERED (AccountId),
    CONSTRAINT UQ_EntitlementAccount_Number UNIQUE (AccountNumber),
    CONSTRAINT FK_EntitlementAccount_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_EntitlementAccount_Program FOREIGN KEY (ProgramId) REFERENCES ent.BenefitProgram (ProgramId),
    CONSTRAINT FK_EntitlementAccount_RuleVersion FOREIGN KEY (RuleVersionId) REFERENCES ent.RuleVersion (RuleVersionId),
    CONSTRAINT FK_EntitlementAccount_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_EntitlementAccount_Frequency CHECK (Frequency IN ('MONTHLY','ANNUAL','ONE_TIME')),
    CONSTRAINT CK_EntitlementAccount_Status CHECK (Status IN ('ELIGIBLE','ACTIVE','SUSPENDED','TERMINATED')),
    CONSTRAINT CK_EntitlementAccount_Amount CHECK (AmountPerPeriod >= 0),
    CONSTRAINT CK_EntitlementAccount_Date CHECK (EndDate IS NULL OR EndDate >= StartDate)
);
GO

CREATE INDEX IX_EntitlementAccount_Personnel ON ent.EntitlementAccount (PersonnelId);
CREATE INDEX IX_EntitlementAccount_Status ON ent.EntitlementAccount (Status, Frequency);
CREATE INDEX IX_EntitlementAccount_Program ON ent.EntitlementAccount (ProgramId);
GO

-- -----------------------------------------------------------------------------
-- ent.PaymentSchedule : ตารางงวดจ่ายล่วงหน้า
-- -----------------------------------------------------------------------------
CREATE TABLE ent.PaymentSchedule (
    ScheduleId      BIGINT          IDENTITY(1,1) NOT NULL,
    AccountId       BIGINT          NOT NULL,
    FiscalYear      NVARCHAR(10)    NOT NULL,
    PeriodNo        INT             NOT NULL,        -- 1-12 สำหรับรายเดือน / ปี สำหรับรายปี
    PeriodDate      DATE            NOT NULL,
    Amount          DECIMAL(15,2)   NOT NULL,
    Status          NVARCHAR(50)    NOT NULL DEFAULT 'PLANNED', -- PLANNED / PAID / SKIPPED / SUSPENDED
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PaymentSchedule PRIMARY KEY CLUSTERED (ScheduleId),
    CONSTRAINT FK_PaymentSchedule_Account FOREIGN KEY (AccountId) REFERENCES ent.EntitlementAccount (AccountId),
    CONSTRAINT UQ_PaymentSchedule UNIQUE (AccountId, FiscalYear, PeriodNo),
    CONSTRAINT CK_PaymentSchedule_Status CHECK (Status IN ('PLANNED','PAID','SKIPPED','SUSPENDED')),
    CONSTRAINT CK_PaymentSchedule_Amount CHECK (Amount >= 0)
);
GO

CREATE INDEX IX_PaymentSchedule_FiscalYear ON ent.PaymentSchedule (FiscalYear, Status);
CREATE INDEX IX_PaymentSchedule_PeriodDate ON ent.PaymentSchedule (PeriodDate);
GO

-- -----------------------------------------------------------------------------
-- ent.PaymentTransaction : รายการจ่ายจริง
-- -----------------------------------------------------------------------------
CREATE TABLE ent.PaymentTransaction (
    TransactionId           BIGINT          IDENTITY(1,1) NOT NULL,
    ScheduleId              BIGINT          NOT NULL,
    TransactionDate         DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    PaidAmount              DECIMAL(15,2)   NOT NULL,
    BankRef                 NVARCHAR(100)   NULL,
    ApprovedByUserId        BIGINT          NOT NULL,
    ReconciliationStatus    NVARCHAR(50)    NOT NULL DEFAULT 'PENDING', -- PENDING / RECONCILED / DISCREPANCY
    ReconciliationDate      DATE            NULL,
    Notes                   NVARCHAR(MAX)   NULL,
    CreatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_PaymentTransaction PRIMARY KEY CLUSTERED (TransactionId),
    CONSTRAINT FK_PaymentTransaction_Schedule FOREIGN KEY (ScheduleId) REFERENCES ent.PaymentSchedule (ScheduleId),
    CONSTRAINT FK_PaymentTransaction_ApprovedBy FOREIGN KEY (ApprovedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_PaymentTransaction_Amount CHECK (PaidAmount >= 0),
    CONSTRAINT CK_PaymentTransaction_Status CHECK (ReconciliationStatus IN ('PENDING','RECONCILED','DISCREPANCY'))
);
GO

CREATE INDEX IX_PaymentTransaction_Schedule ON ent.PaymentTransaction (ScheduleId);
CREATE INDEX IX_PaymentTransaction_Date ON ent.PaymentTransaction (TransactionDate);
GO

-- -----------------------------------------------------------------------------
-- ent.ProofOfLifeRecord : ผลตรวจสถานะการมีชีวิต (ทุก 6 เดือน)
-- -----------------------------------------------------------------------------
CREATE TABLE ent.ProofOfLifeRecord (
    RecordId            BIGINT          IDENTITY(1,1) NOT NULL,
    AccountId           BIGINT          NOT NULL,
    VerificationDate    DATE            NOT NULL,
    VerificationMethod  NVARCHAR(50)    NOT NULL,        -- CIVIL_REGISTRY / REPORT_IN_PERSON / OFFICER_CONFIRM
    VerificationResult  NVARCHAR(50)    NOT NULL,        -- VERIFIED / FAILED / PENDING
    NextDueDate         DATE            NOT NULL,
    Notes               NVARCHAR(MAX)   NULL,
    VerifiedByUserId    BIGINT          NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ProofOfLifeRecord PRIMARY KEY CLUSTERED (RecordId),
    CONSTRAINT FK_ProofOfLifeRecord_Account FOREIGN KEY (AccountId) REFERENCES ent.EntitlementAccount (AccountId),
    CONSTRAINT FK_ProofOfLifeRecord_VerifiedBy FOREIGN KEY (VerifiedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_ProofOfLife_Method CHECK (VerificationMethod IN ('CIVIL_REGISTRY','REPORT_IN_PERSON','OFFICER_CONFIRM','DOCUMENTARY')),
    CONSTRAINT CK_ProofOfLife_Result CHECK (VerificationResult IN ('VERIFIED','FAILED','PENDING'))
);
GO

CREATE INDEX IX_ProofOfLife_Account ON ent.ProofOfLifeRecord (AccountId, VerificationDate);
CREATE INDEX IX_ProofOfLife_NextDue ON ent.ProofOfLifeRecord (NextDueDate);
GO

-- ==============================================================================
-- 5. Welfare Tables (สวัสดิการ 4 ด้าน)
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- wfl.MedicalClaim : คำขอเบิกค่ารักษาพยาบาล
-- -----------------------------------------------------------------------------
CREATE TABLE wfl.MedicalClaim (
    ClaimId             BIGINT          IDENTITY(1,1) NOT NULL,
    ClaimNumber         NVARCHAR(100)   NOT NULL,
    PersonnelId         BIGINT          NOT NULL,
    ClaimDate           DATE            NOT NULL,
    PatientType         NVARCHAR(50)    NOT NULL,        -- SELF / SPOUSE / CHILD / FATHER / MOTHER
    PatientName         NVARCHAR(200)   NOT NULL,
    HospitalName        NVARCHAR(200)   NULL,
    HospitalType        NVARCHAR(50)    NULL,            -- GOVERNMENT / PRIVATE
    TotalAmount         DECIMAL(15,2)   NOT NULL DEFAULT 0,
    ApprovedAmount      DECIMAL(15,2)   NULL,
    Status              NVARCHAR(50)    NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED / UNDER_REVIEW / DOCUMENT_VERIFIED / APPROVED / REJECTED / DISBURSED
    FiscalYear          NVARCHAR(10)    NOT NULL,
    CreatedByUserId     BIGINT          NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_MedicalClaim PRIMARY KEY CLUSTERED (ClaimId),
    CONSTRAINT UQ_MedicalClaim_Number UNIQUE (ClaimNumber),
    CONSTRAINT FK_MedicalClaim_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_MedicalClaim_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_MedicalClaim_PatientType CHECK (PatientType IN ('SELF','SPOUSE','CHILD','FATHER','MOTHER')),
    CONSTRAINT CK_MedicalClaim_HospitalType CHECK (HospitalType IS NULL OR HospitalType IN ('GOVERNMENT','PRIVATE')),
    CONSTRAINT CK_MedicalClaim_Status CHECK (Status IN ('SUBMITTED','UNDER_REVIEW','DOCUMENT_VERIFIED','APPROVED','REJECTED','DISBURSED')),
    CONSTRAINT CK_MedicalClaim_Amount CHECK (TotalAmount >= 0 AND (ApprovedAmount IS NULL OR ApprovedAmount >= 0))
);
GO

CREATE INDEX IX_MedicalClaim_Personnel ON wfl.MedicalClaim (PersonnelId);
CREATE INDEX IX_MedicalClaim_Status ON wfl.MedicalClaim (Status, FiscalYear);
GO

-- -----------------------------------------------------------------------------
-- wfl.MedicalClaimDetail : รายการค่ารักษาย่อย
-- -----------------------------------------------------------------------------
CREATE TABLE wfl.MedicalClaimDetail (
    DetailId            BIGINT          IDENTITY(1,1) NOT NULL,
    ClaimId             BIGINT          NOT NULL,
    ItemDescription     NVARCHAR(500)   NOT NULL,
    Amount              DECIMAL(15,2)   NOT NULL,
    ReceiptNumber       NVARCHAR(100)   NULL,
    ReceiptDate         DATE            NULL,
    CONSTRAINT PK_MedicalClaimDetail PRIMARY KEY CLUSTERED (DetailId),
    CONSTRAINT FK_MedicalClaimDetail_Claim FOREIGN KEY (ClaimId) REFERENCES wfl.MedicalClaim (ClaimId),
    CONSTRAINT CK_MedicalClaimDetail_Amount CHECK (Amount >= 0)
);
GO

CREATE INDEX IX_MedicalClaimDetail_Claim ON wfl.MedicalClaimDetail (ClaimId);
GO

-- -----------------------------------------------------------------------------
-- wfl.EducationClaim : คำขอทุน/ค่าเล่าเรียนบุตร
-- -----------------------------------------------------------------------------
CREATE TABLE wfl.EducationClaim (
    ClaimId             BIGINT          IDENTITY(1,1) NOT NULL,
    ClaimNumber         NVARCHAR(100)   NOT NULL,
    PersonnelId         BIGINT          NOT NULL,
    ChildId             BIGINT          NULL,
    ClaimYear           INT             NOT NULL,
    ClaimDate           DATE            NOT NULL,
    EducationLevel      NVARCHAR(100)   NOT NULL,
    SchoolName          NVARCHAR(200)   NULL,
    TotalAmount         DECIMAL(15,2)   NOT NULL DEFAULT 0,
    ApprovedAmount      DECIMAL(15,2)   NULL,
    Status              NVARCHAR(50)    NOT NULL DEFAULT 'SUBMITTED',
    IsSpecialRate       BIT             NOT NULL DEFAULT 0, -- บุตรผู้เสียชีวิต/ทุพพลภาพ
    CreatedByUserId     BIGINT          NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_EducationClaim PRIMARY KEY CLUSTERED (ClaimId),
    CONSTRAINT UQ_EducationClaim_Number UNIQUE (ClaimNumber),
    CONSTRAINT FK_EducationClaim_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_EducationClaim_Child FOREIGN KEY (ChildId) REFERENCES core.Child (ChildId),
    CONSTRAINT FK_EducationClaim_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_EducationClaim_Status CHECK (Status IN ('SUBMITTED','UNDER_REVIEW','DOCUMENT_VERIFIED','APPROVED','REJECTED','DISBURSED')),
    CONSTRAINT CK_EducationClaim_Amount CHECK (TotalAmount >= 0 AND (ApprovedAmount IS NULL OR ApprovedAmount >= 0))
);
GO

CREATE INDEX IX_EducationClaim_Personnel ON wfl.EducationClaim (PersonnelId);
CREATE INDEX IX_EducationClaim_Child ON wfl.EducationClaim (ChildId);
CREATE INDEX IX_EducationClaim_Status ON wfl.EducationClaim (Status, ClaimYear);
GO

-- -----------------------------------------------------------------------------
-- wfl.EducationClaimDetail : รายการค่าเล่าเรียนย่อย
-- -----------------------------------------------------------------------------
CREATE TABLE wfl.EducationClaimDetail (
    DetailId            BIGINT          IDENTITY(1,1) NOT NULL,
    ClaimId             BIGINT          NOT NULL,
    ItemType            NVARCHAR(50)    NOT NULL,        -- TUITION / UNIFORM / BOOK / TRANSPORT / OTHER
    Amount              DECIMAL(15,2)   NOT NULL,
    ReceiptNumber       NVARCHAR(100)   NULL,
    CONSTRAINT PK_EducationClaimDetail PRIMARY KEY CLUSTERED (DetailId),
    CONSTRAINT FK_EducationClaimDetail_Claim FOREIGN KEY (ClaimId) REFERENCES wfl.EducationClaim (ClaimId),
    CONSTRAINT CK_EducationClaimDetail_Type CHECK (ItemType IN ('TUITION','UNIFORM','BOOK','TRANSPORT','OTHER')),
    CONSTRAINT CK_EducationClaimDetail_Amount CHECK (Amount >= 0)
);
GO

CREATE INDEX IX_EducationClaimDetail_Claim ON wfl.EducationClaimDetail (ClaimId);
GO

-- -----------------------------------------------------------------------------
-- wfl.HousingApplication : คำขอบ้านพัก / ค่าเช่าบ้าน
-- -----------------------------------------------------------------------------
CREATE TABLE wfl.HousingApplication (
    ApplicationId       BIGINT          IDENTITY(1,1) NOT NULL,
    ApplicationNumber   NVARCHAR(100)   NOT NULL,
    PersonnelId         BIGINT          NOT NULL,
    ApplicationType     NVARCHAR(50)    NOT NULL,        -- HOUSE / RENTAL
    ApplicationDate     DATE            NOT NULL,
    Score               DECIMAL(10,2)   NULL,
    Status              NVARCHAR(50)    NOT NULL DEFAULT 'SUBMITTED', -- SUBMITTED / QUEUED / ALLOCATED / REJECTED / CANCELLED
    RequestedUnitId     BIGINT          NULL,
    ApprovedUnitId      BIGINT          NULL,
    MonthlyRent         DECIMAL(15,2)   NULL,
    CreatedByUserId     BIGINT          NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_HousingApplication PRIMARY KEY CLUSTERED (ApplicationId),
    CONSTRAINT UQ_HousingApplication_Number UNIQUE (ApplicationNumber),
    CONSTRAINT FK_HousingApplication_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_HousingApplication_RequestedUnit FOREIGN KEY (RequestedUnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT FK_HousingApplication_ApprovedUnit FOREIGN KEY (ApprovedUnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT FK_HousingApplication_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_HousingApplication_Type CHECK (ApplicationType IN ('HOUSE','RENTAL')),
    CONSTRAINT CK_HousingApplication_Status CHECK (Status IN ('SUBMITTED','QUEUED','ALLOCATED','REJECTED','CANCELLED')),
    CONSTRAINT CK_HousingApplication_Rent CHECK (MonthlyRent IS NULL OR MonthlyRent >= 0)
);
GO

CREATE INDEX IX_HousingApplication_Personnel ON wfl.HousingApplication (PersonnelId);
CREATE INDEX IX_HousingApplication_Status ON wfl.HousingApplication (Status, ApplicationDate);
GO

-- -----------------------------------------------------------------------------
-- wfl.HousingQueue : บัญชีรอบ้านพัก
-- -----------------------------------------------------------------------------
CREATE TABLE wfl.HousingQueue (
    QueueId             BIGINT          IDENTITY(1,1) NOT NULL,
    ApplicationId       BIGINT          NOT NULL,
    QueueDate           DATE            NOT NULL,
    QueuePosition       INT             NOT NULL,
    Score               DECIMAL(10,2)   NOT NULL,
    Status              NVARCHAR(50)    NOT NULL DEFAULT 'WAITING', -- WAITING / ALLOCATED / CANCELLED
    AllocatedDate       DATE            NULL,
    AllocatedByUserId   BIGINT          NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_HousingQueue PRIMARY KEY CLUSTERED (QueueId),
    CONSTRAINT FK_HousingQueue_Application FOREIGN KEY (ApplicationId) REFERENCES wfl.HousingApplication (ApplicationId),
    CONSTRAINT FK_HousingQueue_AllocatedBy FOREIGN KEY (AllocatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_HousingQueue_Status CHECK (Status IN ('WAITING','ALLOCATED','CANCELLED')),
    CONSTRAINT CK_HousingQueue_Score CHECK (Score >= 0)
);
GO

CREATE INDEX IX_HousingQueue_Status ON wfl.HousingQueue (Status, QueuePosition);
CREATE INDEX IX_HousingQueue_Score ON wfl.HousingQueue (Score DESC);
GO

-- -----------------------------------------------------------------------------
-- wfl.AllowanceEntitlement : เงินเพิ่มพิเศษ / ค่าตอบแทนตามตำแหน่ง/ภารกิจ
-- -----------------------------------------------------------------------------
CREATE TABLE wfl.AllowanceEntitlement (
    EntitlementId       BIGINT          IDENTITY(1,1) NOT NULL,
    PersonnelId         BIGINT          NOT NULL,
    AllowanceCode       VARCHAR(50)     NOT NULL,        -- พ.ช.ท. / พ.ส.ร. / ค่าเสี่ยงภัย / ...
    AllowanceNameTh     NVARCHAR(200)   NOT NULL,
    PositionId          BIGINT          NULL,
    UnitId              BIGINT          NULL,
    Amount              DECIMAL(15,2)   NOT NULL,
    EffectiveFrom       DATE            NOT NULL,
    EffectiveTo         DATE            NULL,
    ApprovedByUserId    BIGINT          NOT NULL,
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_AllowanceEntitlement PRIMARY KEY CLUSTERED (EntitlementId),
    CONSTRAINT FK_AllowanceEntitlement_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_AllowanceEntitlement_Position FOREIGN KEY (PositionId) REFERENCES ref.Position (PositionId),
    CONSTRAINT FK_AllowanceEntitlement_Unit FOREIGN KEY (UnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT FK_AllowanceEntitlement_ApprovedBy FOREIGN KEY (ApprovedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_AllowanceEntitlement_Amount CHECK (Amount >= 0),
    CONSTRAINT CK_AllowanceEntitlement_Date CHECK (EffectiveTo IS NULL OR EffectiveTo >= EffectiveFrom)
);
GO

CREATE INDEX IX_AllowanceEntitlement_Personnel ON wfl.AllowanceEntitlement (PersonnelId, EffectiveFrom, EffectiveTo);
CREATE INDEX IX_AllowanceEntitlement_Code ON wfl.AllowanceEntitlement (AllowanceCode);
GO

-- ==============================================================================
-- 6. Budget / Forecast Tables
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- bud.BudgetPlan : แผนงบประมาณประจำปี
-- -----------------------------------------------------------------------------
CREATE TABLE bud.BudgetPlan (
    PlanId              BIGINT          IDENTITY(1,1) NOT NULL,
    PlanNumber          NVARCHAR(100)   NOT NULL,
    FiscalYear          NVARCHAR(10)    NOT NULL,
    PlanNameTh          NVARCHAR(200)   NOT NULL,
    Status              NVARCHAR(50)    NOT NULL DEFAULT 'DRAFT', -- DRAFT / SUBMITTED / APPROVED / REJECTED
    TotalRequested      DECIMAL(18,2)   NOT NULL DEFAULT 0,
    TotalApproved       DECIMAL(18,2)   NULL,
    CreatedByUserId     BIGINT          NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    ApprovedAt          DATETIME2(0)   NULL,
    CONSTRAINT PK_BudgetPlan PRIMARY KEY CLUSTERED (PlanId),
    CONSTRAINT UQ_BudgetPlan_FiscalYear UNIQUE (FiscalYear),
    CONSTRAINT UQ_BudgetPlan_Number UNIQUE (PlanNumber),
    CONSTRAINT FK_BudgetPlan_CreatedBy FOREIGN KEY (CreatedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_BudgetPlan_Status CHECK (Status IN ('DRAFT','SUBMITTED','APPROVED','REJECTED'))
);
GO

CREATE INDEX IX_BudgetPlan_Status ON bud.BudgetPlan (Status, FiscalYear);
GO

-- -----------------------------------------------------------------------------
-- bud.ForecastScenario : สถานการณ์พยากรณ์ (Base / High / Low)
-- -----------------------------------------------------------------------------
CREATE TABLE bud.ForecastScenario (
    ScenarioId      BIGINT          IDENTITY(1,1) NOT NULL,
    PlanId          BIGINT          NOT NULL,
    ScenarioName    NVARCHAR(100)   NOT NULL,        -- Base / High / Low
    ScenarioType    NVARCHAR(50)    NOT NULL,        -- BASE / HIGH / LOW
    Assumptions     NVARCHAR(MAX)   NULL,
    TotalEstimated  DECIMAL(18,2)   NOT NULL DEFAULT 0,
    CreatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt       DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ForecastScenario PRIMARY KEY CLUSTERED (ScenarioId),
    CONSTRAINT UQ_ForecastScenario UNIQUE (PlanId, ScenarioType),
    CONSTRAINT FK_ForecastScenario_Plan FOREIGN KEY (PlanId) REFERENCES bud.BudgetPlan (PlanId),
    CONSTRAINT CK_ForecastScenario_Type CHECK (ScenarioType IN ('BASE','HIGH','LOW'))
);
GO

CREATE INDEX IX_ForecastScenario_Plan ON bud.ForecastScenario (PlanId);
GO

-- -----------------------------------------------------------------------------
-- bud.ForecastLineItem : รายการพยากรณ์รายโครงการ/หน่วย
-- -----------------------------------------------------------------------------
CREATE TABLE bud.ForecastLineItem (
    LineItemId              BIGINT          IDENTITY(1,1) NOT NULL,
    ScenarioId              BIGINT          NOT NULL,
    ProgramId               BIGINT          NOT NULL,
    UnitId                  BIGINT          NULL,
    EstimatedAmount         DECIMAL(18,2)   NOT NULL DEFAULT 0,
    PreviousActualAmount    DECIMAL(18,2)   NULL,
    GrowthRate              DECIMAL(5,2)    NULL,
    Remarks                 NVARCHAR(MAX)   NULL,
    CreatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    UpdatedAt               DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_ForecastLineItem PRIMARY KEY CLUSTERED (LineItemId),
    CONSTRAINT FK_ForecastLineItem_Scenario FOREIGN KEY (ScenarioId) REFERENCES bud.ForecastScenario (ScenarioId),
    CONSTRAINT FK_ForecastLineItem_Program FOREIGN KEY (ProgramId) REFERENCES ent.BenefitProgram (ProgramId),
    CONSTRAINT FK_ForecastLineItem_Unit FOREIGN KEY (UnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT UQ_ForecastLineItem UNIQUE (ScenarioId, ProgramId, UnitId)
);
GO

CREATE INDEX IX_ForecastLineItem_Program ON bud.ForecastLineItem (ProgramId);
CREATE INDEX IX_ForecastLineItem_Unit ON bud.ForecastLineItem (UnitId);
GO

-- ==============================================================================
-- 7. Document Tables
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- core.IssuedDocument : หนังสือรับรองสิทธิ / คำสั่ง / รายงาน
-- -----------------------------------------------------------------------------
CREATE TABLE core.IssuedDocument (
    DocumentId          BIGINT          IDENTITY(1,1) NOT NULL,
    DocumentNumber      NVARCHAR(100)   NOT NULL,
    DocumentType        NVARCHAR(50)    NOT NULL,        -- CERTIFICATE / ORDER / REPORT
    TemplateCode        NVARCHAR(50)    NULL,
    PersonnelId         BIGINT          NULL,
    AccountId           BIGINT          NULL,
    CaseId              BIGINT          NULL,
    ContentJson         NVARCHAR(MAX)   NULL,
    QrCodeVerifyToken   NVARCHAR(255)   NULL,
    FileUrl             NVARCHAR(500)   NULL,
    IssuedByUserId      BIGINT          NOT NULL,
    IssuedAt            DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    IsRevoked           BIT             NOT NULL DEFAULT 0,
    RevokedAt           DATETIME2(0)   NULL,
    RevokeReason        NVARCHAR(MAX)   NULL,
    CONSTRAINT PK_IssuedDocument PRIMARY KEY CLUSTERED (DocumentId),
    CONSTRAINT UQ_IssuedDocument_Number UNIQUE (DocumentNumber),
    CONSTRAINT FK_IssuedDocument_Personnel FOREIGN KEY (PersonnelId) REFERENCES core.MilitaryPersonnel (PersonnelId),
    CONSTRAINT FK_IssuedDocument_Account FOREIGN KEY (AccountId) REFERENCES ent.EntitlementAccount (AccountId),
    CONSTRAINT FK_IssuedDocument_Case FOREIGN KEY (CaseId) REFERENCES core.SpecialPromotionCase (CaseId),
    CONSTRAINT FK_IssuedDocument_IssuedBy FOREIGN KEY (IssuedByUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT CK_IssuedDocument_Type CHECK (DocumentType IN ('CERTIFICATE','ORDER','REPORT','MEMO'))
);
GO

CREATE INDEX IX_IssuedDocument_Personnel ON core.IssuedDocument (PersonnelId);
CREATE INDEX IX_IssuedDocument_Token ON core.IssuedDocument (QrCodeVerifyToken);
GO

-- ==============================================================================
-- 8. Audit Tables
-- ==============================================================================

-- -----------------------------------------------------------------------------
-- aud.AuditEventCatalog : ทะเบียนเหตุการณ์ที่ต้องบันทึก Audit
-- -----------------------------------------------------------------------------
CREATE TABLE aud.AuditEventCatalog (
    EventId             BIGINT          IDENTITY(1,1) NOT NULL,
    EventCode           VARCHAR(100)    NOT NULL,
    EventCategory       NVARCHAR(100)   NOT NULL,        -- IDENTITY / PERSONNEL / PROMOTION / ENTITLEMENT / RULE / DOCUMENT / SYSTEM
    EventNameTh         NVARCHAR(200)   NOT NULL,
    SeverityLevel       NVARCHAR(20)    NOT NULL,        -- INFO / WARNING / CRITICAL
    RequiresReason      BIT             NOT NULL DEFAULT 0,
    IsActive            BIT             NOT NULL DEFAULT 1,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_AuditEventCatalog PRIMARY KEY CLUSTERED (EventId),
    CONSTRAINT UQ_AuditEventCatalog_Code UNIQUE (EventCode),
    CONSTRAINT CK_AuditEventCatalog_Severity CHECK (SeverityLevel IN ('INFO','WARNING','CRITICAL'))
);
GO

CREATE INDEX IX_AuditEventCatalog_Category ON aud.AuditEventCatalog (EventCategory);
GO

-- -----------------------------------------------------------------------------
-- aud.AuditLog : บันทึกตรวจสอบแบบ Append-Only + Hash Chain
-- -----------------------------------------------------------------------------
CREATE TABLE aud.AuditLog (
    AuditId             BIGINT          IDENTITY(1,1) NOT NULL,
    [Timestamp]         DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    ActorUserId         BIGINT          NULL,
    ActorName           NVARCHAR(200)   NULL,
    ActorRole           NVARCHAR(50)    NULL,
    ActorUnitId         BIGINT          NULL,
    ActionCode          VARCHAR(100)    NOT NULL,
    EntityType          NVARCHAR(100)   NOT NULL,
    EntityId            BIGINT          NULL,
    EntityKey           NVARCHAR(100)   NULL,
    BeforeStateJson     NVARCHAR(MAX)   NULL,
    AfterStateJson      NVARCHAR(MAX)   NULL,
    Reason              NVARCHAR(MAX)   NULL,
    RuleVersionId       BIGINT          NULL,
    IpAddress           VARCHAR(50)     NULL,
    UserAgent           NVARCHAR(500)   NULL,
    SessionId           NVARCHAR(100)   NULL,
    PrevHash            VARBINARY(32)   NULL,
    RecordHash          VARBINARY(32)   NOT NULL,
    CreatedAt           DATETIME2(0)    NOT NULL DEFAULT GETDATE(),
    CONSTRAINT PK_AuditLog PRIMARY KEY CLUSTERED (AuditId),
    CONSTRAINT FK_AuditLog_ActorUser FOREIGN KEY (ActorUserId) REFERENCES core.[User] (UserId),
    CONSTRAINT FK_AuditLog_ActorUnit FOREIGN KEY (ActorUnitId) REFERENCES ref.Unit (UnitId),
    CONSTRAINT FK_AuditLog_RuleVersion FOREIGN KEY (RuleVersionId) REFERENCES ent.RuleVersion (RuleVersionId),
    CONSTRAINT FK_AuditLog_EventCode FOREIGN KEY (ActionCode) REFERENCES aud.AuditEventCatalog (EventCode)
);
GO

CREATE INDEX IX_AuditLog_Timestamp ON aud.AuditLog ([Timestamp]);
CREATE INDEX IX_AuditLog_Actor ON aud.AuditLog (ActorUserId, [Timestamp]);
CREATE INDEX IX_AuditLog_Action ON aud.AuditLog (ActionCode, [Timestamp]);
CREATE INDEX IX_AuditLog_Entity ON aud.AuditLog (EntityType, EntityId, [Timestamp]);
GO

-- คำนวณ Hash Chain อัตโนมัติก่อนบันทึก
CREATE TRIGGER trg_AuditLog_HashChain
ON aud.AuditLog
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LastHash VARBINARY(32);
    SELECT TOP 1 @LastHash = RecordHash FROM aud.AuditLog ORDER BY AuditId DESC;

    INSERT INTO aud.AuditLog (
        [Timestamp], ActorUserId, ActorName, ActorRole, ActorUnitId,
        ActionCode, EntityType, EntityId, EntityKey,
        BeforeStateJson, AfterStateJson, Reason, RuleVersionId,
        IpAddress, UserAgent, SessionId, PrevHash, RecordHash, CreatedAt
    )
    SELECT
        i.[Timestamp],
        i.ActorUserId,
        i.ActorName,
        i.ActorRole,
        i.ActorUnitId,
        i.ActionCode,
        i.EntityType,
        i.EntityId,
        i.EntityKey,
        i.BeforeStateJson,
        i.AfterStateJson,
        i.Reason,
        i.RuleVersionId,
        i.IpAddress,
        i.UserAgent,
        i.SessionId,
        @LastHash,
        HASHBYTES('SHA2_256',
            CONVERT(VARCHAR(50), i.[Timestamp]) + '|' +
            ISNULL(CONVERT(VARCHAR(20), i.ActorUserId), '') + '|' +
            i.ActionCode + '|' +
            i.EntityType + '|' +
            ISNULL(CONVERT(VARCHAR(20), i.EntityId), '') + '|' +
            ISNULL(i.EntityKey, '') + '|' +
            ISNULL(i.BeforeStateJson, '') + '|' +
            ISNULL(i.AfterStateJson, '') + '|' +
            ISNULL(CONVERT(VARCHAR(32), @LastHash, 2), '')
        ),
        i.CreatedAt
    FROM inserted i;
END;
GO

-- ==============================================================================
-- 9. Helper Views for Point-in-Time Queries
-- ==============================================================================

-- ข้อมูลกำลังพล ณ วันที่ระบุ (ยศ หน่วย เงินเดือน ณ วันนั้น)
CREATE VIEW core.vw_PersonnelProfileAsOf
AS
SELECT
    mp.PersonnelId,
    mp.MilitaryId,
    c.NationalId,
    c.TitleTh + c.FirstNameTh + ' ' + c.LastNameTh AS FullNameTh,
    mp.AppointmentDate,
    mp.ServiceStatus,
    r.RankNameTh AS RankAsOf,
    u.UnitNameTh AS UnitAsOf,
    p.PositionNameTh AS PositionAsOf,
    sh.SalaryAmount AS SalaryAsOf
FROM core.MilitaryPersonnel mp
INNER JOIN core.Citizen c ON mp.CitizenId = c.CitizenId
LEFT JOIN ref.MilitaryRank r ON r.RankId = mp.CurrentRankId
LEFT JOIN ref.Unit u ON u.UnitId = mp.CurrentUnitId
LEFT JOIN ref.Position p ON p.PositionId = mp.CurrentPositionId
LEFT JOIN hist.SalaryHistory sh ON sh.PersonnelId = mp.PersonnelId
    AND sh.EffectiveFrom <= CAST(GETDATE() AS DATE)
    AND (sh.EffectiveTo IS NULL OR sh.EffectiveTo >= CAST(GETDATE() AS DATE));
GO

-- ==============================================================================
-- 10. Seed Reference Data
-- ==============================================================================

INSERT INTO ref.MilitaryBranch (BranchCode, BranchNameTh, BranchNameEn) VALUES
('RTA', N'กองทัพบก', 'Royal Thai Army'),
('RTN', N'กองทัพเรือ', 'Royal Thai Navy'),
('RTAF', N'กองทัพอากาศ', 'Royal Thai Air Force'),
('RTARF', N'กองบัญชาการกองทัพไทย', 'Royal Thai Armed Forces HQ'),
('OPS', N'สำนักงานปลัดกระทรวงกลาโหม', 'Office of Permanent Secretary');
GO

INSERT INTO ref.PersonnelType (TypeCode, TypeNameTh, TypeNameEn) VALUES
('COMMISSIONED', N'นายทหารสัญญาบัตร', 'Commissioned Officer'),
('NON_COMMISSIONED', N'นายทหารประทวน', 'Non-Commissioned Officer'),
('CONSCRIPT', N'พลทหารกองประจำการ', 'Conscript'),
('VOLUNTEER', N'อส.ทพ.', 'Volunteer Ranger'),
('GOVERNMENT_EMP', N'พนักงานราชการ', 'Government Employee'),
('CONTRACT', N'ลูกจ้าง', 'Contract Employee'),
('CIVILIAN', N'พลเรือน', 'Civilian');
GO

INSERT INTO ref.RelationshipType (TypeCode, TypeNameTh) VALUES
('SPOUSE_LEGAL', N'คู่สมรสจดทะเบียน'),
('SPOUSE_DE_FACTO', N'คู่สมรสไม่จดทะเบียน'),
('CHILD_LEGITIMATE', N'บุตรแท้'),
('CHILD_ADOPTED', N'บุตรบุญธรรม'),
('FATHER', N'บิดา'),
('MOTHER', N'มารดา'),
('OTHER_HEIR', N'ทายาทอื่น');
GO

INSERT INTO ref.BenefitCategoryRef (CategoryCode, CategoryNameTh, CategoryType) VALUES
('MEDICAL', N'ค่ารักษาพยาบาล', 'MEDICAL'),
('EDUCATION', N'การศึกษาบุตร', 'EDUCATION'),
('HOUSING', N'ที่พักอาศัย', 'HOUSING'),
('ALLOWANCE', N'เงินเพิ่มพิเศษ', 'ALLOWANCE'),
('PENSION', N'บำนาญพิเศษ', 'PENSION'),
('LUMP_SUM', N'เงินช่วยเหลือครั้งเดียว', 'LUMP_SUM'),
('SCHOLARSHIP', N'ทุนการศึกษา', 'SCHOLARSHIP'),
('COMPENSATION', N'ค่าชดเชย', 'COMPENSATION');
GO

INSERT INTO aud.AuditEventCatalog (EventCode, EventCategory, EventNameTh, SeverityLevel, RequiresReason) VALUES
('LOGIN_SUCCESS', 'IDENTITY', N'เข้าสู่ระบบสำเร็จ', 'INFO', 0),
('LOGIN_FAILED', 'IDENTITY', N'เข้าสู่ระบบล้มเหลว', 'WARNING', 0),
('PERSONNEL_CREATED', 'PERSONNEL', N'สร้างทะเบียนกำลังพล', 'INFO', 0),
('PERSONNEL_UPDATED', 'PERSONNEL', N'แก้ไขทะเบียนกำลังพล', 'INFO', 0),
('PROMOTION_CASE_SUBMITTED', 'PROMOTION', N'เสนอสำนวนปูนบำเหน็จ', 'INFO', 0),
('PROMOTION_CASE_APPROVED', 'PROMOTION', N'อนุมัติสำนวนปูนบำเหน็จ', 'CRITICAL', 1),
('PROMOTION_ORDER_ISSUED', 'PROMOTION', N'ออกคำสั่งปูนบำเหน็จ', 'CRITICAL', 1),
('MA2000_ACTIVATED', 'ENTITLEMENT', N'เปิดสิทธิเงินช่วยเหลือรายเดือน 2,000 บาท', 'CRITICAL', 0),
('ENTITLEMENT_SUSPENDED', 'ENTITLEMENT', N'ระงับสิทธิ', 'CRITICAL', 1),
('PAYMENT_DISBURSED', 'ENTITLEMENT', N'จ่ายเงินงวด', 'CRITICAL', 1),
('RULE_VERSION_PUBLISHED', 'RULE', N'เผยแพร่เวอร์ชันกฎ', 'CRITICAL', 1),
