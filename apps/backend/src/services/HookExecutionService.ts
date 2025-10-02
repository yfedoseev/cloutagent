import ivm from 'isolated-vm';
import type {
  HookConfig,
  HookExecutionContext,
  HookExecutionResult,
  HookType,
  HookValidationResult,
} from '@cloutagent/types';

export class HookExecutionService {
  private readonly HOOK_TIMEOUT = 5000; // 5 seconds
  private readonly CONDITION_TIMEOUT = 1000; // 1 second for conditions
  private readonly MAX_MEMORY = 128; // 128MB

  async executeHook(
    hook: HookConfig,
    context: HookExecutionContext,
  ): Promise<HookExecutionResult> {
    // Skip if disabled
    if (!hook.enabled) {
      return {
        hookId: hook.id,
        success: true,
        shouldContinue: true,
        output: 'Hook disabled, skipped',
      };
    }

    // Check condition
    if (hook.condition && !(await this.evaluateCondition(hook.condition, context))) {
      return {
        hookId: hook.id,
        success: true,
        shouldContinue: true,
        output: 'Condition not met, skipped',
      };
    }

    try {
      // Create isolated VM
      const isolate = new ivm.Isolate({ memoryLimit: this.MAX_MEMORY });
      const vmContext = await isolate.createContext();

      // Copy context and payload to VM
      await vmContext.global.set(
        'context',
        new ivm.ExternalCopy(context.context).copyInto(),
        { copy: true },
      );
      await vmContext.global.set(
        'payload',
        new ivm.ExternalCopy(context.payload).copyInto(),
        { copy: true },
      );

      // Execute hook code with timeout and capture result
      const script = await isolate.compileScript(`
        (function() {
          ${hook.action.code}
        })()
      `);

      const resultReference = await script.run(vmContext, {
        timeout: this.HOOK_TIMEOUT,
        reference: true,
      });

      // Copy result back to host
      let result: any;
      if (resultReference) {
        result = await resultReference.copy();
      }

      // Get modified context
      const contextReference = await vmContext.global.get('context', {
        reference: true,
      });
      const modifiedContext = contextReference
        ? await contextReference.copy()
        : undefined;

      // Clean up
      vmContext.release();
      isolate.dispose();

      // Check if result indicates to stop
      const shouldContinue =
        typeof result === 'object' && result !== null
          ? result.continue !== false
          : true;

      return {
        hookId: hook.id,
        success: true,
        output: result,
        modifiedContext,
        shouldContinue,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        hookId: hook.id,
        success: false,
        error: errorMessage,
        shouldContinue: true, // Don't halt workflow on hook errors
      };
    }
  }

  async executeHookChain(
    hooks: HookConfig[],
    context: HookExecutionContext,
  ): Promise<HookExecutionResult[]> {
    const results: HookExecutionResult[] = [];
    const currentContext = { ...context };

    // Sort by order
    const sortedHooks = [...hooks].sort((a, b) => a.order - b.order);

    for (const hook of sortedHooks) {
      const result = await this.executeHook(hook, currentContext);
      results.push(result);

      // Update context for next hook
      if (result.modifiedContext) {
        currentContext.context = result.modifiedContext;
      }

      // Stop if hook says not to continue
      if (!result.shouldContinue) {
        break;
      }
    }

    return results;
  }

  validateHookCode(code: string, _type: HookType): HookValidationResult {
    const errors: string[] = [];

    // Check for forbidden operations
    const forbidden = [
      { keyword: 'require', message: 'require() is not allowed' },
      { keyword: 'import', message: 'import statements are not allowed' },
      { keyword: 'eval', message: 'eval() is not allowed' },
      { keyword: 'Function', message: 'Function constructor is not allowed' },
      { keyword: 'process', message: 'process access is not allowed' },
      { keyword: 'global', message: 'global access is not allowed' },
      { keyword: '__dirname', message: 'filesystem access is not allowed' },
      { keyword: '__filename', message: 'filesystem access is not allowed' },
    ];

    forbidden.forEach(({ keyword, message }) => {
      if (code.includes(keyword)) {
        errors.push(message);
      }
    });

    // Try to parse as valid JavaScript
    try {
      // eslint-disable-next-line no-new-func
      new Function(code);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Syntax error: ${errorMessage}`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  private async evaluateCondition(
    condition: string,
    context: HookExecutionContext,
  ): Promise<boolean> {
    try {
      // Create isolated VM for condition
      const isolate = new ivm.Isolate({ memoryLimit: this.MAX_MEMORY });
      const vmContext = await isolate.createContext();

      // Copy context and payload
      await vmContext.global.set(
        'context',
        new ivm.ExternalCopy(context.context).copyInto(),
        { copy: true },
      );
      await vmContext.global.set(
        'payload',
        new ivm.ExternalCopy(context.payload).copyInto(),
        { copy: true },
      );

      // Evaluate condition with timeout
      const script = await isolate.compileScript(`(${condition})`);
      const resultReference = await script.run(vmContext, {
        timeout: this.CONDITION_TIMEOUT,
        reference: true,
      });

      // Copy result back
      let result: any = false;
      if (resultReference) {
        result = await resultReference.copy();
      }

      // Clean up
      vmContext.release();
      isolate.dispose();

      return Boolean(result);
    } catch (error) {
      console.warn(`Condition evaluation failed: ${error}`);
      return false;
    }
  }
}
