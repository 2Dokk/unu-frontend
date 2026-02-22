export interface UserRoleResponse {
  id: string;
  userId: string;
  role: RoleResponse;
}

export interface RoleResponse {
  id: string;
  name: string;
}

export interface UserRoleUpdateRequestDto {
  userId: string;
  roles: string[];
}
