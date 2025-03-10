import { Pool } from "pg";

//** Variant should be a const string enum **/
const databaseConnectionTesterBuilder = (
  pool: Pool,
  variant: string,
  variantMessages: Record<string, { success: string; failure: string }>,
) => {
  // const variantMessages = {
  //   [DatabaseVariantNameEnum.app]: {
  //     success: "App database connection can be established",
  //     failure: "Failed to connect to app database",
  //   },
  //   [DatabaseVariantNameEnum.dataWarehouse]: {
  //     success: "Data warehouse database connection can be established",
  //     failure: "Failed to connect to data warehouse database",
  //   },
  // };

  return async () => {
    try {
      const client = await pool.connect();
      client.release();
      return {
        success: true,
        error: null,
        message: variantMessages[variant].success,
      };
    } catch (error) {
      if (!(error instanceof Object)) {
        throw new Error(variantMessages[variant].failure);
      }
      return {
        success: false,
        error,
        message: variantMessages[variant].failure,
      };
    }
  };
};

export { databaseConnectionTesterBuilder };
