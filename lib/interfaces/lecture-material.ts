export interface LectureMaterial {
  id: string;
  title: string;
  description: string | null;
  driveUrl: string;
  createdAt: string;
  modifiedAt: string | null;
}

export interface LectureMaterialRequest {
  title: string;
  description: string;
  driveUrl: string;
}
