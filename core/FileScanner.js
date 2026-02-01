"use strict";
/**
 * 文件扫描器
 * File Scanner for discovering markdown files in Obsidian vault
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScanner = void 0;
const types_1 = require("../types");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const minimatch_1 = require("minimatch");
class FileScanner {
    /**
     * 检查路径是否在黑名单中
     * Check if a path matches any of the blacklist patterns
     */
    matchesBlacklist(filePath, blacklist, vaultPath) {
        if (!blacklist || blacklist.length === 0) {
            return false;
        }
        // Convert both paths to absolute paths before computing relative path
        // This ensures correct matching even when vaultPath is a relative path
        const absoluteFilePath = path.resolve(filePath);
        const absoluteVaultPath = path.resolve(vaultPath);
        // Convert the file path to be relative to the vault for comparison
        const relativePath = path.relative(absoluteVaultPath, absoluteFilePath).replace(/\\/g, '/');
        for (const pattern of blacklist) {
            if (typeof pattern !== 'string') {
                console.warn(`Invalid blacklist pattern (not a string): ${pattern}`);
                continue;
            }
            try {
                // Check if the path matches the pattern - using case-insensitive matching
                if ((0, minimatch_1.minimatch)(relativePath, pattern, { dot: true, nocase: true })) {
                    return true;
                }
                // Also check if the path is within a blacklisted directory
                // For patterns ending with '/', treat as directory
                if (pattern.endsWith('/')) {
                    const normalizedPattern = pattern.slice(0, -1); // Remove trailing slash
                    if ((0, minimatch_1.minimatch)(relativePath, normalizedPattern + '/**', { dot: true, nocase: true }) ||
                        (0, minimatch_1.minimatch)(relativePath, normalizedPattern + '/*', { dot: true, nocase: true })) {
                        return true;
                    }
                }
            }
            catch (error) {
                // If pattern is invalid, we log a warning but continue processing
                console.warn(`Invalid blacklist pattern: ${pattern}`, error);
            }
        }
        return false;
    }
    /**
     * 扫描vault目录
     * Scan vault directory for markdown files
     */
    async scanVault(vaultPath, blacklist = []) {
        const result = {
            files: [],
            errors: [],
            totalSize: 0
        };
        try {
            if (!await fs.pathExists(vaultPath)) {
                throw new types_1.FileError(`Vault路径不存在: ${vaultPath}`, vaultPath);
            }
            const stats = await fs.stat(vaultPath);
            if (!stats.isDirectory()) {
                throw new types_1.FileError(`Vault路径不是目录: ${vaultPath}`, vaultPath);
            }
            await this.scanDirectory(vaultPath, result, blacklist, vaultPath);
        }
        catch (error) {
            if (error instanceof types_1.FileError) {
                result.errors.push({
                    filePath: vaultPath,
                    error: error.message,
                    type: 'not_found'
                });
            }
            else {
                result.errors.push({
                    filePath: vaultPath,
                    error: error instanceof Error ? error.message : String(error),
                    type: 'other'
                });
            }
        }
        return result;
    }
    /**
     * 递归扫描目录
     * Recursively scan directory
     */
    async scanDirectory(dirPath, result, blacklist, vaultPath) {
        // Check if the current directory is blacklisted
        if (this.matchesBlacklist(dirPath, blacklist, vaultPath)) {
            return; // Skip this entire directory if it matches any blacklist pattern
        }
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                try {
                    if (entry.isDirectory()) {
                        // 跳过隐藏目录和特殊目录, but also check if it's blacklisted
                        if (!entry.name.startsWith('.') && entry.name !== 'node_modules' && !this.matchesBlacklist(fullPath, blacklist, vaultPath)) {
                            await this.scanDirectory(fullPath, result, blacklist, vaultPath);
                        }
                    }
                    else if (entry.isFile() && this.isMarkdownFile(fullPath) && !this.matchesBlacklist(fullPath, blacklist, vaultPath)) {
                        const stats = await this.getFileStats(fullPath);
                        result.files.push(fullPath);
                        result.totalSize += stats.size;
                    }
                }
                catch (error) {
                    result.errors.push({
                        filePath: fullPath,
                        error: error instanceof Error ? error.message : String(error),
                        type: this.getErrorType(error)
                    });
                }
            }
        }
        catch (error) {
            result.errors.push({
                filePath: dirPath,
                error: error instanceof Error ? error.message : String(error),
                type: this.getErrorType(error)
            });
        }
    }
    /**
     * 检查是否为markdown文件
     * Check if file is a markdown file
     */
    isMarkdownFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        return FileScanner.MARKDOWN_EXTENSIONS.includes(ext);
    }
    /**
     * 获取文件统计信息
     * Get file statistics
     */
    async getFileStats(filePath) {
        try {
            const stats = await fs.stat(filePath);
            return {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                isDirectory: stats.isDirectory()
            };
        }
        catch (error) {
            throw new types_1.FileError(`无法获取文件统计信息: ${error instanceof Error ? error.message : String(error)}`, filePath);
        }
    }
    /**
     * 确定错误类型
     * Determine error type
     */
    getErrorType(error) {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            if (message.includes('permission') || message.includes('access')) {
                return 'permission';
            }
            if (message.includes('not found') || message.includes('enoent')) {
                return 'not_found';
            }
        }
        return 'other';
    }
}
exports.FileScanner = FileScanner;
FileScanner.MARKDOWN_EXTENSIONS = ['.md', '.markdown'];
//# sourceMappingURL=FileScanner.js.map