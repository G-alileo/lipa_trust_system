import React, { useState, useMemo } from "react";
import { Button, Card, Input } from "./base";

export function DataTable({
    columns,
    data,
    loading = false,
    emptyMessage = "No data available",
    pagination = null,
    onPageChange = null,
    sortable = false,
    onSort = null,
    initialSort = null,
    searchable = false,
    filterable = false,
    searchPlaceholder = "Search...",
    className = ""
}) {
    const [sortConfig, setSortConfig] = useState(initialSort || { key: null, direction: 'asc' });
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState({});

    const processedData = useMemo(() => {
        let result = [...data];

        if (searchable && searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(row => {
                return columns.some(column => {
                    const value = row[column.key];
                    if (value == null) return false;
                    return String(value).toLowerCase().includes(query);
                });
            });
        }

        if (filterable) {
            Object.entries(filters).forEach(([columnKey, filterValue]) => {
                if (filterValue && filterValue !== 'all') {
                    result = result.filter(row => {
                        const value = row[columnKey];
                        return String(value).toLowerCase() === String(filterValue).toLowerCase();
                    });
                }
            });
        }

        return result;
    }, [data, searchQuery, filters, columns, searchable, filterable]);

    const handleSort = (columnKey) => {
        if (!sortable || !onSort) return;

        let direction = 'asc';
        if (sortConfig.key === columnKey && sortConfig.direction === 'asc') {
            direction = 'desc';
        }

        const newSortConfig = { key: columnKey, direction };
        setSortConfig(newSortConfig);
        onSort(newSortConfig);
    };

    const handleFilterChange = (columnKey, value) => {
        setFilters(prev => ({
            ...prev,
            [columnKey]: value
        }));
    };

    const getSortIcon = (columnKey) => {
        if (!sortable || sortConfig.key !== columnKey) {
            return <span className="sort-icon sort-icon-inactive">SORT</span>;
        }

        return sortConfig.direction === 'asc'
            ? <span className="sort-icon sort-icon-asc">UP</span>
            : <span className="sort-icon sort-icon-desc">DOWN</span>;
    };

    const getFilterOptions = (columnKey) => {
        const uniqueValues = [...new Set(
            data
                .map(row => row[columnKey])
                .filter(value => value != null)
                .map(value => String(value))
        )].sort();

        return [
            { value: 'all', label: 'All' },
            ...uniqueValues.map(value => ({
                value: value.toLowerCase(),
                label: value
            }))
        ];
    };

    const clearFilters = () => {
        setSearchQuery("");
        setFilters({});
    };

    const hasActiveFilters = searchQuery.trim() || Object.keys(filters).some(key => filters[key] && filters[key] !== 'all');

    return (
        <Card className={`p-0 overflow-hidden ${className}`}>
            {/* Search and Filter Header */}
            {(searchable || filterable) && (
                <div className="p-4 border-b border-ink-200 bg-ink-50">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        <div className="flex-1 max-w-md">
                            {searchable && (
                                <Input
                                    type="text"
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full"
                                />
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {filterable && (
                                <div className="flex gap-2 flex-wrap">
                                    {columns
                                        .filter(col => col.filterable)
                                        .map(column => (
                                            <select
                                                key={column.key}
                                                value={filters[column.key] || 'all'}
                                                onChange={(e) => handleFilterChange(column.key, e.target.value)}
                                                className="input text-sm py-1 px-2 min-w-20"
                                            >
                                                {getFilterOptions(column.key).map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        ))
                                    }
                                </div>
                            )}

                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-ink-500 hover:text-ink-700"
                                >
                                    Clear
                                </Button>
                            )}

                            <div className="text-sm text-muted">
                                {processedData.length} of {data.length} items
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead className="bg-ink-900 text-white text-left">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="p-4">
                                    {sortable && col.sortable !== false ? (
                                        <button
                                            className="flex items-center gap-2 font-semibold text-sm cursor-pointer hover:text-ink-200 transition-colors w-full text-left"
                                            onClick={() => handleSort(col.key)}
                                            style={{ whiteSpace: "nowrap", width: col.width || "auto" }}
                                        >
                                            <span>{col.header}</span>
                                            {getSortIcon(col.key)}
                                        </button>
                                    ) : (
                                        <div
                                            className="font-semibold text-sm"
                                            style={{ whiteSpace: "nowrap", width: col.width || "auto" }}
                                        >
                                            {col.header}
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="p-16 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="btn-spinner"></div>
                                        <span className="text-muted">Loading...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : processedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="p-16 text-center">
                                    <div className="empty-state">
                                        {hasActiveFilters ? (
                                            <>
                                                <div className="text-2xl mb-2"></div>
                                                <h3 className="text-lg font-semibold mb-2">No matching results</h3>
                                                <p className="mb-4">Try adjusting your search or filter criteria</p>
                                                <Button variant="ghost" size="sm" onClick={clearFilters}>
                                                    Clear filters
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="text-2xl mb-2"></div>
                                                <p className="text-muted">{emptyMessage}</p>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            processedData.map((row, rowIdx) => (
                                <tr
                                    key={row.id || rowIdx}
                                    className="border-b border-ink-200 hover:bg-ink-50 transition-colors"
                                >
                                    {columns.map((col, colIdx) => (
                                        <td key={colIdx} className="p-4 align-middle text-sm">
                                            {col.render ? col.render(row[col.key], row) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && (
                <div className="flex justify-between items-center p-4 border-t border-ink-200 bg-ink-100">
                    <span className="text-muted text-sm">
                        Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
                        {hasActiveFilters && ` (${processedData.length} filtered)`}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.offset === 0}
                            onClick={() => onPageChange && onPageChange(Math.max(0, pagination.offset - pagination.limit))}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.offset + pagination.limit >= pagination.total}
                            onClick={() => onPageChange && onPageChange(pagination.offset + pagination.limit)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </Card>
    );
}
