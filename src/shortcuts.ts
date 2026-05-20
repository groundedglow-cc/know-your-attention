export type Modifier = 'shift' | 'meta' | 'alt' | 'ctrl';
export type ShortcutScope = 'global' | 'tasks' | 'notes' | 'selected' | 'editing';
export type ShortcutGroup = 'global' | 'tasks' | 'edit';

export interface ShortcutDef {
  id: string;
  group: ShortcutGroup;
  scope: ShortcutScope[];
  label: string;
  keysLabel: string;
}

export const SHORTCUT_GROUP_TITLES: Record<ShortcutGroup, string> = {
  global: '全局',
  tasks: '事项',
  edit: '编辑',
};

export const SHORTCUTS: ShortcutDef[] = [
  // 全局
  {
    id: 'add',
    group: 'global',
    scope: ['global'],
    label: '新增（选中父项时为子项）',
    keysLabel: 'N',
  },
  {
    id: 'add-top',
    group: 'global',
    scope: ['global'],
    label: '新增父项（强制）',
    keysLabel: 'Shift + N',
  },
  {
    id: 'switch-tab-prev',
    group: 'global',
    scope: ['global'],
    label: '上一个 Tab',
    keysLabel: '[',
  },
  {
    id: 'switch-tab-next',
    group: 'global',
    scope: ['global'],
    label: '下一个 Tab',
    keysLabel: ']',
  },
  // 事项
  {
    id: 'move-down',
    group: 'tasks',
    scope: ['tasks'],
    label: '下移选中（循环）',
    keysLabel: '↓',
  },
  {
    id: 'move-up',
    group: 'tasks',
    scope: ['tasks'],
    label: '上移选中（循环）',
    keysLabel: '↑',
  },
  {
    id: 'expand',
    group: 'tasks',
    scope: ['tasks', 'selected'],
    label: '展开子项',
    keysLabel: '→',
  },
  {
    id: 'collapse',
    group: 'tasks',
    scope: ['tasks', 'selected'],
    label: '收起子项',
    keysLabel: '←',
  },
  {
    id: 'jump-parent',
    group: 'tasks',
    scope: ['tasks', 'selected'],
    label: '跳父级（循环）',
    keysLabel: 'Shift + ←',
  },
  {
    id: 'jump-child',
    group: 'tasks',
    scope: ['tasks', 'selected'],
    label: '跳到第一个子项',
    keysLabel: 'Shift + →',
  },
  {
    id: 'jump-1-9',
    group: 'tasks',
    scope: ['tasks'],
    label: '跳转到第 1~9 项',
    keysLabel: '1~9',
  },
  {
    id: 'toggle-status',
    group: 'tasks',
    scope: ['tasks', 'selected'],
    label: '切换 进行 / 暂停',
    keysLabel: 'Space',
  },
  {
    id: 'mark-done',
    group: 'tasks',
    scope: ['tasks', 'selected'],
    label: '标记完成',
    keysLabel: 'X',
  },
  {
    id: 'toggle-show-done',
    group: 'tasks',
    scope: ['tasks'],
    label: '显示 / 隐藏已完成',
    keysLabel: 'H',
  },
  {
    id: 'edit-enter',
    group: 'tasks',
    scope: ['tasks', 'selected'],
    label: '进入编辑',
    keysLabel: 'Enter',
  },
  // 编辑态
  {
    id: 'submit',
    group: 'edit',
    scope: ['editing'],
    label: '提交 / 保存',
    keysLabel: 'Cmd + Enter',
  },
  {
    id: 'cancel',
    group: 'edit',
    scope: ['editing'],
    label: '取消 / 退出编辑',
    keysLabel: 'Esc',
  },
];
