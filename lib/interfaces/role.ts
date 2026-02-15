export interface UserRoleResponse {
  id: number;
  userId: number;
  role: RoleResponse;
}

export interface RoleResponse {
  id: number;
  name: string;
}
