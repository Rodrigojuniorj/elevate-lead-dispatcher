import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';

export function createBaseFilterResponseDto<T>(dtoClass: new () => T) {
  @ApiExtraModels(dtoClass)
  class BaseFilterResponseDtoClass {
    @ApiProperty({ type: 'array', items: { $ref: getSchemaPath(dtoClass) } }) content!: T[];
    @ApiProperty() numberOfElements!: number;
    @ApiProperty() pageNumber!: number;
    @ApiProperty() pageSize!: number;
    @ApiProperty() totalElements!: number;
    @ApiProperty() totalPages!: number;
  }
  return BaseFilterResponseDtoClass;
}
