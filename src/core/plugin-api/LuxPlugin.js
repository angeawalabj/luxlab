import { validateComponentDef, validateEngineDef } from './validation.js'

export class LuxPlugin {

  constructor(manifest) {
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
  // Noms des méthodes : verbe + nom pour éviter tout conflit avec les getters

  addComponent(def) {
    validateComponentDef(def)
    this._components.push({ ...def, pluginId: this.id })
    return this
  }

  addEngine(def) {
    validateEngineDef(def)
    this._engines.push({ ...def, pluginId: this.id })
    return this
  }

  addPanel(def) {
    if (!def.id || !def.component) {
      throw new Error(`[LuxPlugin] PanelDef manque id ou component`)
    }
    this._panels.push({ ...def, pluginId: this.id })
    return this
  }

  addTemplate(def) {
    if (!def.id || !def.title || !def.components) {
      throw new Error(`[LuxPlugin] TemplateDef manque id, title ou components`)
    }
    this._templates.push({ ...def, pluginId: this.id })
    return this
  }

  addExperience(def) {
    if (!def.id || !def.title || !def.steps) {
      throw new Error(`[LuxPlugin] ExperienceDef manque id, title ou steps`)
    }
    this._experiences.push({ ...def, pluginId: this.id })
    return this
  }

  addI18n(locale, strings) {
    if (typeof strings !== 'object') {
      throw new Error(`[LuxPlugin] addI18n strings doit être un objet`)
    }
    this._i18n[locale] = { ...(this._i18n[locale] || {}), ...strings }
    return this
  }

  addSettings(defs) {
    this._settings = defs
    return this
  }

  // ─── Hooks ───────────────────────────────────────────────────────

  onLoad(fn)            { this._hooks.load            = fn; return this }
  onUnload(fn)          { this._hooks.unload          = fn; return this }
  onSimStart(fn)        { this._hooks.simStart        = fn; return this }
  onSimStop(fn)         { this._hooks.simStop         = fn; return this }
  onComponentAdd(fn)    { this._hooks.componentAdd    = fn; return this }
  onComponentRemove(fn) { this._hooks.componentRemove = fn; return this }
  onParamChange(fn)     { this._hooks.paramChange     = fn; return this }

  // ─── Getters ─────────────────────────────────────────────────────

  get components()   { return this._components  }
  get engines()      { return this._engines     }
  get panels()       { return this._panels      }
  get templates()    { return this._templates   }
  get experiences()  { return this._experiences }
  get settings()     { return this._settings    }
  get translations() { return this._i18n        }
  get hooks()        { return this._hooks       }
}