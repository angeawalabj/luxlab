mod error;
mod utils;
mod geo;

use wasm_bindgen::prelude::*;
use serde::Deserialize;

// Meilleure gestion des paniques en debug
#[cfg(feature = "console_error_panic_hook")]
use console_error_panic_hook;

#[wasm_bindgen(start)]
pub fn on_load() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// ─── Structure d'entrée principale ───────────────────────────────

#[derive(Deserialize)]
struct SimInput {
    components: Vec<geo::raytracer::Component>,
    #[serde(default)]
    options: geo::raytracer::TraceOptions,
}

// ─── Fonction principale exposée ─────────────────────────────────

/// Lance une simulation complète.
/// Entrée  : JSON { components: [...], options: {...} }
/// Sortie  : JSON { rays: [...], intersections: [...], images: [...], durationMs: N }
/// Erreur  : JSON { error: "message", code: "CODE" }
#[wasm_bindgen]
pub fn run_simulation(input_json: &str) -> String {
    let input: SimInput = match serde_json::from_str(input_json) {
        Ok(v)  => v,
        Err(e) => {
            return error::LuxError::new(
                "PARSE_ERROR",
                &format!("JSON invalide : {}", e),
            ).to_json()
        }
    };

    let result = geo::raytracer::trace(&input.components, &input.options);

    match serde_json::to_string(&result) {
        Ok(json) => json,
        Err(e)   => error::LuxError::new(
            "SERIALIZE_ERROR",
            &format!("Erreur sérialisation : {}", e),
        ).to_json(),
    }
}

// ─── Fonctions utilitaires exposées ──────────────────────────────

/// Retourne RGB d'une longueur d'onde en nm
/// Entrée  : nombre (ex: 550)
/// Sortie  : JSON { r: 0.0–1.0, g: 0.0–1.0, b: 0.0–1.0 }
#[wasm_bindgen]
pub fn wavelength_to_color(wl: f64) -> String {
    let (r, g, b) = utils::wavelength::wavelength_to_rgb(wl);
    format!(r#"{{"r":{:.4},"g":{:.4},"b":{:.4}}}"#, r, g, b)
}

/// Énergie d'un photon en eV
#[wasm_bindgen]
pub fn photon_energy_ev(wl_nm: f64) -> f64 {
    utils::wavelength::wavelength_to_ev(wl_nm)
}

/// Retourne la version du moteur
#[wasm_bindgen]
pub fn engine_version() -> String {
    "0.1.0".to_string()
}