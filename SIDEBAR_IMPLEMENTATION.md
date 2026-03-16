# JWT Role 기반 Sidebar 구현

Next.js App Router + shadcn/ui를 사용한 JWT role 기반 vertical sidebar 구현입니다.

## 📦 설치된 라이브러리

이미 프로젝트에 설치되어 있습니다:

- `jwt-decode` (v4.0.0)
- `js-cookie`
- `shadcn/ui` 컴포넌트들

추가 설치가 필요한 경우:

```bash
pnpm add jwt-decode js-cookie
pnpm add -D @types/js-cookie
```

## 📁 파일 구조

```
components/
  layout/
    Sidebar.tsx          # Sidebar 컴포넌트
hooks/
  useUserRole.ts         # Role 판별 커스텀 훅
lib/
  constants/
    menu-config.ts       # 메뉴 설정
```

## 🔑 JWT 구조

이 구현은 다음과 같은 JWT payload 구조를 전제로 합니다:

```json
{
  "sub": "user@example.com",
  "roles": ["ADMIN", "MANAGER"],
  "exp": 1234567890
}
```

- `roles`: string[] - 사용자의 권한 배열
- JWT는 cookie에 "token" 이름으로 저장
- 서명 검증 없이 decode만 수행 (UI 분기 목적)

## 👥 Role 체계

### Role 우선순위

```
ADMIN > MANAGER > MEMBER > GUEST
```

### Role별 메뉴 권한

**GUEST** (비로그인)

- Sidebar 표시 안 함

**MEMBER**

- ✅ 홈 (/)
- ✅ 내 정보 (/mypage)
- ✅ 활동 (/activities)

**MANAGER** (MEMBER 권한 포함)

- ✅ 학회원 관리 (/members)
- ✅ 공지 관리 (/notices)
- ✅ 모집 관리 (/recruitments)
- ✅ 활동 관리 (/activities)

**ADMIN** (MANAGER 권한 포함)

- ✅ 시스템 관리 (/admin)

## 🚀 사용 방법

### 1. Layout에서 Sidebar 적용

#### 방법 A: SidebarLayout 래퍼 사용 (권장)

```tsx
// app/(main)/layout.tsx
import { SidebarLayout } from "@/components/layout/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
```

#### 방법 B: Sidebar 직접 배치

```tsx
// app/(main)/layout.tsx
"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRole = useUserRole();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className={cn("flex-1", userRole !== "GUEST" && "ml-64")}>
        {children}
      </main>
    </div>
  );
}
```

### 2. 커스텀 훅 사용

```tsx
"use client";

import { useUserRole, useHasRole } from "@/hooks/useUserRole";

export function MyComponent() {
  const userRole = useUserRole(); // "ADMIN" | "MANAGER" | "MEMBER" | "GUEST"
  const isAdmin = useHasRole("ADMIN");
  const canManage = useHasRole("MANAGER");

  return (
    <div>
      <p>현재 권한: {userRole}</p>

      {isAdmin && <AdminPanel />}
      {canManage && <ManagerPanel />}
    </div>
  );
}
```

### 3. 메뉴 설정 커스터마이징

```tsx
// lib/constants/menu-config.ts

// 아이콘 추가
import { FileText } from "lucide-react";

export const menuConfig: MenuConfig = {
  manager: [
    // ... 기존 메뉴
    {
      label: "문서 관리",
      href: "/documents",
      icon: FileText,
    },
  ],
};
```

## 🔒 보안 주의사항

### ⚠️ 중요: 이것은 UI 분기용입니다

```typescript
// ❌ 잘못된 사용 - 보안에 의존
function deleteUser() {
  if (useUserRole() === "ADMIN") {
    // 프론트엔드 role은 조작 가능하므로 신뢰할 수 없음!
    api.deleteUser();
  }
}

// ✅ 올바른 사용 - UI 분기만
function AdminButton() {
  const isAdmin = useHasRole("ADMIN");

  // UI만 숨김, 실제 권한 검증은 백엔드에서!
  if (!isAdmin) return null;

  return <Button onClick={handleDelete}>삭제</Button>;
}
```

### 백엔드에서 필수 권한 검증

```java
// 백엔드에서 반드시 권한 검증
@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/users/{id}")
public void deleteUser(@PathVariable Long id) {
    userService.delete(id);
}
```

## 🎨 스타일 커스터마이징

### Sidebar 너비 조정

```tsx
// components/layout/Sidebar.tsx
<aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r bg-background">
  {/* w-64 → w-72로 변경 */}
</aside>

// SidebarLayout
<main className={cn("flex-1", userRole !== "GUEST" && "ml-72")}>
  {/* ml-64 → ml-72로 동일하게 변경 */}
</main>
```

### 다크모드 대응

shadcn/ui는 기본적으로 다크모드를 지원합니다. 추가 설정 불필요.

### Active 메뉴 스타일 변경

```tsx
<Button
  variant={isCurrentQuarterActive ? "default" : "ghost"}  // secondary → default
  className={cn(
    "w-full justify-start",
    isCurrentQuarterActive && "bg-primary text-primary-foreground"  // 커스텀 스타일
  )}
>
```

## 🧪 테스트 가이드

### Role 테스트 방법

1. 브라우저 개발자 도구 열기
2. Application > Cookies > token 수정
3. JWT payload 예시:

```javascript
// ADMIN role 테스트
// https://jwt.io 에서 생성
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZXMiOlsiQURNSU4iXSwiZXhwIjoyMDAwMDAwMDAwfQ...";
document.cookie = `token=${token}; path=/`;
location.reload();
```

### Hydration Error 방지

useEffect 내에서 role을 판별하므로 hydration mismatch가 발생하지 않습니다.

## 📋 체크리스트

### 구현 완료 항목

- ✅ JWT decode 로직 (useUserRole 훅)
- ✅ Role 우선순위 처리 (ADMIN > MANAGER > MEMBER)
- ✅ Role별 메뉴 설정 (menu-config.ts)
- ✅ shadcn/ui 기반 Sidebar 컴포넌트
- ✅ Active 메뉴 강조
- ✅ Hydration error 방지
- ✅ TypeScript 완전 타입 지원
- ✅ Token 없는 경우 fallback (GUEST)
- ✅ Token 만료 체크

### 추가 고려사항

- [ ] 모바일 반응형 (Sheet 컴포넌트 활용)
- [ ] Sidebar 접기/펼치기 기능
- [ ] 로그아웃 버튼 추가
- [ ] 사용자 프로필 표시
- [ ] 메뉴 그룹핑/섹션 구분

## 🔄 현재 프로젝트 통합

현재 프로젝트는 NavigationBar(상단 바)를 사용하고 있습니다.

### 옵션 1: Sidebar로 전환

```tsx
// app/(main)/layout.tsx
import { SidebarLayout } from "@/components/layout/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <SidebarLayout>{children}</SidebarLayout>;
}
```

### 옵션 2: NavigationBar와 병행

```tsx
// app/(main)/layout.tsx
import { NavigationBar } from "@/components/custom/navigation-bar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useUserRole } from "@/hooks/useUserRole";

export default function Layout({ children }: { children: React.ReactNode }) {
  const userRole = useUserRole();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={cn("flex-1 flex flex-col", userRole !== "GUEST" && "ml-64")}
      >
        <NavigationBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
```

## 📞 문의

구현 관련 문의사항이 있으면 이슈를 등록해주세요.
