import { MigrationInterface, QueryRunner } from 'typeorm';

export class SetupRlsAndRbac1726542513394 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable RLS on relevant tables
    await queryRunner.query(`ALTER TABLE "role" ENABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`ALTER TABLE "user" ENABLE ROW LEVEL SECURITY`);

    // Create RLS policies
    await queryRunner.query(`
              CREATE POLICY tenant_isolation_policy ON "role"
                  USING ("tenantId" = current_setting('app.current_tenant')::UUID)
          `);

    await queryRunner.query(`
              CREATE POLICY tenant_isolation_policy ON "organization"
                  USING ("tenantId" = current_setting('app.current_tenant')::UUID)
          `);

    await queryRunner.query(`
              CREATE POLICY tenant_isolation_policy ON "user"
                  USING ("tenantId" = current_setting('app.current_tenant')::UUID)
          `);

    // Create function to set tenant
    await queryRunner.query(`
              CREATE OR REPLACE FUNCTION set_tenant(uuid) RETURNS void AS $$
              BEGIN
                  PERFORM set_config('app.current_tenant', $1::text, false);
              END;
              $$ LANGUAGE plpgsql;
          `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Disable RLS
    await queryRunner.query(`ALTER TABLE "role" DISABLE ROW LEVEL SECURITY`);
    await queryRunner.query(
      `ALTER TABLE "organization" DISABLE ROW LEVEL SECURITY`,
    );
    await queryRunner.query(`ALTER TABLE "user" DISABLE ROW LEVEL SECURITY`);

    // Drop policies
    await queryRunner.query(`DROP POLICY tenant_isolation_policy ON "role"`);
    await queryRunner.query(
      `DROP POLICY tenant_isolation_policy ON "organization"`,
    );
    await queryRunner.query(`DROP POLICY tenant_isolation_policy ON "user"`);

    // Drop function
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_tenant(uuid)`);
  }
}
