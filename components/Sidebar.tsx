"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { setSidebarCollapsed, sortedPages, useSidebarCollapsed, type Page } from "@/lib/store";

const NAV = [
  { href: "/workspace", label: "내 업무", icon: "layout-list" },
  { href: "/me", label: "마이 페이지", icon: "user" },
];

/** 업무 · 글 상세 왼쪽 사이드바. 버튼 하나로 접기(아이콘 띠) ↔ 펼치기. */
export function Sidebar({ pages }: { pages: Page[] }) {
  const pathname = usePathname();
  const collapsed = useSidebarCollapsed();
  const list = sortedPages(pages);

  return (
    <aside id="sidebar" className={`sidebar${collapsed ? " sidebar--collapsed" : ""}`}>
      <Button
        variant="ghost"
        size="sm"
        icon={collapsed ? "panel-left-open" : "panel-left-close"}
        className="sidebar__toggle"
        aria-label={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        title={collapsed ? "사이드바 펼치기" : "사이드바 접기"}
        aria-expanded={!collapsed}
        aria-controls="sidebar"
        onClick={() => setSidebarCollapsed(!collapsed)}
      />

      <nav className="sidebar__nav" aria-label="화면 이동">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="sidebar__item"
            aria-current={pathname === n.href ? "page" : undefined}
            aria-label={collapsed ? n.label : undefined}
            title={collapsed ? n.label : undefined}
          >
            <Icon name={n.icon} size={16} />
            {!collapsed && <span className="sidebar__text">{n.label}</span>}
          </Link>
        ))}
      </nav>

      {!collapsed && (
        <nav className="sidebar__nav" aria-label="사이드바 글 목록">
          <div className="sidebar__label">내 글</div>
          {list.length === 0 && <p className="sidebar__empty">아직 글이 없어요. 내 업무에서 새 글을 만들어 보세요.</p>}
          {list.map((p) => (
            <Link
              key={p.id}
              href={`/pages/${p.id}`}
              className="sidebar__item"
              aria-current={pathname === `/pages/${p.id}` ? "page" : undefined}
            >
              <Icon name="file-text" size={16} />
              <span className={`sidebar__text${p.title ? "" : " sidebar__text--empty"}`}>{p.title || "제목 없음"}</span>
            </Link>
          ))}
        </nav>
      )}
    </aside>
  );
}
