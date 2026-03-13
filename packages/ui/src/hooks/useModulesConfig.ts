import { useQuery } from '@tanstack/react-query'

export interface ModuleSidebarItem {
  label: string
  path: string
  icon?: string
}

export interface ModulePage {
  path: string
  apiPath: string
}

export interface ModulesConfig {
  sidebar: ModuleSidebarItem[]
  pages: ModulePage[]
}

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '') || ''

async function fetchModulesConfig(): Promise<ModulesConfig> {
  try {
    const res = await fetch(`${baseUrl}/api/modules/config`, { credentials: 'include' })
    if (!res.ok) return { sidebar: [], pages: [] }
    return res.json()
  } catch {
    return { sidebar: [], pages: [] }
  }
}

export function useModulesConfig() {
  const { data } = useQuery({
    queryKey: ['modules-config'],
    queryFn: fetchModulesConfig,
    staleTime: Infinity,
  })
  return data ?? { sidebar: [], pages: [] }
}
