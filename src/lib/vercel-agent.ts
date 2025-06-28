import { Vercel } from "@vercel/sdk";

export class VercelAgent {
  private vercel: Vercel;
  private teamId?: string;

  constructor(bearerToken: string, teamId?: string) {
    this.vercel = new Vercel({ bearerToken });
    this.teamId = teamId;
  }

  /**
   * Create a deployment using direct API calls
   * Note: For file uploads, use the REST API or CLI as the SDK upload method has type issues
   * @param projectName - Name for the deployment
   * @param framework - Framework type
   * @returns Deployment configuration
   */
  async createDeploymentConfig(
    projectName: string,
    framework: "nextjs" | "vite" | "react" | "static" = "vite"
  ) {
    try {
      // This creates the deployment configuration
      // For actual file uploads, use the REST API or Vercel CLI
      const deploymentConfig = {
        name: `${projectName}-${Date.now().toString(36)}`,
        framework: framework as any,
        teamId: this.teamId,
        projectSettings: {
          framework: framework as any,
        },
      };

      return deploymentConfig;
    } catch (error) {
      console.error("Deployment configuration failed:", error);
      throw error;
    }
  }

  /**
   * List all projects in the team/account
   */
  async listProjects() {
    try {
      const projects = await this.vercel.projects.getProjects({
        teamId: this.teamId,
      });
      return projects;
    } catch (error) {
      console.error("Failed to list projects:", error);
      throw error;
    }
  }

  /**
   * Get deployment status
   */
  async getDeployment(deploymentId: string) {
    try {
      const deployment = await this.vercel.deployments.getDeployment({
        idOrUrl: deploymentId,
        teamId: this.teamId,
      });
      return deployment;
    } catch (error) {
      console.error("Failed to get deployment:", error);
      throw error;
    }
  }

  /**
   * Generate a claim URL for user to take ownership of deployment
   */
  generateClaimUrl(deploymentCode: string, returnUrl?: string): string {
    const baseUrl = "https://vercel.com/claim-deployment";
    const params = new URLSearchParams({ code: deploymentCode });
    if (returnUrl) {
      params.append("returnUrl", returnUrl);
    }
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Create a project programmatically
   */
  async createProject(name: string, framework: "nextjs" | "vite" | "react" | "static" = "vite") {
    try {
      const project = await this.vercel.projects.createProject({
        teamId: this.teamId,
        requestBody: {
          name,
          framework: framework as any,
        },
      });
      return project;
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  }
}

// Factory function to create VercelAgent instance
export function createVercelAgent(): VercelAgent {
  const bearerToken = process.env.VERCEL_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  
  if (!bearerToken) {
    throw new Error("VERCEL_TOKEN environment variable is required");
  }

  return new VercelAgent(bearerToken, teamId);
} 