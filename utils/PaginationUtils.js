"use strict";
/**
 * 分页工具函数
 * Utility functions for pagination calculations and operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalPages = calculateTotalPages;
exports.calculateOffset = calculateOffset;
exports.getPageItems = getPageItems;
exports.getPaginationNavInfo = getPaginationNavInfo;
/**
 * 计算总页数
 * Calculate total number of pages based on total items and items per page
 * @param totalItems - 总项目数
 * @param itemsPerPage - 每页项目数
 * @returns 总页数
 */
function calculateTotalPages(totalItems, itemsPerPage) {
    if (totalItems <= 0) {
        return 1; // At least one page should exist even if there are no items
    }
    if (itemsPerPage <= 0) {
        throw new Error('Items per page must be greater than 0');
    }
    return Math.ceil(totalItems / itemsPerPage);
}
/**
 * 计算偏移量
 * Calculate the starting index for a given page
 * @param page - 当前页码 (从1开始)
 * @param itemsPerPage - 每页项目数
 * @returns 偏移量 (起始索引)
 */
function calculateOffset(page, itemsPerPage) {
    if (page < 1) {
        throw new Error('Page number must be at least 1');
    }
    return (page - 1) * itemsPerPage;
}
/**
 * 切片文章列表
 * Slice an array of articles for a specific page
 * @param items - 文章数组
 * @param page - 当前页码 (从1开始)
 * @param itemsPerPage - 每页项目数
 * @returns 当前页面的文章数组
 */
function getPageItems(items, page, itemsPerPage) {
    if (page < 1) {
        throw new Error('Page number must be at least 1');
    }
    if (itemsPerPage <= 0) {
        throw new Error('Items per page must be greater than 0');
    }
    const offset = calculateOffset(page, itemsPerPage);
    return items.slice(offset, offset + itemsPerPage);
}
function getPaginationNavInfo(currentPage, totalPages, maxVisiblePages = 5) {
    if (currentPage < 1) {
        currentPage = 1;
    }
    if (totalPages < 1) {
        totalPages = 1;
    }
    // Limit current page to the total pages
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    const isFirstPage = currentPage === 1;
    const isLastPage = currentPage === totalPages;
    const hasPrevPage = !isFirstPage;
    const hasNextPage = !isLastPage;
    const prevPage = hasPrevPage ? currentPage - 1 : null;
    const nextPage = hasNextPage ? currentPage + 1 : null;
    // Calculate which page numbers to display
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }
    return {
        currentPage,
        totalPages,
        isFirstPage,
        isLastPage,
        hasPrevPage,
        hasNextPage,
        prevPage,
        nextPage,
        pageNumbers
    };
}
//# sourceMappingURL=PaginationUtils.js.map