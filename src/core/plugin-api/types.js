/**
 * LUXLAB PLUGIN API — Types de référence
 * Ce fichier documente les structures attendues par le registry.
 * Toute implémentation doit respecter ces contrats.
 */

/**
 * @typedef {Object} PluginManifest
 * @property {string}   id            - ID unique global ex: '@luxlab/geo-optics'
 * @property {string}   name          - Nom lisible
 * @property {string}   version       - Semver ex: '1.0.0'
 * @property {string}   author        - Auteur
 * @property {string}   license       - 'MIT' | 'CC-BY-4.0' | 'free' | 'commercial'
 * @property {string[]} dependencies  - IDs de plugins requis
 * @property {string}   [description] - Description courte
 */

/**
 * @typedef {Object} ParamDef
 * @property {string}   key           - Clé dans params
 * @property {string}   label         - Label affiché
 * @property {'range'|'select'|'boolean'|'number'|'color'|'text'} type
 * @property {number}   [min]         - Pour type range/number
 * @property {number}   [max]         - Pour type range/number
 * @property {number}   [step]        - Pour type range/number
 * @property {string[]} [options]     - Pour type select
 * @property {*}        [default]     - Valeur par défaut
 */

/**
 * @typedef {Object} ComponentDef
 * @property {string}     type          - Clé unique globale ex: 'lens'
 * @property {string}     label         - Nom affiché dans la sidebar
 * @property {string}     icon          - Emoji ou caractère
 * @property {string}     moduleId      - ID du plugin parent
 * @property {string}     category      - Groupe dans la sidebar
 * @property {Object}     defaultParams - Paramètres par défaut
 * @property {ParamDef[]} paramsDef     - Définition des paramètres pour l'UI
 * @property {Function}   simulate      - (params, ctx) => SimOutput
 * @property {Function}   render        - (props) => RenderDef
 * @property {string}     [pluginId]    - Ajouté automatiquement par le registry
 */

/**
 * @typedef {Object} EngineDef
 * @property {string}   id            - ID unique
 * @property {string}   name          - Nom lisible
 * @property {Function} canHandle     - (components) => boolean
 * @property {Function} run           - (components, options) => SimResult
 * @property {Function} renderResult  - (ctx2d, result, options) => void
 * @property {string}   [pluginId]    - Ajouté automatiquement
 */

/**
 * @typedef {Object} PanelDef
 * @property {string}   id            - ID unique
 * @property {string}   title         - Titre affiché
 * @property {string}   icon          - Icône
 * @property {'right'|'bottom'|'floating'} position
 * @property {Function} component     - Composant React
 * @property {string}   [pluginId]    - Ajouté automatiquement
 */

/**
 * @typedef {Object} TemplateDef
 * @property {string}     id
 * @property {string}     title
 * @property {string}     description
 * @property {string}     level        - 'débutant'|'intermédiaire'|'avancé'
 * @property {string[]}   tags
 * @property {boolean}    certified
 * @property {Object[]}   components   - État initial du canvas
 * @property {Object}     [settings]
 * @property {string}     [pluginId]   - Ajouté automatiquement
 */

/**
 * @typedef {Object} ExperienceStep
 * @property {number}   id
 * @property {string}   title
 * @property {string}   instruction
 * @property {string}   [hint]
 * @property {Object}   validate      - Objet de validation (pas de code)
 * @property {string}   onSuccess
 * @property {string}   onError
 */

/**
 * @typedef {Object} ExperienceDef
 * @property {string}         id
 * @property {string}         title
 * @property {string}         description
 * @property {string}         [estimatedDuration]
 * @property {string[]}       objectives
 * @property {string}         theory
 * @property {ExperienceStep[]} steps
 * @property {Object}         [finalAssessment]
 * @property {Object}         [initialState]
 * @property {string}         [pluginId]   - Ajouté automatiquement
 */

/**
 * @typedef {Object} SettingDef
 * @property {string}   key
 * @property {string}   label
 * @property {string}   type
 * @property {*}        default
 * @property {string}   [description]
 * @property {string[]} [options]     - Pour type select
 * @property {number}   [min]
 * @property {number}   [max]
 */