-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logo_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketplace_agents" (
    "id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "use_case" TEXT,
    "integration_requirements" JSONB,
    "data_requirements" JSONB,
    "governance_score" INTEGER,
    "roi_estimate" JSONB,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_agents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendors_slug_key" ON "vendors"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "agent_categories_slug_key" ON "agent_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_agents_vendor_id_slug_key" ON "marketplace_agents"("vendor_id", "slug");

-- AddForeignKey
ALTER TABLE "marketplace_agents" ADD CONSTRAINT "marketplace_agents_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketplace_agents" ADD CONSTRAINT "marketplace_agents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "agent_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
