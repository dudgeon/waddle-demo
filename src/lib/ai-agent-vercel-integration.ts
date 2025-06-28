import { createVercelAgent } from './vercel-agent';
import { createVercelCLI } from './vercel-cli-helper';

/**
 * AI Agent integration with Vercel for automated deployments
 * Based on the Vercel AI Agents guide: https://vercel.com/guides/ai-agents
 */
export class AIAgentVercelIntegration {
  private vercelAgent: ReturnType<typeof createVercelAgent>;
  private vercelCLI: ReturnType<typeof createVercelCLI>;

  constructor() {
    this.vercelAgent = createVercelAgent();
    this.vercelCLI = createVercelCLI();
  }

  /**
   * Agent workflow: Create and deploy a project
   */
  async createAndDeployProject(
    projectName: string,
    framework: "nextjs" | "vite" | "react" | "static" = "vite"
  ) {
    try {
      console.log(`🤖 AI Agent: Creating project "${projectName}" with framework "${framework}"`);

      // Step 1: Create project via SDK
      const project = await this.vercelAgent.createProject(projectName, framework);
      console.log(`✅ Project created:`, project);

      // Step 2: Deploy using CLI (more reliable for file uploads)
      const deployment = await this.vercelCLI.deploy({
        name: projectName,
        yes: true,
        logs: true,
      });

      if (deployment.success) {
        console.log(`🚀 Deployment successful:`, deployment.output);
        
        // Step 3: Generate claim URL for user to take ownership
        const claimUrl = this.vercelAgent.generateClaimUrl(
          `${projectName}-claim-${Date.now()}`,
          `${window.location.origin}/claim-success`
        );
        
        return {
          success: true,
          project,
          deployment,
          claimUrl,
          message: `Project "${projectName}" created and deployed successfully!`,
        };
      } else {
        throw new Error(`Deployment failed: ${deployment.error}`);
      }
    } catch (error) {
      console.error("❌ AI Agent deployment failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Agent workflow: List and manage existing projects
   */
  async manageExistingProjects() {
    try {
      console.log("🤖 AI Agent: Fetching existing projects...");

      // Get projects via SDK
      const projects = await this.vercelAgent.listProjects();
      
      // Also get CLI view for comparison
      const cliProjects = await this.vercelCLI.listProjects();

      return {
        success: true,
        sdkProjects: projects,
        cliOutput: cliProjects.output,
        message: `Found ${projects?.projects?.length || 0} projects`,
      };
    } catch (error) {
      console.error("❌ Failed to manage projects:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Agent workflow: Monitor deployment status
   */
  async monitorDeployment(deploymentId: string) {
    try {
      console.log(`🤖 AI Agent: Monitoring deployment ${deploymentId}...`);

      const deployment = await this.vercelAgent.getDeployment(deploymentId);
      
      return {
        success: true,
        deployment,
        status: deployment?.readyState || 'unknown',
        url: deployment?.url,
      };
    } catch (error) {
      console.error("❌ Failed to monitor deployment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Agent workflow: Set up environment variables for a project
   */
  async setupEnvironmentVariables(envVars: Record<string, string>) {
    try {
      console.log("🤖 AI Agent: Setting up environment variables...");

      const results = [];
      for (const [key, value] of Object.entries(envVars)) {
        const result = await this.vercelCLI.setEnvVar(key, value, "production");
        results.push({ key, success: result.success, output: result.output });
      }

      return {
        success: true,
        results,
        message: `Set up ${results.length} environment variables`,
      };
    } catch (error) {
      console.error("❌ Failed to set up environment variables:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Agent workflow: Complete project setup with fluid compute optimization
   */
  async setupFluidComputeProject(
    projectName: string,
    envVars: Record<string, string> = {}
  ) {
    try {
      console.log(`🤖 AI Agent: Setting up fluid compute project "${projectName}"...`);

      // Step 1: Create and deploy
      const deployment = await this.createAndDeployProject(projectName, "vite");
      
      if (!deployment.success) {
        throw new Error(`Deployment failed: ${deployment.error}`);
      }

      // Step 2: Set up environment variables
      const envSetup = await this.setupEnvironmentVariables({
        NODE_ENV: "production",
        VERCEL_ANALYTICS_ID: process.env.VERCEL_ANALYTICS_ID || "",
        ...envVars,
      });

      // Step 3: Link project for future operations
      await this.vercelCLI.link();

      return {
        success: true,
        deployment,
        envSetup,
        message: `Fluid compute project "${projectName}" is ready with optimized performance!`,
        recommendations: [
          "Enable Vercel Analytics for performance monitoring",
          "Use `after()` or `waitUntil()` for background tasks",
          "Consider using Upstash Redis for ephemeral storage",
          "Set up Inngest for complex workflows",
        ],
      };
    } catch (error) {
      console.error("❌ Fluid compute setup failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

// Factory function for easy instantiation
export function createAIAgentVercelIntegration(): AIAgentVercelIntegration {
  return new AIAgentVercelIntegration();
}

// Example usage types
export interface DeploymentResult {
  success: boolean;
  project?: any;
  deployment?: any;
  claimUrl?: string;
  message?: string;
  error?: string;
}

export interface ProjectManagementResult {
  success: boolean;
  sdkProjects?: any;
  cliOutput?: string;
  message?: string;
  error?: string;
} 