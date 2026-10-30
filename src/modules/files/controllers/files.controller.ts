import {
  Controller,
  Get,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiPayloadTooLargeResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiPaginatedResponse,
  PaginationQueryDto,
} from '../../../common/pagination';
import { FileUpload } from '../entities/file-upload.entity';
import {
  FILES_FIELD,
  MAX_FILE_SIZE_MB,
  MAX_FILES_PER_REQUEST,
} from '../files.constants';
import { FilesUploadInterceptor } from '../interceptors/files-upload.interceptor';
import { FilesService } from '../services/files.service';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiPaginatedResponse(FileUpload)
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.filesService.findAll(pagination);
  }

  @Post()
  @UseInterceptors(FilesUploadInterceptor)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [FILES_FIELD],
      properties: {
        [FILES_FIELD]: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          maxItems: MAX_FILES_PER_REQUEST,
          description: `До ${MAX_FILES_PER_REQUEST} файлів, кожен до ${MAX_FILE_SIZE_MB} МБ`,
        },
      },
    },
  })
  @ApiCreatedResponse({ type: FileUpload, isArray: true })
  @ApiConflictResponse({
    description:
      'Файл із таким самим вмістом вже завантажено або повторюється в запиті',
  })
  @ApiPayloadTooLargeResponse({
    description: `Файл більший за ${MAX_FILE_SIZE_MB} МБ`,
  })
  upload(@UploadedFiles() files: Express.Multer.File[] | undefined) {
    return this.filesService.upload(files);
  }
}
