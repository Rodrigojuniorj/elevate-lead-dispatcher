export class BaseFilterResponseDto<T> {
  content!: T[];
  numberOfElements!: number;
  pageNumber!: number;
  pageSize!: number;
  totalElements!: number;
  totalPages!: number;
}
