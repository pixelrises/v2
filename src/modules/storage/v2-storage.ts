import type { CustomAgentProject, GameProject, NormalizedSiteProject } from "@/modules/creation-engine";

const keys = {
  projects: "pixelrises-v2-projects",
  agents: "pixelrises-v2-custom-agents",
  games: "pixelrises-v2-games",
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = <T,>(key: string, value: T) => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

export type StoredProject = {
  id: string;
  type: "site" | "agent" | "game";
  title: string;
  status: "draft" | "planned" | "generated" | "improved" | "published";
  updatedAt: string;
  score: number;
  payload: NormalizedSiteProject | CustomAgentProject | GameProject;
};

export const readStoredProjects = () => readJson<StoredProject[]>(keys.projects, []);

export const saveStoredProject = (project: StoredProject) => {
  const projects = readStoredProjects().filter((item) => item.id !== project.id);
  writeJson(keys.projects, [project, ...projects].slice(0, 40));
  return project;
};

export const readStoredAgents = () => readJson<CustomAgentProject[]>(keys.agents, []);

export const saveStoredAgent = (agent: CustomAgentProject) => {
  const agents = readStoredAgents().filter((item) => item.id !== agent.id);
  writeJson(keys.agents, [agent, ...agents].slice(0, 30));
  return agent;
};

export const readStoredGames = () => readJson<GameProject[]>(keys.games, []);

export const saveStoredGame = (game: GameProject) => {
  const games = readStoredGames().filter((item) => item.meta.projectId !== game.meta.projectId);
  writeJson(keys.games, [game, ...games].slice(0, 30));
  return game;
};
