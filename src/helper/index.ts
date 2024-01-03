interface PaginationOffset {
  limit: number;
  offset: number;
  pagenumber: number;
}

export interface PaginationInterface<T> {
  total: number;
  recordPerPage: number;
  currentPage: number;
  totalPages: number;
  nextPage: number | null;
  remainingCount: number;
  data: T;
}

export function getPaginateOffset(
  pageNumber: number,
  recordPerPage: number,
): PaginationOffset {
  const pagenumber = pageNumber ? Number(pageNumber) : 1;
  const limit = recordPerPage ? Number(recordPerPage) : 10;
  const offset = (pagenumber - 1) * limit;
  return { limit, offset, pagenumber };
}

export function createPagination<T>(
  totalRecord: number,
  pageNumber: number,
  recordPerPage: number,
  data: T[],
): PaginationInterface<T[]> {
  let remainingCount =
    totalRecord - ((pageNumber - 1) * recordPerPage + data.length);
  remainingCount = remainingCount >= 0 ? remainingCount : 0;
  const result: PaginationInterface<T[]> = {
    total: totalRecord,
    currentPage: pageNumber,
    recordPerPage,
    totalPages: Math.ceil(totalRecord / recordPerPage),
    nextPage: remainingCount ? pageNumber + 1 : 0,
    remainingCount,
    data,
  };

  return result;
}
