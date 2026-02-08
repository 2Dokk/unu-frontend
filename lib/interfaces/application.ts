export interface ApplicationRequest {
  recruitmentId: number;
  formId: number;
  name: string;
  studentId: string;
  major: string;
  subMajor?: string;
  email: string;
  githubId?: string;
  phoneNumber: string;
  password: string;
  answers: Record<string, any>;
}

export interface ApplicationResponse {
  id: number;
  recruitmentId: number;
  formId: number;
  formSnapshot: string; // JSON string of form schema snapshot
  name: string;
  studentId: string;
  major: string;
  subMajor: string | null;
  email: string;
  githubId: string | null;
  phoneNumber: string;
  answers: string;
  status: string;
  createdAt: string;
  modifiedAt: string;
}

export interface PasswordRequest {
  password: string;
}

export interface ApplicationReviewRequest {
  status: string;
}

export interface ApplicationSearchQuery {
  name: string;
  email: string;
}
