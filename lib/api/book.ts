import axiosInstance from "./axiosInstance";
import { Book, BookRequest } from "@/lib/interfaces/book";

export async function getBooks(): Promise<Book[]> {
  const response = await axiosInstance.get<Book[]>("/books");
  return response.data;
}

export async function createBook(data: BookRequest): Promise<Book> {
  const response = await axiosInstance.post<Book>("/books", data);
  return response.data;
}

export async function updateBook(id: string, data: BookRequest): Promise<Book> {
  const response = await axiosInstance.put<Book>(`/books/${id}`, data);
  return response.data;
}

export async function deleteBook(id: string): Promise<void> {
  await axiosInstance.delete(`/books/${id}`);
}
