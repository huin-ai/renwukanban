import React from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const COLS = [
  { id: "TODO", title: "待办" },
  { id: "DOING", title: "进行中" },
  { id: "DONE", title: "已完成" }
];

function isColumnId(id) {
  return id === "TODO" || id === "DOING" || id === "DONE";
}

function findStatus(tasks, id) {
  if (isColumnId(id)) return id;
  const t = (tasks || []).find((x) => x.id === id);
  return t?.status || null;
}

function Column({ id, title, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="card" style={{ flex: 1, boxShadow: "none" }}>
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div
        ref={setNodeRef}
        style={{
          marginTop: 10,
          minHeight: 260,
          padding: 10,
          borderRadius: 12,
          outline: isOver ? "2px dashed rgba(255,255,255,.25)" : "2px dashed rgba(255,255,255,.08)"
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Menu({ open, items }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 34,
        right: 0,
        width: 160,
        background: "rgba(20,20,20,.98)",
        border: "1px solid rgba(255,255,255,.10)",
        borderRadius: 10,
        overflow: "hidden",
        zIndex: 20
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <button
          key={it.key}
          disabled={it.disabled}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            it.onClick?.(e);
          }}
          style={{
            width: "100%",
            textAlign: "left",
            padding: "10px 12px",
            border: "none",
            background: "transparent",
            color: it.danger ? "rgba(255,120,120,.95)" : "rgba(255,255,255,.92)",
            cursor: it.disabled ? "not-allowed" : "pointer"
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function TaskCard({
  task,
  canDrag,
  canDelete,
  onEdit,
  onDelete,
  onCopyLink,
  onOpen,
  openedMenuId,
  setOpenedMenuId
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: !canDrag
  });

  const open = openedMenuId === task.id;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "10px 12px",
    borderRadius: 12,
    marginBottom: 10,
    background: "rgba(255,255,255,.06)",
    border: "1px solid rgba(255,255,255,.08)",
    opacity: isDragging ? 0.7 : 1,
    userSelect: "none",
    position: "relative",
    cursor: "pointer"
  };

  const menuItems = [
    {
      key: "edit",
      label: "编辑",
      disabled: !canDrag,
      onClick: (e) => {
        e?.preventDefault?.();
        setOpenedMenuId(null);
        onEdit?.(task);
      }
    },
    {
      key: "copy",
      label: "复制链接",
      disabled: false,
      onClick: async (e) => {
        e?.preventDefault?.();
        setOpenedMenuId(null);
        await onCopyLink?.(task);
      }
    },
    {
      key: "del",
      label: "删除",
      danger: true,
      disabled: !canDelete,
      onClick: (e) => {
        e?.preventDefault?.();
        setOpenedMenuId(null);
        onDelete?.(task);
      }
    }
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      title={task.title}
      onClick={() => onOpen?.(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(task);
        }
      }}
    >
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {task.title}
          </div>
          <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
            状态：{task.status}
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          {/* 拖拽手柄：只在这里绑定 listeners，避免点击卡片主体就开始拖 */}
          <button
            type="button"
            aria-label="拖拽（支持键盘：空格开始/结束，方向键移动）"
            disabled={!canDrag}
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.03)",
              color: "rgba(255,255,255,.85)",
              cursor: canDrag ? "grab" : "not-allowed"
            }}
            {...attributes}
            {...listeners}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </button>

          {/* 三点菜单 */}
          <button
            type="button"
            aria-label="更多"
            style={{
              width: 30,
              height: 30,
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,.10)",
              background: "rgba(255,255,255,.03)",
              color: "rgba(255,255,255,.85)",
              cursor: "pointer"
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setOpenedMenuId(open ? null : task.id);
            }}
          >
            ⋯
          </button>

          <Menu open={open} items={menuItems} />
        </div>
      </div>
    </div>
  );
}

export default function KanbanBoard({
  tasks = [],
  canDrag,
  canDelete,
  onMove,
  onEdit,
  onDelete,
  onCopyLink,
  onOpen
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // ✅ 键盘拖拽（面试加分点：可访问性）
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [openedMenuId, setOpenedMenuId] = React.useState(null);

  const grouped = React.useMemo(() => {
    const map = { TODO: [], DOING: [], DONE: [] };
    for (const t of tasks) {
      const s = t.status || "TODO";
      map[s]?.push(t);
    }
    return map;
  }, [tasks]);

  function handleDragEnd(evt) {
    const { active, over } = evt;
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    const fromStatus = findStatus(tasks, taskId);
    const toStatus = findStatus(tasks, overId);
    if (!fromStatus || !toStatus) return;

    const beforeId = isColumnId(overId) ? null : overId;
    if (beforeId === taskId && fromStatus === toStatus) return;

    onMove?.({ taskId, toStatus, beforeId });
  }

  // ✅ 提示屏幕阅读器：拖拽过程中发生了什么（锦上添花）
  const announcements = {
    onDragStart({ active }) {
      const t = tasks.find((x) => x.id === String(active.id));
      return t ? `开始拖拽：${t.title}` : "开始拖拽";
    },
    onDragOver({ active, over }) {
      if (!over) return;
      const t = tasks.find((x) => x.id === String(active.id));
      const to = isColumnId(String(over.id)) ? COLS.find((c) => c.id === String(over.id))?.title : "目标位置";
      return t ? `拖拽 ${t.title} 到 ${to}` : "拖拽中";
    },
    onDragEnd({ active, over }) {
      if (!over) return "已放置";
      const t = tasks.find((x) => x.id === String(active.id));
      return t ? `已放置：${t.title}` : "已放置";
    },
    onDragCancel() {
      return "已取消拖拽";
    }
  };

  return (
    <div onMouseDown={() => setOpenedMenuId(null)}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        accessibility={{ announcements }}
      >
        <div className="row" style={{ gap: 12, alignItems: "stretch" }}>
          {COLS.map((c) => (
            <Column key={c.id} id={c.id} title={c.title}>
              <SortableContext items={grouped[c.id].map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {grouped[c.id].map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    canDrag={!!canDrag}
                    canDelete={!!canDelete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onCopyLink={onCopyLink}
                    onOpen={onOpen}
                    openedMenuId={openedMenuId}
                    setOpenedMenuId={setOpenedMenuId}
                  />
                ))}
              </SortableContext>

              {grouped[c.id].length === 0 ? <div className="muted">拖拽任务到这里</div> : null}
            </Column>
          ))}
        </div>

        {!canDrag ? (
          <div className="muted" style={{ marginTop: 10 }}>
            当前为只读角色：仅可查看看板，无法拖拽/编辑。
          </div>
        ) : null}
      </DndContext>
    </div>
  );
}