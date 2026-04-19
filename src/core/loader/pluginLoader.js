import { registry } from '../plugin-api/index.js'

/**
 * Charge les plugins officiels embarqués.
 * Chaque plugin est importé dynamiquement pour permettre
 * le code splitting de Vite.
 */
const OFFICIAL_PLUGINS = [
  () => import('../../plugins/@luxlab/geo-optics/index.js'),
  () => import('../../plugins/@luxlab/wave-optics/index.js'),
]
/**
 * Charge tous les plugins officiels activés.
 * @param {string[]} activePluginIds - liste des IDs à charger
 *                                     ([] = charger tous)
 */
export async function loadOfficialPlugins(activePluginIds = []) {
  for (const loader of OFFICIAL_PLUGINS) {
    try {
      const mod    = await loader()
      const plugin = mod.default

      // Charger seulement si activé (ou si aucun filtre)
      if (
        activePluginIds.length === 0 ||
        activePluginIds.includes(plugin.id)
      ) {
        await registry.register(plugin)
      }
    } catch (err) {
      console.warn('[Loader] Plugin officiel non chargé :', err.message)
    }
  }
}

/**
 * Charge les plugins utilisateur depuis IndexedDB.
 * (implémentation complète à l'étape 10 — Plugin Manager)
 */
export async function loadUserPlugins() {
  try {
    const stored = JSON.parse(
      localStorage.getItem('luxlab:user-plugins') || '[]'
    )
    for (const url of stored) {
      try {
        await registry.loadFromURL(url)
      } catch (err) {
        console.warn(`[Loader] Plugin utilisateur "${url}" non chargé :`, err.message)
      }
    }
  } catch (err) {
    console.warn('[Loader] Plugins utilisateur non chargés :', err.message)
  }
}

/**
 * Point d'entrée principal.
 * Charge tous les plugins dans le bon ordre.
 */

export async function loadAll() {
  console.log('[Loader] Début chargement plugins...')

  for (const loader of OFFICIAL_PLUGINS) {
    try {
      const mod = await loader()
      console.log('[Loader] Module importé :', mod)

      const plugin = mod.default
      console.log('[Loader] Plugin :', plugin?.id, plugin?.constructor?.name)

      await registry.register(plugin)
    } catch (err) {
      // Afficher l'erreur COMPLÈTE sans la cacher
      console.error('[Loader] ERREUR chargement plugin :', err)
    }
  }

  console.log('[Loader] Fin. Composants :', registry.getAllComponents().length)
  registry.debug()
}