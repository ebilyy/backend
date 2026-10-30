export const FILES_FIELD = 'files';

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Файли буферизуються в пам'яті, тож один запит тримає до
// MAX_FILES_PER_REQUEST × MAX_FILE_SIZE_MB мегабайт.
export const MAX_FILES_PER_REQUEST = 10;
