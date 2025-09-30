import { useEffect, useMemo, useState } from "react";

import { getColorForModule } from "../colorUtils";
import type {
  DatabaseNode,
  DatabaseRelationship,
  NodeModule,
} from "../types";

type RawDatabaseNode = {
  id: number | string;
  type?: string | null;
  name?: string | null;
  summary?: string | null;
  related_topic?: number | string | null;
  module_id?: number | string | null;
};

type RawDatabaseRelationship = {
  id: number | string;
  first_node?: number | string | null;
  second_node?: number | string | null;
  rs_type?: string | null;
};

type RawModuleResponse = {
  id?: number | string | null;
  index?: number | string | null;
  name?: string | null;
};

interface UseThreadMapDataResult {
  dbNodes: DatabaseNode[];
  setDbNodes: React.Dispatch<React.SetStateAction<DatabaseNode[]>>;
  dbRelationships: DatabaseRelationship[];
  setDbRelationships: React.Dispatch<
    React.SetStateAction<DatabaseRelationship[]>
  >;
  moduleLookup: Record<string, NodeModule>;
  setModuleLookup: React.Dispatch<
    React.SetStateAction<Record<string, NodeModule>>
  >;
  availableModules: NodeModule[];
  err: string | null;
}

export const useThreadMapData = (
  activeModuleId: string | null | undefined
): UseThreadMapDataResult => {
  const [dbNodes, setDbNodes] = useState<DatabaseNode[]>([]);
  const [dbRelationships, setDbRelationships] = useState<DatabaseRelationship[]>(
    []
  );
  const [moduleLookup, setModuleLookup] = useState<Record<string, NodeModule>>(
    {}
  );
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!activeModuleId) {
      setDbNodes([]);
      setDbRelationships([]);
      setErr(null);
      return () => {
        isMounted = false;
      };
    }

    const fetchThreadMapData = async () => {
      try {
        const [nodesResponse, relationshipsResponse] = await Promise.all([
          fetch(`/api/nodes/${activeModuleId}/`),
          fetch(`/api/relationships/${activeModuleId}/`),
        ]);

        if (!nodesResponse.ok) {
          throw new Error(`Failed to fetch nodes for module ${activeModuleId}`);
        }

        if (!relationshipsResponse.ok) {
          throw new Error(
            `Failed to fetch relationships for module ${activeModuleId}`
          );
        }

        const rawNodes = (await nodesResponse.json()) as RawDatabaseNode[];
        const rawRelationships =
          (await relationshipsResponse.json()) as RawDatabaseRelationship[];

        if (!isMounted) {
          return;
        }

        const normalizedNodes: DatabaseNode[] = Array.isArray(rawNodes)
          ? rawNodes.map((node) => ({
              id: String(node.id),
              type: node.type === "topic" ? "topic" : "concept",
              name: node.name ?? "",
              summary: node.summary ?? undefined,
              related_topic:
                node.related_topic !== null && node.related_topic !== undefined
                  ? String(node.related_topic)
                  : undefined,
              module_id: String(node.module_id ?? activeModuleId),
            }))
          : [];

        const normalizedRelationships: DatabaseRelationship[] = Array.isArray(
          rawRelationships
        )
          ? rawRelationships
              .filter(
                (relationship) =>
                  relationship.first_node !== null &&
                  relationship.first_node !== undefined &&
                  relationship.second_node !== null &&
                  relationship.second_node !== undefined
              )
              .map((relationship) => ({
                id: String(relationship.id),
                first_node: String(relationship.first_node),
                second_node: String(relationship.second_node),
                rs_type: relationship.rs_type ?? "",
              }))
          : [];

        setDbNodes(normalizedNodes);
        setDbRelationships(normalizedRelationships);
        setErr(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error("Error fetching thread map data:", error);
        setErr("Threadmap data failed to load. Please try again later.");
      }
    };

    fetchThreadMapData();

    return () => {
      isMounted = false;
    };
  }, [activeModuleId]);

  useEffect(() => {
    if (!activeModuleId || moduleLookup[activeModuleId]) {
      return;
    }

    let isMounted = true;

    const fetchModule = async () => {
      try {
        const response = await fetch(`/api/module/${activeModuleId}/`);
        if (!response.ok) {
          throw new Error(`Failed to fetch module ${activeModuleId}`);
        }

        const rawModule = (await response.json()) as RawModuleResponse;

        if (!isMounted) {
          return;
        }

        setModuleLookup((prev) => {
          const moduleKey = String(rawModule.id ?? activeModuleId);
          const baseColor =
            prev[moduleKey]?.color ?? getColorForModule(moduleKey, prev);
          return {
            ...prev,
            [moduleKey]: {
              module_id: moduleKey,
              module_name: rawModule.name ?? prev[moduleKey]?.module_name,
              module_index:
                rawModule.index !== undefined && rawModule.index !== null
                  ? String(rawModule.index)
                  : prev[moduleKey]?.module_index,
              color: baseColor,
            },
          };
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        console.error("Error fetching module metadata:", error);
        setModuleLookup((prev) => {
          if (prev[activeModuleId]) {
            return prev;
          }
          const fallbackColor = getColorForModule(activeModuleId, prev);
          return {
            ...prev,
            [activeModuleId]: {
              module_id: activeModuleId,
              color: fallbackColor,
            },
          };
        });
      }
    };

    fetchModule();

    return () => {
      isMounted = false;
    };
  }, [activeModuleId, moduleLookup]);

  useEffect(() => {
    const moduleIds = Array.from(new Set(dbNodes.map((node) => node.module_id)));
    const missingIds = moduleIds.filter((moduleId) => !moduleLookup[moduleId]);

    if (missingIds.length === 0) {
      return;
    }

    let isMounted = true;

    const fetchModules = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            const response = await fetch(`/api/module/${id}/`);
            if (!response.ok) {
              throw new Error(`Failed to fetch module ${id}`);
            }
            const rawModule = (await response.json()) as RawModuleResponse;
            return { id, rawModule };
          } catch (error) {
            console.error("Error fetching module metadata:", error);
            return { id, rawModule: null };
          }
        })
      );

      if (!isMounted) {
        return;
      }

      setModuleLookup((prev) => {
        const next = { ...prev };
        results.forEach(({ id, rawModule }) => {
          const moduleKey = String(rawModule?.id ?? id);
          const existing = prev[moduleKey];
          const baseColor =
            existing?.color ?? getColorForModule(moduleKey, prev);
          next[moduleKey] = {
            module_id: moduleKey,
            module_name: rawModule?.name ?? existing?.module_name,
            module_index:
              rawModule?.index !== undefined && rawModule?.index !== null
                ? String(rawModule.index)
                : existing?.module_index,
            color: baseColor,
          };
        });
        return next;
      });
    };

    fetchModules();

    return () => {
      isMounted = false;
    };
  }, [dbNodes, moduleLookup]);

  const availableModules = useMemo(() => {
    const moduleIds = new Set<string>();
    if (activeModuleId) {
      moduleIds.add(activeModuleId);
    }
    dbNodes.forEach((node) => moduleIds.add(node.module_id));

    const modules: NodeModule[] = [];
    moduleIds.forEach((id) => {
      const info = moduleLookup[id];
      if (info) {
        modules.push(info);
      } else {
        modules.push({
          module_id: id,
          color: getColorForModule(id, moduleLookup),
        });
      }
    });

    return modules;
  }, [activeModuleId, dbNodes, moduleLookup]);

  return {
    dbNodes,
    setDbNodes,
    dbRelationships,
    setDbRelationships,
    moduleLookup,
    setModuleLookup,
    availableModules,
    err,
  };
};

