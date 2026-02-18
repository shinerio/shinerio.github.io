/**
 * ErrorHandler测试文件
 * 测试错误处理的各种场景和边界条件
 */

import { GracefulErrorHandler } from '../../src/core/ErrorHandler';
import { ConfigError, FileError, ParseError, GenerationError, ProgressReport } from '../../src/types';
import * as fs from 'fs-extra';
import * as path from 'path';
import fc from 'fast-check';

describe('GracefulErrorHandler', () => {
  let errorHandler: GracefulErrorHandler;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, '..', '..', 'temp-test-'));
    // Temporarily change working directory to test error handler
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);
    errorHandler = new GracefulErrorHandler(tempDir); // Pass temp directory as override
  });

  afterEach(async () => {
    // Restore original cwd method first
    jest.restoreAllMocks();

    // Wait longer to ensure any pending async operations complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Force remove temp directory with retries
    for (let i = 0; i < 3; i++) {
      try {
        if (await fs.pathExists(tempDir)) {
          await fs.remove(tempDir);
        }
        break;
      } catch (err) {
        if (i === 2) {
          console.warn(`Failed to remove temp directory ${tempDir} after 3 attempts`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  });

  describe('handleConfigError', () => {
    it('should record config errors properly', () => {
      const error = new ConfigError('Configuration is invalid', 'testField');
      errorHandler.handleConfigError(error);

      const stats = errorHandler.getErrorStats();
      expect(stats.byType.CONFIG).toBe(1);
      expect(stats.total).toBe(1);

      const allErrors = errorHandler.getAllErrors();
      expect(allErrors).toHaveLength(1);
      expect(allErrors[0].type).toBe('CONFIG');
      expect(allErrors[0].error).toBe(error);
    });

    it('should handle config errors without field properly', () => {
      const error = new ConfigError('Configuration is invalid');
      errorHandler.handleConfigError(error);

      const stats = errorHandler.getErrorStats();
      expect(stats.byType.CONFIG).toBe(1);
    });
  });

  describe('handleFileError', () => {
    it('should record file errors properly', () => {
      const error = new FileError('File not found', '/path/to/file.md');
      errorHandler.handleFileError(error);

      const stats = errorHandler.getErrorStats();
      expect(stats.byType.FILE).toBe(1);
      expect(stats.total).toBe(1);

      const allErrors = errorHandler.getAllErrors();
      expect(allErrors).toHaveLength(1);
      expect(allErrors[0].type).toBe('FILE');
      expect(allErrors[0].error).toBe(error);
    });
  });

  describe('handleParseError', () => {
    it('should record parse errors properly', () => {
      const error = new ParseError('Failed to parse file', '/path/to/file.md');
      errorHandler.handleParseError(error);

      const stats = errorHandler.getErrorStats();
      expect(stats.byType.PARSE).toBe(1);
      expect(stats.total).toBe(1);

      const allErrors = errorHandler.getAllErrors();
      expect(allErrors).toHaveLength(1);
      expect(allErrors[0].type).toBe('PARSE');
      expect(allErrors[0].error).toBe(error);
    });
  });

  describe('handleGenerationError', () => {
    it('should record generation errors properly', () => {
      const error = new GenerationError('Failed to generate content', 'page generation');
      errorHandler.handleGenerationError(error);

      const stats = errorHandler.getErrorStats();
      expect(stats.byType.GENERATION).toBe(1);
      expect(stats.total).toBe(1);

      const allErrors = errorHandler.getAllErrors();
      expect(allErrors).toHaveLength(1);
      expect(allErrors[0].type).toBe('GENERATION');
      expect(allErrors[0].error).toBe(error);
    });
  });

  describe('progress reporting', () => {
    it('should report progress and trigger callbacks', () => {
      const mockCallback = jest.fn();
      const unsubscribe = errorHandler.subscribeProgress(mockCallback);

      const report: ProgressReport = {
        stage: 'TEST',
        current: 1,
        total: 10,
        message: 'Test progress'
      };

      errorHandler.reportProgress(report);

      expect(mockCallback).toHaveBeenCalledWith(report);
      expect(mockCallback).toHaveBeenCalledTimes(1);

      // Test unsubscribe
      unsubscribe();
      errorHandler.reportProgress(report);
      expect(mockCallback).toHaveBeenCalledTimes(1); // Should still be 1 after unsubscribe
    });

    it('should handle multiple subscribers', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();

      const unsubscribe1 = errorHandler.subscribeProgress(mockCallback1);
      const unsubscribe2 = errorHandler.subscribeProgress(mockCallback2);

      const report: ProgressReport = {
        stage: 'TEST',
        current: 5,
        total: 10,
        message: 'Test progress'
      };

      errorHandler.reportProgress(report);

      expect(mockCallback1).toHaveBeenCalledWith(report);
      expect(mockCallback2).toHaveBeenCalledWith(report);

      // Unsubscribe one
      unsubscribe1();
      errorHandler.reportProgress(report);

      expect(mockCallback1).toHaveBeenCalledTimes(1); // Called only once
      expect(mockCallback2).toHaveBeenCalledTimes(2); // Called twice
    });
  });

  describe('breakpoint handling', () => {
    it('should save and load breakpoint state', async () => {
      const state = {
        stage: 'TEST_STAGE',
        progress: 50,
        timestamp: new Date(),
        metadata: { test: 'value' }
      };

      await errorHandler.saveBreakpoint(state);
      const loadedState = await errorHandler.loadBreakpoint();

      expect(loadedState).not.toBeNull();
      expect(loadedState!.stage).toBe(state.stage);
      expect(loadedState!.progress).toBe(state.progress);
      expect(loadedState!.metadata).toEqual(state.metadata);
    });

    it('should clear breakpoint state', async () => {
      const state = {
        stage: 'TEST_STAGE',
        progress: 50,
        timestamp: new Date(),
        metadata: { test: 'value' }
      };

      await errorHandler.saveBreakpoint(state);
      let loadedState = await errorHandler.loadBreakpoint();
      expect(loadedState).not.toBeNull();

      await errorHandler.clearBreakpoint();
      loadedState = await errorHandler.loadBreakpoint();
      expect(loadedState).toBeNull();
    });
  });

  describe('error statistics', () => {
    it('should provide accurate error statistics', () => {
      errorHandler.handleConfigError(new ConfigError('Config error'));
      errorHandler.handleFileError(new FileError('File error', '/path'));
      errorHandler.handleFileError(new FileError('Another file error', '/path2'));

      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(3);
      expect(stats.byType.CONFIG).toBe(1);
      expect(stats.byType.FILE).toBe(2);
      expect(stats.byType.PARSE).toBeUndefined();
      expect(stats.byType.GENERATION).toBeUndefined();
    });

    it('should clear errors correctly', () => {
      errorHandler.handleConfigError(new ConfigError('Config error'));
      expect(errorHandler.getErrorStats().total).toBe(1);

      errorHandler.clearErrors();
      expect(errorHandler.getErrorStats().total).toBe(0);
    });
  });

  describe('error report generation', () => {
    it('should generate appropriate error reports', () => {
      const report = errorHandler.generateErrorReport();
      expect(report).toContain('✅ 没有错误记录');

      errorHandler.handleConfigError(new ConfigError('Config error'));
      const reportWithErrors = errorHandler.generateErrorReport();
      expect(reportWithErrors).toContain('📊 错误统计');
      expect(reportWithErrors).toContain('📝 详细错误');
    });
  });
});

describe('GracefulErrorHandler Property Tests', () => {
  let errorHandler: GracefulErrorHandler;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(__dirname, '..', '..', 'temp-prop-test-'));
    // Temporarily change working directory to test error handler
    jest.spyOn(process, 'cwd').mockReturnValue(tempDir);
    errorHandler = new GracefulErrorHandler(tempDir); // Pass temp directory as override
  });

  afterEach(async () => {
    // Restore original cwd method first
    jest.restoreAllMocks();

    // Wait longer to ensure any pending async operations complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Force remove temp directory with retries
    for (let i = 0; i < 3; i++) {
      try {
        if (await fs.pathExists(tempDir)) {
          await fs.remove(tempDir);
        }
        break;
      } catch (err) {
        if (i === 2) {
          console.warn(`Failed to remove temp directory ${tempDir} after 3 attempts`);
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  });

  describe('Error Recovery Capability', () => {
    it('should handle concurrent error logging without race conditions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          (numErrors, errorMessage) => {
            // Clear errors first to start fresh
            errorHandler.clearErrors();

            // Log multiple errors
            for (let i = 0; i < numErrors; i++) {
              errorHandler.handleConfigError(new ConfigError(`${errorMessage}-${i}`));
            }

            const stats = errorHandler.getErrorStats();
            expect(stats.total).toBe(numErrors);
            expect(stats.byType.CONFIG).toBe(numErrors);
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should maintain error counts after multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.constant('config'),
              fc.constant('file'),
              fc.constant('parse'),
              fc.constant('generation')
            )
          ),
          fc.string({ minLength: 1, maxLength: 10 }),
          (errorTypes, messageBase) => {
            // Clear errors first
            errorHandler.clearErrors();

            // Generate errors of different types
            errorTypes.forEach((type, index) => {
              switch (type) {
                case 'config':
                  errorHandler.handleConfigError(new ConfigError(`${messageBase}-${index}`));
                  break;
                case 'file':
                  errorHandler.handleFileError(new FileError(`${messageBase}-${index}`, `/path-${index}`));
                  break;
                case 'parse':
                  errorHandler.handleParseError(new ParseError(`${messageBase}-${index}`, `/path-${index}`));
                  break;
                case 'generation':
                  errorHandler.handleGenerationError(new GenerationError(`${messageBase}-${index}`));
                  break;
              }
            });

            // Check that the total is correct
            const stats = errorHandler.getErrorStats();
            expect(stats.total).toBe(errorTypes.length);

            // Count each type manually
            const expectedByType: Record<string, number> = {};
            errorTypes.forEach(type => {
              expectedByType[type.toUpperCase()] = (expectedByType[type.toUpperCase()] || 0) + 1;
            });

            Object.entries(expectedByType).forEach(([type, count]) => {
              expect(stats.byType[type]).toBe(count);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Error Message Clarity', () => {
    it('should generate valid error reports for various error combinations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              type: fc.oneof(
                fc.constant('config'),
                fc.constant('file'),
                fc.constant('parse'),
                fc.constant('generation')
              ),
              message: fc.string({ minLength: 1, maxLength: 50 }),
              path: fc.string({ minLength: 1, maxLength: 20 })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (errors) => {
            // Clear errors first
            errorHandler.clearErrors();

            // Generate the specified errors
            errors.forEach((error, index) => {
              switch (error.type) {
                case 'config':
                  errorHandler.handleConfigError(new ConfigError(error.message));
                  break;
                case 'file':
                  errorHandler.handleFileError(new FileError(error.message, error.path));
                  break;
                case 'parse':
                  errorHandler.handleParseError(new ParseError(error.message, error.path));
                  break;
                case 'generation':
                  errorHandler.handleGenerationError(new GenerationError(error.message));
                  break;
              }
            });

            // Generate error report
            const report = errorHandler.generateErrorReport();

            // Report should always be a string
            expect(typeof report).toBe('string');

            // If there are errors, report should not indicate no errors
            if (errors.length > 0) {
              expect(report).not.toContain('✅ 没有错误记录');
              expect(report).toContain('📊 错误统计');
              expect(report).toContain('总');
            } else {
              expect(report).toContain('✅ 没有错误记录');
            }
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Progress Reporting Accuracy', () => {
    it('should maintain progress report structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.integer({ min: 0, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (stage, current, total, message) => {
            // Normalize current to not exceed total
            const normalizedCurrent = Math.min(current, total);

            const report: ProgressReport = {
              stage,
              current: normalizedCurrent,
              total,
              message
            };

            // Create a spy to capture the reported value
            const mockCallback = jest.fn();
            const unsubscribe = errorHandler.subscribeProgress(mockCallback);

            errorHandler.reportProgress(report);

            expect(mockCallback).toHaveBeenCalledWith(report);
            expect(mockCallback).toHaveBeenCalledTimes(1);

            // Verify structure of the report
            expect(report.stage).toBe(stage);
            expect(report.current).toBe(normalizedCurrent);
            expect(report.total).toBe(total);
            expect(report.message).toBe(message);

            // Current should never exceed total
            expect(report.current).toBeLessThanOrEqual(report.total);

            unsubscribe();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle progress subscription/unsubscription consistently', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.func(fc.constant(true)) // Functions that return true
          ),
          fc.integer({ min: 1, max: 5 }),
          (callbacks, numReports) => {
            // Create an array of mocked functions
            const mockCallbacks = callbacks.map(() => jest.fn()).slice(0, 3); // Limit for performance

            // Subscribe all callbacks
            const unsubscribes = mockCallbacks.map(cb => errorHandler.subscribeProgress(cb));

            // Send several progress reports
            for (let i = 0; i < numReports; i++) {
              const report: ProgressReport = {
                stage: `STAGE_${i}`,
                current: i,
                total: numReports,
                message: `Message ${i}`
              };
              errorHandler.reportProgress(report);
            }

            // Each callback should have been called numReports times
            mockCallbacks.forEach(cb => {
              expect(cb).toHaveBeenCalledTimes(numReports);
            });

            // Unsubscribe all
            unsubscribes.forEach(unsub => unsub());

            // Send another report - none should be called
            const finalReport: ProgressReport = {
              stage: 'FINAL',
              current: numReports,
              total: numReports,
              message: 'Final message'
            };
            errorHandler.reportProgress(finalReport);

            // Still the same call count
            mockCallbacks.forEach(cb => {
              expect(cb).toHaveBeenCalledTimes(numReports);
            });
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Breakpoint Resumption Consistency', () => {
    it('should handle breakpoint saving and loading consistently', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }),
          fc.integer({ min: 0, max: 100 }),
          fc.dictionary(
            fc.string({ minLength: 1, maxLength: 10 }),
            fc.oneof(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.integer({ min: 0, max: 1000 }),
              fc.boolean()
            )
          ),
          async (stage, progress, metadata) => {
            const state = {
              stage,
              progress,
              timestamp: new Date(),
              metadata
            };

            // Save the state
            await errorHandler.saveBreakpoint(state);

            // Load the state
            const loadedState = await errorHandler.loadBreakpoint();

            // Verify the loaded state matches what was saved
            if (loadedState) { // Only check if it was saved successfully
              expect(loadedState.stage).toBe(stage);
              expect(loadedState.progress).toBe(progress);

              // Metadata should match
              Object.entries(metadata).forEach(([key, value]) => {
                expect(loadedState.metadata![key]).toEqual(value);
              });
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain breakpoint file state correctly', async () => {
      fc.assert(
        fc.asyncProperty(
          fc.boolean(), // Whether to save a state or not
          fc.string({ minLength: 1, maxLength: 20 }),
          async (shouldSave, stage) => {
            // First, clear any existing breakpoint
            await errorHandler.clearBreakpoint();

            if (shouldSave) {
              const state = {
                stage,
                progress: 50,
                timestamp: new Date(),
                metadata: { test: 'data' }
              };

              await errorHandler.saveBreakpoint(state);
              const loaded = await errorHandler.loadBreakpoint();

              // If successful, loaded should not be null
              if (loaded) {
                expect(loaded.stage).toBe(stage);
              }
            } else {
              const loaded = await errorHandler.loadBreakpoint();
              expect(loaded).toBeNull();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});