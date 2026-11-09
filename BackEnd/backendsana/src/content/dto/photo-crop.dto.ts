import { IsNumber, Max, Min } from 'class-validator';

/**
 * Area of the original image shown inside the team member's circular photo.
 * Values are percentages of the original image width (x, width) and height (y, height).
 */
export class PhotoCropDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  x!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  y!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  width!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  height!: number;
}
