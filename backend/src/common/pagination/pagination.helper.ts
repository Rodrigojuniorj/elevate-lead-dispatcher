import type { BaseFilterDto } from '../dto/base-filter.dto.js';
import type { BaseFilterResponseDto } from '../dto/base-filter-response.dto.js';

export async function paginate<T>(
  filter: BaseFilterDto,
  find: (skip: number, take: number) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<BaseFilterResponseDto<T>> {
  const [content, totalElements] = await Promise.all([
    find(filter.pageNumber * filter.pageSize, filter.pageSize),
    count(),
  ]);
  return {
    content,
    numberOfElements: content.length,
    pageNumber: filter.pageNumber,
    pageSize: filter.pageSize,
    totalElements,
    totalPages: Math.ceil(totalElements / filter.pageSize),
  };
}
