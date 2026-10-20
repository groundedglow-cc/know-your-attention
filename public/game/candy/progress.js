export function firstUnfinished(levels, completed) {
  const index = levels.findIndex(level => !completed.has(level.id));
  return index < 0 ? 0 : index;
}
export function syncCompletion(completed, id, isComplete) {
  if (isComplete) completed.add(id);
  else completed.delete(id);
}
