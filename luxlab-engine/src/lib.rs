mod error;
mod utils;
mod geo;
mod wave;
mod nuclear;

use wasm_bindgen::prelude::*;
use serde::Deserialize;

// ─── Struct d'entrée commune ──────────────────────────────────────

#[derive(Deserialize)]
struct SimInput {
    components: Vec<geo::raytracer::Component>,
    #[serde(default)]
    options: geo::raytracer::TraceOptions,
}

// ─── Simulation géométrique principale ───────────────────────────

#[wasm_bindgen]
pub fn run_simulation(input_json: &str) -> String {
    let input: SimInput = match serde_json::from_str(input_json) {
        Ok(v)  => v,
        Err(e) => return error::LuxError::new("PARSE_ERROR",
            &format!("JSON invalide : {}", e)).to_json(),
    };
    let result = geo::raytracer::trace(&input.components, &input.options);
    serde_json::to_string(&result).unwrap_or_else(|e|
        error::LuxError::new("SERIALIZE_ERROR", &e.to_string()).to_json()
    )
}

// ─── Interférences de Young ───────────────────────────────────────

#[wasm_bindgen]
pub fn compute_young(params_json: &str) -> String {
    match serde_json::from_str::<wave::interference::YoungParams>(params_json) {
        Ok(p)  => serde_json::to_string(&wave::interference::compute_young(&p))
                    .unwrap_or_else(|e| error::LuxError::new("SER",
                        &e.to_string()).to_json()),
        Err(e) => error::LuxError::new("PARSE", &e.to_string()).to_json(),
    }
}

// ─── Réseau de diffraction ────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_grating(params_json: &str) -> String {
    match serde_json::from_str::<wave::diffraction::GratingParams>(params_json) {
        Ok(p)  => serde_json::to_string(
                    &wave::diffraction::compute_grating(&p))
                    .unwrap_or_else(|e| error::LuxError::new("SER",
                        &e.to_string()).to_json()),
        Err(e) => error::LuxError::new("PARSE", &e.to_string()).to_json(),
    }
}

// ─── Décroissance radioactive ─────────────────────────────────────

#[wasm_bindgen]
pub fn compute_decay(params_json: &str) -> String {
    match serde_json::from_str::<nuclear::decay::DecayParams>(params_json) {
        Ok(p)  => serde_json::to_string(&nuclear::decay::compute_decay(&p))
                    .unwrap_or_else(|e| error::LuxError::new("SER",
                        &e.to_string()).to_json()),
        Err(e) => error::LuxError::new("PARSE", &e.to_string()).to_json(),
    }
}

// ─── Atténuation gamma ────────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_attenuation(params_json: &str) -> String {
    match serde_json::from_str::<nuclear::attenuation::AttenuationParams>(params_json) {
        Ok(p)  => serde_json::to_string(
                    &nuclear::attenuation::compute_attenuation(&p))
                    .unwrap_or_else(|e| error::LuxError::new("SER",
                        &e.to_string()).to_json()),
        Err(e) => error::LuxError::new("PARSE", &e.to_string()).to_json(),
    }
}

// ─── Diffusion Compton ────────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_compton(energy_kev: f64, steps: usize) -> String {
    serde_json::to_string(&nuclear::compton::compute_compton(energy_kev, steps))
        .unwrap_or_else(|e| error::LuxError::new("SER", &e.to_string()).to_json())
}

// ─── Débit de dose ────────────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_dose(params_json: &str) -> String {
    match serde_json::from_str::<nuclear::dosimetry::DoseParams>(params_json) {
        Ok(p)  => serde_json::to_string(&nuclear::dosimetry::compute_dose(&p))
                    .unwrap_or_else(|e| error::LuxError::new("SER",
                        &e.to_string()).to_json()),
        Err(e) => error::LuxError::new("PARSE", &e.to_string()).to_json(),
    }
}

// ─── Utilitaires ─────────────────────────────────────────────────

#[wasm_bindgen]
pub fn wavelength_to_color(wl: f64) -> String {
    let (r, g, b) = utils::wavelength::wavelength_to_rgb(wl);
    format!(r#"{{"r":{:.4},"g":{:.4},"b":{:.4}}}"#, r, g, b)
}

#[wasm_bindgen]
pub fn photon_energy_ev(wl_nm: f64) -> f64 {
    utils::wavelength::wavelength_to_ev(wl_nm)
}

#[wasm_bindgen]
pub fn engine_version() -> String {
    "0.2.0".to_string()
}