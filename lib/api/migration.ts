import axiosInstance from "./axiosInstance";

export interface UserMigrationResultDto {
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
}

async function stripBom(file: File): Promise<File> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const hasBom =
    bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
  if (!hasBom) return file;
  return new File([buffer.slice(3)], file.name, { type: file.type });
}

export async function migrateUsers(
  file: File,
): Promise<UserMigrationResultDto> {
  const cleanFile = await stripBom(file);
  const formData = new FormData();
  formData.append("file", cleanFile);

  const response = await axiosInstance.post<UserMigrationResultDto>(
    "/admin/migrations/users",
    formData,
    {
      headers: { "Content-Type": undefined },
      timeout: 60000,
    },
  );
  return response.data;
}
