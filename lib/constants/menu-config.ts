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
  ClipboardCheck,
  UserRound,
  UserRoundPlus,
  UsersRound,
  Clock,
  Wallet,
} from "lucide-react";

export type MenuItem =
  | {
      label: string;
      href: string;
      icon: LucideIcon;
      type?: "item";
    }
  | {
      type: "separator";
    };

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
      label: "내 활동",
      href: "/home",
      icon: UserRound,
    },
  ],

  // MEMBER 권한 사용자에게만 표시되는 메뉴
  member: [
    {
      label: "모든 활동",
      href: "/activities",
      icon: Calendar,
    },
    {
      label: "학회실 관리",
      href: "/manage/lecture-room",
      icon: Clock,
    },
  ],

  // MANAGER 권한 사용자에게만 표시되는 메뉴
  manager: [
    {
      label: "일정 관리",
      href: "/manage",
      icon: Calendar,
    },
    {
      label: "학회원 관리",
      href: "/manage/members",
      icon: UsersRound,
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
      icon: UserRoundPlus,
    },
    {
      label: "활동 관리",
      href: "/manage/activities",
      icon: Calendar,
    },
    {
      label: "예산 관리",
      href: "/manage/budget",
      icon: Wallet,
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
  role: "ADMIN" | "MANAGER" | "MEMBER" | "GUEST" | "LECTURE_ROOM_MANAGER",
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
    menus.push({ type: "separator" });
    menus.push(...menuConfig.manager);
  }

  // ADMIN 전용
  if (role === "ADMIN") {
    menus.push({ type: "separator" });
    menus.push(...menuConfig.admin);
  }

  return menus;
}
