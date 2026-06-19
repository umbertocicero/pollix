import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsBoolean,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVoteDto {
  @IsUUID()
  pollId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  optionIds: string[];

  @IsOptional()
  @IsBoolean()
  isNotAvailable?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  voterName?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
