import {
  Home,
  User,
  Calendar,
  Users,
  Bell,
  UserPlus,
  Settings,
  type LucideIcon,
  FileText,
} from "lucide-react";

export interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface MenuConfig {
  common: MenuItem[];
  member: MenuItem[];
  manager: MenuItem[];
  admin: MenuItem[];
}

export const menuConfig: MenuConfig = {
  // 모든 로그인 사용자에게 공통으로 표시되는 메뉴
  common: [
    {
      label: "홈",
      href: "/",
      icon: Home,
    },
  ],

  // MEMBER 권한 사용자에게만 표시되는 메뉴
  member: [
    {
      label: "활동",
      href: "/activities",
      icon: Calendar,
    },
  ],

  // MANAGER 권한 사용자에게만 표시되는 메뉴
  manager: [
    {
      label: "학회원 관리",
      href: "/manage/members",
      icon: Users,
    },
    {
      label: "신청서 관리",
      href: "/manage/forms",
      icon: FileText,
    },
    {
      label: "공지 관리",
      href: "/manage/notices",
      icon: Bell,
    },
    {
      label: "모집 관리",
      href: "/manage/recruitments",
      icon: UserPlus,
    },
    {
      label: "활동 관리",
      href: "/manage/activities",
      icon: Calendar,
    },
  ],

  // ADMIN 권한 사용자에게만 표시되는 메뉴
  admin: [
    {
      label: "시스템 관리",
      href: "/admin",
      icon: Settings,
    },
  ],
};

/**
 * Role에 따라 표시할 메뉴 목록을 반환
 * 권한 누적 방식: ADMIN은 MANAGER 메뉴도 볼 수 있음
 */
export function getMenuByRole(
  role: "ADMIN" | "MANAGER" | "MEMBER" | "GUEST",
): MenuItem[] {
  const menus: MenuItem[] = [];

  if (role === "GUEST") {
    return [];
  }

  // 공통 메뉴는 모든 로그인 사용자에게 표시
  menus.push(...menuConfig.common);

  // MEMBER 이상의 권한
  if (role === "MEMBER" || role === "MANAGER" || role === "ADMIN") {
    menus.push(...menuConfig.member);
  }

  // MANAGER 이상의 권한
  if (role === "MANAGER" || role === "ADMIN") {
    menus.push(...menuConfig.manager);
  }

  // ADMIN 전용
  if (role === "ADMIN") {
    menus.push(...menuConfig.admin);
  }

  return menus;
}
