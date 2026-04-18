/**
 * Fonctions de validation des définitions de plugins.
 * Appelées à l'enregistrement — erreurs explicites.
 */

export function validateComponentDef(def) {
  const required = ['type', 'label', 'moduleId', 'defaultParams', 'paramsDef']

  for (const key of required) {
    if (def[key] === undefined || def[key] === null) {
      throw new Error(
        `[LuxPlugin] ComponentDef "${def.type || '?'}" manque la propriété : "${key}"`
      )
    }
  }

  if (typeof def.defaultParams !== 'object') {
    throw new Error(
      `[LuxPlugin] ComponentDef "${def.type}" : defaultParams doit être un objet`
    )
  }

  if (!Array.isArray(def.paramsDef)) {
    throw new Error(
      `[LuxPlugin] ComponentDef "${def.type}" : paramsDef doit être un tableau`
    )
  }

  // Vérifier chaque paramDef
  for (const p of def.paramsDef) {
    if (!p.key || !p.label || !p.type) {
      throw new Error(
        `[LuxPlugin] ComponentDef "${def.type}" : paramDef manque key, label ou type`
      )
    }
    const validTypes = ['range', 'select', 'boolean', 'number', 'color', 'text']
    if (!validTypes.includes(p.type)) {
      throw new Error(
        `[LuxPlugin] ComponentDef "${def.type}" : type de paramètre invalide "${p.type}"`
      )
    }
    if (p.type === 'select' && (!Array.isArray(p.options) || p.options.length === 0)) {
      throw new Error(
        `[LuxPlugin] ComponentDef "${def.type}" : paramètre select "${p.key}" doit avoir options[]`
      )
    }
  }

  // simulate et render sont optionnels mais doivent être des fonctions si présents
  if (def.simulate && typeof def.simulate !== 'function') {
    throw new Error(
      `[LuxPlugin] ComponentDef "${def.type}" : simulate doit être une fonction`
    )
  }
  if (def.render && typeof def.render !== 'function') {
    throw new Error(
      `[LuxPlugin] ComponentDef "${def.type}" : render doit être une fonction`
    )
  }
}

export function validateEngineDef(def) {
  const required = ['id', 'canHandle', 'run', 'renderResult']

  for (const key of required) {
    if (!def[key]) {
      throw new Error(
        `[LuxPlugin] EngineDef "${def.id || '?'}" manque la propriété : "${key}"`
      )
    }
  }

  if (typeof def.canHandle !== 'function') {
    throw new Error(`[LuxPlugin] EngineDef "${def.id}" : canHandle doit être une fonction`)
  }
  if (typeof def.run !== 'function') {
    throw new Error(`[LuxPlugin] EngineDef "${def.id}" : run doit être une fonction`)
  }
  if (typeof def.renderResult !== 'function') {
    throw new Error(`[LuxPlugin] EngineDef "${def.id}" : renderResult doit être une fonction`)
  }
}