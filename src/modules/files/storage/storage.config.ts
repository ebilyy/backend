import { S3ClientConfig } from '@aws-sdk/client-s3';

type EnvReader = (key: string) => string | undefined;

export const STORAGE_OPTIONS = Symbol('STORAGE_OPTIONS');

export interface StorageOptions {
  bucket: string;
  client: S3ClientConfig;
}

/**
 * Налаштування S3-сховища файлів (Garage). Значення за замовчуванням — ті самі,
 * з якими docker-compose піднімає локальний Garage.
 */
export const buildStorageOptions = (get: EnvReader): StorageOptions => ({
  bucket: get('S3_BUCKET') ?? 'schemka-files',
  client: {
    endpoint: get('S3_ENDPOINT') ?? 'http://localhost:3900',
    region: get('S3_REGION') ?? 'garage',
    // Явно, а не через ланцюжок провайдерів SDK: інакше без env-змінних він
    // підхопив би AWS-ключі розробника з ~/.aws.
    credentials: {
      accessKeyId: get('S3_ACCESS_KEY_ID') ?? 'GK8b50826a55467b45c78b4898',
      secretAccessKey:
        get('S3_SECRET_ACCESS_KEY') ??
        'fbac6c55e86bcb83ae5e272d183a6dd90b61492c4cd202a8282141f09a1ce575',
    },
    // Бакет у шляху (/schemka-files/<key>): vhost-адреса schemka-files.<хост>
    // вимагала б DNS-запису на кожен бакет, а його ні локально, ні в Coolify немає.
    forcePathStyle: true,
  },
});
