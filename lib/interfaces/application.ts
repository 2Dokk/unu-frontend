export type ApplicationAnswers = Record<string, string | string[]>;

export interface ApplicationRequest {
  recruitmentId: string;
  formId: string;
  name: string;
  studentId: string;
  major: string;
  subMajor?: string;
  email: string;
  githubId?: string;
  phoneNumber: string;
  password?: string;
  answers: ApplicationAnswers;
}

export interface ApplicationResponse {
  id: string;
  recruitmentId: string;
  formId: string;
  formSnapshot: string | Record<string, unknown>;
  name: string;
  studentId: string;
  major: string;
  subMajor: string | null;
  email: string;
  githubId: string | null;
  phoneNumber: string;
  answers: string | ApplicationAnswers;
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

export interface ApplicationLookupResponse {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface ApplicationVerificationResponse {
  application: ApplicationResponse;
  accessToken: string;
}
