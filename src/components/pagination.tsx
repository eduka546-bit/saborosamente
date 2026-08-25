import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
}: PaginationProps) {
  const pages = [];
  const maxPagesToShow = 7;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  if (startPage > 1) {
    pages.push(1);
    if (startPage > 2) {
      pages.push(-1); // Ellipsis
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pages.push(-1); // Ellipsis
    }
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
      <div className="text-xs text-gray-500 font-medium">
        {itemsPerPage && totalItems && (
          <>
            Mostrando <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> a{" "}
            <span className="font-bold">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{" "}
            <span className="font-bold">{totalItems}</span> itens
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft size={16} />
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((page, idx) =>
            page === -1 ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-400">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                className={`h-8 w-8 p-0 text-xs font-bold ${
                  page === currentPage ? "bg-[#5850ec] border-[#5850ec]" : ""
                }`}
              >
                {page}
              </Button>
            ),
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
