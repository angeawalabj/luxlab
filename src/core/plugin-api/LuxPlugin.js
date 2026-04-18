import { validateComponentDef, validateEngineDef } from './validation.js'

/**
 * Classe de base pour tous les plugins LuxLab.
 * Un plugin déclare ses capacités via les méthodes ci-dessous.
 * Il est ensuite passé à registry.register(plugin).
 */
export class LuxPlugin {

  constructor(manifest) {
    // Validation du manifest
    const required = ['id', 'name', 'version', 'author', 'license']
    for (const key of required) {
      if (!manifest[key]) {
        throw new Error(`[LuxPlugin] Manifest manque la propriété : "${key}"`)
      }
    }

    this.manifest     = manifest
    this.id           = manifest.id
    this.name         = manifest.name
    this.version      = manifest.version

    this._components  = []
    this._engines     = []
    this._panels      = []
    this._templates   = []
    this._experiences = []
    this._settings    = []
    this._i18n        = {}
    this._hooks       = {}
  }

  // ─── Déclarations ────────────────────────────────────────────────

  /**
   * Déclare un composant (objet drag-and-drop sur le canvas).
   * @param {import('./types.js').ComponentDef} def
   */
  component(def) {
    validateComponentDef(def)
    this._components.push({ ...def, pluginId: this.id })
    return this
  }

  /**
   * Déclare un moteur physique.
   * @param {import('./types.js').EngineDef} def
   */
  engine(def) {
    validateEngineDef(def)
    this._engines.push({ ...def, pluginId: this.id })
    return this
  }

  /**
   * Déclare un panneau UI custom.
   * @param {import('./types.js').PanelDef} def
   */
  panel(def) {
    if (!def.id || !def.component) {
      throw new Error(`[LuxPlugin] PanelDef manque id ou component`)
    }
    this._panels.push({ ...def, pluginId: this.id })
    return this
  }

  /**
   * Déclare un template (simulation pré-construite).
   * @param {import('./types.js').TemplateDef} def
   */
  template(def) {
    if (!def.id || !def.title || !def.components) {
      throw new Error(`[LuxPlugin] TemplateDef manque id, title ou components`)
    }
    this._templates.push({ ...def, pluginId: this.id })
    return this
  }

  /**
   * Déclare une expérience guidée.
   * @param {import('./types.js').ExperienceDef} def
   */
  experience(def) {
    if (!def.id || !def.title || !def.steps) {
      throw new Error(`[LuxPlugin] ExperienceDef manque id, title ou steps`)
    }
    this._experiences.push({ ...def, pluginId: this.id })
    return this
  }

  /**
   * Déclare des traductions.
   * @param {string} locale - 'fr' | 'en' | 'ar' | 'sw'
   * @param {Object} strings - { 'clé': 'traduction' }
   */
  i18n(locale, strings) {
    if (typeof strings !== 'object') {
      throw new Error(`[LuxPlugin] i18n strings doit être un objet`)
    }
    this._i18n[locale] = { ...(this._i18n[locale] || {}), ...strings }
    return this
  }

  /**
   * Déclare des settings configurables par l'utilisateur.
   * @param {import('./types.js').SettingDef[]} defs
   */
  settings(defs) {
    this._settings = defs
    return this
  }

  // ─── Hooks cycle de vie ──────────────────────────────────────────

  onLoad(fn)           { this._hooks.load            = fn; return this }
  onUnload(fn)         { this._hooks.unload          = fn; return this }
  onSimStart(fn)       { this._hooks.simStart        = fn; return this }
  onSimStop(fn)        { this._hooks.simStop         = fn; return this }
  onComponentAdd(fn)   { this._hooks.componentAdd    = fn; return this }
  onComponentRemove(fn){ this._hooks.componentRemove = fn; return this }
  onParamChange(fn)    { this._hooks.paramChange     = fn; return this }

  // ─── Getters ─────────────────────────────────────────────────────

  get components()  { return this._components  }
  get engines()     { return this._engines     }
  get panels()      { return this._panels      }
  get templates()   { return this._templates   }
  get experiences() { return this._experiences }
  get settings()    { return this._settings    }
  get i18n()        { return this._i18n        }
  get hooks()       { return this._hooks       }
}