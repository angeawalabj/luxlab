/* tslint:disable */
/* eslint-disable */

export function compute_atomic_spectrum(params_json: string): string;

export function compute_attenuation(params_json: string): string;

export function compute_bell(params_json: string): string;

export function compute_compton(energy_kev: number, steps: number): string;

export function compute_decay(params_json: string): string;

export function compute_dose(params_json: string): string;

export function compute_grating(params_json: string): string;

export function compute_malus(params_json: string): string;

export function compute_michelson(params_json: string): string;

export function compute_photoelectric(params_json: string): string;

export function compute_polarization_train(params_json: string): string;

export function compute_schrodinger(params_json: string): string;

export function compute_solar_spectrum(steps: number): string;

export function compute_young(params_json: string): string;

export function engine_version(): string;

export function get_atomic_lines(element: string): string;

export function get_fraunhofer_lines(): string;

export function identify_element(params_json: string): string;

export function photon_energy_ev(wl_nm: number): number;

export function run_fdtd(params_json: string): string;

export function run_simulation(input_json: string): string;

export function wavelength_to_color(wl: number): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly compute_atomic_spectrum: (a: number, b: number) => [number, number];
    readonly compute_attenuation: (a: number, b: number) => [number, number];
    readonly compute_bell: (a: number, b: number) => [number, number];
    readonly compute_compton: (a: number, b: number) => [number, number];
    readonly compute_decay: (a: number, b: number) => [number, number];
    readonly compute_dose: (a: number, b: number) => [number, number];
    readonly compute_grating: (a: number, b: number) => [number, number];
    readonly compute_malus: (a: number, b: number) => [number, number];
    readonly compute_michelson: (a: number, b: number) => [number, number];
    readonly compute_photoelectric: (a: number, b: number) => [number, number];
    readonly compute_polarization_train: (a: number, b: number) => [number, number];
    readonly compute_schrodinger: (a: number, b: number) => [number, number];
    readonly compute_solar_spectrum: (a: number) => [number, number];
    readonly compute_young: (a: number, b: number) => [number, number];
    readonly engine_version: () => [number, number];
    readonly get_atomic_lines: (a: number, b: number) => [number, number];
    readonly get_fraunhofer_lines: () => [number, number];
    readonly identify_element: (a: number, b: number) => [number, number];
    readonly photon_energy_ev: (a: number) => number;
    readonly run_fdtd: (a: number, b: number) => [number, number];
    readonly run_simulation: (a: number, b: number) => [number, number];
    readonly wavelength_to_color: (a: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
