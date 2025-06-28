import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class VercelCLIHelper {
  private token?: string;
  private teamSlug?: string;

  constructor(token?: string, teamSlug?: string) {
    this.token = token;
    this.teamSlug = teamSlug;
  }

  /**
   * Deploy current directory to Vercel using CLI
   * @param options - Deployment options
   */
  async deploy(options: {
    name?: string;
    prod?: boolean;
    yes?: boolean;
    logs?: boolean;
  } = {}) {
    try {
      const args = ["vercel"];
      
      if (this.token) {
        args.push("--token", this.token);
      }
      
      if (this.teamSlug) {
        args.push("--scope", this.teamSlug);
      }
      
      if (options.name) {
        args.push("--name", options.name);
      }
      
      if (options.prod) {
        args.push("--prod");
      }
      
      if (options.yes) {
        args.push("--yes");
      }
      
      if (options.logs) {
        args.push("--logs");
      }

      const command = args.join(" ");
      console.log(`Executing: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes("Inspect:")) {
        console.warn("Deployment warnings:", stderr);
      }
      
      return {
        success: true,
        output: stdout,
        command,
      };
    } catch (error) {
      console.error("Deployment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        command: "vercel deploy",
      };
    }
  }

  /**
   * Link current directory to existing Vercel project
   */
  async link(projectId?: string) {
    try {
      const args = ["vercel", "link"];
      
      if (this.token) {
        args.push("--token", this.token);
      }
      
      if (projectId) {
        args.push("--project", projectId);
      }
      
      args.push("--yes"); // Auto-confirm
      
      const command = args.join(" ");
      const { stdout, stderr } = await execAsync(command);
      
      return {
        success: true,
        output: stdout,
        warnings: stderr,
      };
    } catch (error) {
      console.error("Link failed:", error);
      throw error;
    }
  }

  /**
   * List Vercel projects
   */
  async listProjects() {
    try {
      const args = ["vercel", "ls"];
      
      if (this.token) {
        args.push("--token", this.token);
      }
      
      if (this.teamSlug) {
        args.push("--scope", this.teamSlug);
      }

      const command = args.join(" ");
      const { stdout } = await execAsync(command);
      
      return {
        success: true,
        output: stdout,
      };
    } catch (error) {
      console.error("Failed to list projects:", error);
      throw error;
    }
  }

  /**
   * Get project info
   */
  async getProjectInfo(projectName: string) {
    try {
      const args = ["vercel", "inspect", projectName];
      
      if (this.token) {
        args.push("--token", this.token);
      }

      const command = args.join(" ");
      const { stdout } = await execAsync(command);
      
      return {
        success: true,
        output: stdout,
      };
    } catch (error) {
      console.error("Failed to get project info:", error);
      throw error;
    }
  }

  /**
   * Set environment variables
   */
  async setEnvVar(key: string, value: string, environment: "production" | "preview" | "development" = "production") {
    try {
      const args = ["vercel", "env", "add", key, environment];
      
      if (this.token) {
        args.push("--token", this.token);
      }
      
      if (this.teamSlug) {
        args.push("--scope", this.teamSlug);
      }

      const command = args.join(" ");
      
      // Use stdin for the value to avoid shell escaping issues
      const { stdout, stderr } = await execAsync(`echo "${value}" | ${command}`);
      
      return {
        success: true,
        output: stdout,
        warnings: stderr,
      };
    } catch (error) {
      console.error("Failed to set environment variable:", error);
      throw error;
    }
  }
}

// Factory function
export function createVercelCLI(): VercelCLIHelper {
  const token = process.env.VERCEL_TOKEN;
  const teamSlug = process.env.VERCEL_TEAM_ID;
  
  return new VercelCLIHelper(token, teamSlug);
} 