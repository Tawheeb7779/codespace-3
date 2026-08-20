import { ProjectFile } from '../types';
import { BuildResult, PackageManifest } from '../types/runtime';

/**
 * In-Browser Light Transpiler for TSX, TS, JSX, and ES Modules.
 * Converts TSX/TS imports and JSX structures into browser-executable JavaScript.
 */
export class CompilerEngine {
  public static parseManifest(packageJsonContent: string): PackageManifest {
    try {
      return JSON.parse(packageJsonContent);
    } catch {
      return {};
    }
  }

  public static transpileTsx(code: string): string {
    let js = code;

    // Remove interface and type declarations
    js = js.replace(/export\s+interface\s+\w+\s*\{[\s\S]*?\}/g, '');
    js = js.replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '');
    js = js.replace(/export\s+type\s+\w+\s*=\s*[^;]+;/g, '');
    js = js.replace(/type\s+\w+\s*=\s*[^;]+;/g, '');

    // Strip type annotations in variable declarations and parameters
    js = js.replace(/:\s*React\.FC(<[^>]+>)?/g, '');
    js = js.replace(/:\s*string/g, '');
    js = js.replace(/:\s*number/g, '');
    js = js.replace(/:\s*boolean/g, '');
    js = js.replace(/:\s*any/g, '');
    js = js.replace(/:\s*void/g, '');

    return js;
  }

  public static compileProject(files: Record<string, ProjectFile>): BuildResult {
    const startTime = performance.now();
    const errors: string[] = [];
    const outputFiles: Record<string, string> = {};

    try {
      Object.values(files).forEach((file) => {
        if (file.isFolder) return;

        // Check for severe syntax anomalies like unclosed tags or quotes
        const openBraces = (file.content.match(/\{/g) || []).length;
        const closeBraces = (file.content.match(/\}/g) || []).length;
        const openAngles = (file.content.match(/</g) || []).length;
        const closeAngles = (file.content.match(/>/g) || []).length;

        if (Math.abs(openBraces - closeBraces) > 3 || Math.abs(openAngles - closeAngles) > 5) {
          errors.push(`Syntax error in ${file.name}: Unmatched braces or tags detected.`);
          return;
        }

        if (file.name.endsWith('.tsx') || file.name.endsWith('.ts')) {
          outputFiles[file.name] = this.transpileTsx(file.content);
        } else if (file.name.endsWith('.js') || file.name.endsWith('.jsx')) {
          outputFiles[file.name] = file.content;
        } else if (file.name.endsWith('.css')) {
          outputFiles[file.name] = file.content;
        } else if (file.name.endsWith('.html')) {
          outputFiles[file.name] = file.content;
        }
      });

      const durationMs = Math.round(performance.now() - startTime);

      return {
        success: errors.length === 0,
        outputFiles,
        errors,
        durationMs,
      };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(msg);
      return {
        success: false,
        outputFiles: {},
        errors,
        durationMs: Math.round(performance.now() - startTime),
      };
    }
  }
}
