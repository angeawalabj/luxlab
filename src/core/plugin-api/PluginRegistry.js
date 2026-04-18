import { LuxPlugin } from './LuxPlugin.js'

/**
 * Registre global des plugins LuxLab.
 * Source de vérité pour tous les composants, moteurs et panneaux disponibles.
 * Observable : la sidebar se reconstruit automatiquement quand un plugin change.
 */
class PluginRegistry {

  #plugins   = new Map()    // id → LuxPlugin
  #listeners = new Set()    // observers onChange

  // ─── Enregistrement ──────────────────────────────────────────────

  /**
   * Enregistre un plugin après validation.
   * @param {LuxPlugin} plugin
   */
  async register(plugin) {
    if (!(plugin instanceof LuxPlugin)) {
      throw new Error(
        `[Registry] register() attend une instance de LuxPlugin, reçu : ${typeof plugin}`
      )
    }

    // Vérifier les dépendances
    const deps = plugin.manifest.dependencies || []
    for (const depId of deps) {
      if (!this.#plugins.has(depId)) {
        throw new Error(
          `[Registry] Plugin "${plugin.id}" requiert "${depId}" qui n'est pas chargé.\n` +
          `Charge "${depId}" avant "${plugin.id}".`
        )
      }
    }

    // Vérifier les conflits de type de composant
    for (const comp of plugin.components) {
      const existing = this.getComponentDef(comp.type)
      if (existing && existing.pluginId !== plugin.id) {
        console.warn(
          `[Registry] Le type de composant "${comp.type}" est déjà défini ` +
          `par "${existing.pluginId}". Plugin "${plugin.id}" l'écrase.`
        )
      }
    }

    // Appel hook onLoad
    if (plugin.hooks.load) {
      try {
        await plugin.hooks.load()
      } catch (err) {
        throw new Error(
          `[Registry] Erreur dans onLoad() du plugin "${plugin.id}" : ${err.message}`
        )
      }
    }

    this.#plugins.set(plugin.id, plugin)
    this.#emit('register', plugin)

    console.log(
      `[LuxLab] ✓ Plugin "${plugin.name}" v${plugin.version} chargé` +
      ` — ${plugin.components.length} composants, ${plugin.engines.length} moteurs`
    )

    return this
  }

  /**
   * Décharge un plugin proprement.
   * @param {string} id
   */
  async unregister(id) {
    const plugin = this.#plugins.get(id)
    if (!plugin) return

    if (plugin.hooks.unload) {
      try {
        await plugin.hooks.unload()
      } catch (err) {
        console.warn(`[Registry] Erreur dans onUnload() de "${id}" :`, err.message)
      }
    }

    this.#plugins.delete(id)
    this.#emit('unregister', { id })
    console.log(`[LuxLab] Plugin "${id}" déchargé`)
  }

  // ─── Queries ─────────────────────────────────────────────────────

  /** @returns {LuxPlugin|undefined} */
  get(id) { return this.#plugins.get(id) }

  /** @returns {boolean} */
  isLoaded(id) { return this.#plugins.has(id) }

  /** @returns {LuxPlugin[]} */
  getAll() { return [...this.#plugins.values()] }

  /** @returns {import('./types.js').ComponentDef[]} */
  getAllComponents() {
    return this.getAll().flatMap(p => p.components)
  }

  /** @returns {import('./types.js').EngineDef[]} */
  getAllEngines() {
    return this.getAll().flatMap(p => p.engines)
  }

  /** @returns {import('./types.js').PanelDef[]} */
  getAllPanels() {
    return this.getAll().flatMap(p => p.panels)
  }

  /** @returns {import('./types.js').TemplateDef[]} */
  getAllTemplates() {
    return this.getAll().flatMap(p => p.templates)
  }

  /** @returns {import('./types.js').ExperienceDef[]} */
  getAllExperiences() {
    return this.getAll().flatMap(p => p.experiences)
  }

  /**
   * Trouve la définition d'un composant par son type.
   * @param {string} type
   * @returns {import('./types.js').ComponentDef|null}
   */
  getComponentDef(type) {
    return this.getAllComponents().find(c => c.type === type) || null
  }

  /**
   * Trouve le moteur adapté à une liste de composants.
   * Prend le premier moteur dont canHandle() retourne true.
   * @param {Object[]} components
   * @returns {import('./types.js').EngineDef|null}
   */
  getEngineFor(components) {
    return this.getAllEngines().find(e => {
      try { return e.canHandle(components) }
      catch { return false }
    }) || null
  }

  /**
   * Retourne les traductions fusionnées pour une locale.
   * @param {string} locale
   * @returns {Object}
   */
  getI18n(locale) {
    const merged = {}
    for (const plugin of this.getAll()) {
      Object.assign(merged, plugin.i18n[locale] || {})
    }
    return merged
  }

  /**
   * Déclenche un hook sur tous les plugins chargés.
   * Les erreurs dans un plugin n'affectent pas les autres.
   * @param {string} event
   * @param {*}      data
   */
  fireHook(event, data) {
    for (const plugin of this.getAll()) {
      const hook = plugin.hooks[event]
      if (hook) {
        try { hook(data) }
        catch (err) {
          console.warn(`[Registry] Erreur hook "${event}" dans "${plugin.id}" :`, err.message)
        }
      }
    }
  }

  // ─── Chargement dynamique ────────────────────────────────────────

  /**
   * Charge un plugin depuis une URL (marketplace, fichier local converti).
   * @param {string} url
   * @returns {Promise<LuxPlugin>}
   */
  async loadFromURL(url) {
    const module = await import(/* @vite-ignore */ url)
    const plugin = module.default
    await this.register(plugin)
    return plugin
  }

  /**
   * Charge un plugin depuis un File (installé depuis le disque).
   * @param {File} file
   * @returns {Promise<LuxPlugin>}
   */
  async loadFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const blob   = new Blob([e.target.result], { type: 'text/javascript' })
          const url    = URL.createObjectURL(blob)
          const plugin = await this.loadFromURL(url)
          URL.revokeObjectURL(url)
          resolve(plugin)
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = () => reject(new Error('Erreur lecture fichier plugin'))
      reader.readAsText(file)
    })
  }

  // ─── Debug ───────────────────────────────────────────────────────

  /**
   * Affiche un résumé du registre dans la console.
   */
  debug() {
    console.group('[LuxLab Registry]')
    console.log(`${this.#plugins.size} plugin(s) chargé(s)`)
    for (const plugin of this.getAll()) {
      console.log(
        `  ${plugin.id} v${plugin.version}` +
        ` — ${plugin.components.length} composants` +
        ` ${plugin.engines.length} moteurs` +
        ` ${plugin.templates.length} templates` +
        ` ${plugin.experiences.length} expériences`
      )
    }
    console.groupEnd()
  }

  // ─── Observers ───────────────────────────────────────────────────

  /**
   * S'abonner aux changements du registre.
   * @param {Function} fn - (event: 'register'|'unregister', data) => void
   * @returns {Function} unsubscribe
   */
  onChange(fn) {
    this.#listeners.add(fn)
    return () => this.#listeners.delete(fn)
  }

  #emit(event, data) {
    this.#listeners.forEach(fn => {
      try { fn(event, data) }
      catch (err) {
        console.warn('[Registry] Erreur observer onChange :', err.message)
      }
    })
  }
}

// Singleton — une seule instance dans toute l'app
export const registry = new PluginRegistry()

// Expose en global pour debug dans la console du navigateur
if (typeof window !== 'undefined') {
  window.LuxLab = {
    registry,
    version: '1.0.0',
  }
}