/**
 * 分页工具函数
 * Utility functions for pagination calculations and operations
 */
/**
 * 计算总页数
 * Calculate total number of pages based on total items and items per page
 * @param totalItems - 总项目数
 * @param itemsPerPage - 每页项目数
 * @returns 总页数
 */
export declare function calculateTotalPages(totalItems: number, itemsPerPage: number): number;
/**
 * 计算偏移量
 * Calculate the starting index for a given page
 * @param page - 当前页码 (从1开始)
 * @param itemsPerPage - 每页项目数
 * @returns 偏移量 (起始索引)
 */
export declare function calculateOffset(page: number, itemsPerPage: number): number;
/**
 * 切片文章列表
 * Slice an array of articles for a specific page
 * @param items - 文章数组
 * @param page - 当前页码 (从1开始)
 * @param itemsPerPage - 每页项目数
 * @returns 当前页面的文章数组
 */
export declare function getPageItems<T>(items: T[], page: number, itemsPerPage: number): T[];
/**
 * 获取分页导航信息
 * Get pagination navigation info including current page, total pages, and page numbers to display
 * @param currentPage - 当前页码
 * @param totalPages - 总页数
 * @param maxVisiblePages - 最大可见页码数 (默认 5)
 * @returns 分页导航信息
 */
export interface PaginationNavInfo {
    currentPage: number;
    totalPages: number;
    isFirstPage: boolean;
    isLastPage: boolean;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage: number | null;
    nextPage: number | null;
    pageNumbers: number[];
}
export declare function getPaginationNavInfo(currentPage: number, totalPages: number, maxVisiblePages?: number): PaginationNavInfo;
//# sourceMappingURL=PaginationUtils.d.ts.map