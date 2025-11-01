/**
 * UID Factory for generating unique dashboard UIDs with instance support
 * Allows developers to deploy multiple instances of dashboards (e.g., for experimentation)
 */
export class UidFactory {
  private static readonly MAX_UID_LENGTH = 40;
  private static instanceId: string | undefined = process.env.DASHBOARD_INSTANCE_ID;

  /**
   * Set the instance identifier for all generated UIDs
   * @param instanceId - Identifier for this dashboard instance (e.g., branch name, dev name, feature name)
   */
  static setInstanceId(instanceId: string | undefined): void {
    UidFactory.instanceId = instanceId;
  }

  /**
   * Get the current instance identifier
   */
  static getInstanceId(): string | undefined {
    return UidFactory.instanceId;
  }

  /**
   * Generate a UID with optional instance suffix
   * @param baseUid - Base UID pattern (e.g., "service-monitoring", "express-demo-server-api-deep-dive")
   * @param instanceId - Optional instance identifier (overrides global instance ID if provided)
   * @returns UID truncated to 40 characters max
   */
  static create(baseUid: string, instanceId?: string): string {
    const instance = instanceId ?? UidFactory.instanceId;
    
    if (!instance || instance.length === 0) {
      return UidFactory.truncate(baseUid);
    }

    // Normalize instance ID (lowercase, replace spaces/special chars with hyphens)
    const normalizedInstance = instance
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Build UID with instance suffix: base-instance
    const uidWithInstance = `${baseUid}-${normalizedInstance}`;
    
    return UidFactory.truncate(uidWithInstance);
  }

  /**
   * Truncate UID to max length while preserving base identity
   * If truncation is needed, preserves the start (base) and truncates from the instance part
   */
  private static truncate(uid: string): string {
    if (uid.length <= UidFactory.MAX_UID_LENGTH) {
      return uid;
    }

    // If too long, truncate from the end
    return uid.slice(0, UidFactory.MAX_UID_LENGTH);
  }

  /**
   * Create UID for main dashboard
   */
  static main(serviceName: string, instanceId?: string): string {
    return UidFactory.create(`${serviceName}-main`, instanceId);
  }

  /**
   * Create UID for API deep dive dashboard
   */
  static apiDeepDive(serviceName: string, instanceId?: string): string {
    return UidFactory.create(`${serviceName}-api-deep-dive`, instanceId);
  }

  /**
   * Create UID for dependencies deep dive dashboard
   */
  static dependenciesDeepDive(serviceName: string, instanceId?: string): string {
    return UidFactory.create(`${serviceName}-deps-deep-dive`, instanceId);
  }
}

