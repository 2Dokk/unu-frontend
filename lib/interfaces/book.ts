export interface Book {
  id: string;
  title: string;
  author: string;
  publisher?: string | null;
  description?: string | null;
  quantity: number;
  note?: string | null;
  createdAt: string;
  modifiedAt?: string | null;
}

export interface BookRequest {
  title: string;
  author: string;
  publisher?: string | null;
  description?: string | null;
  quantity: number;
  note?: string | null;
}
