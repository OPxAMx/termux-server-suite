export type ResourceType = "img" | "iframe" | "link";

export interface ResourceSrc {
  id: string;
  name: string;
  url: string;
  type: ResourceType;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
}

const LS_KEY = "termux-resources";

function uuid(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadResources(): ResourceSrc[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveResources(list: ResourceSrc[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export function addResource(r: Omit<ResourceSrc, "id" | "createdAt" | "updatedAt">): ResourceSrc {
  const list = loadResources();
  const now = Date.now();
  const item: ResourceSrc = { ...r, id: uuid(), createdAt: now, updatedAt: now };
  list.push(item);
  saveResources(list);
  return item;
}

export function updateResource(id: string, patch: Partial<Omit<ResourceSrc, "id" | "createdAt">>): ResourceSrc | null {
  const list = loadResources();
  const idx = list.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  list[idx] = { ...list[idx], ...patch, updatedAt: Date.now() };
  saveResources(list);
  return list[idx];
}

export function deleteResource(id: string) {
  const list = loadResources().filter((r) => r.id !== id);
  saveResources(list);
}

export function toggleFavorite(id: string) {
  const list = loadResources();
  const item = list.find((r) => r.id === id);
  if (item) {
    item.favorite = !item.favorite;
    item.updatedAt = Date.now();
    saveResources(list);
  }
}

export function copyAsHtml(r: ResourceSrc): string {
  switch (r.type) {
    case "img":
      return `<img src="${r.url}" alt="${r.name}" />`;
    case "iframe":
      return `<iframe src="${r.url}" title="${r.name}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;
    case "link":
      return `<a href="${r.url}" target="_blank" rel="noopener">${r.name}</a>`;
  }
}
