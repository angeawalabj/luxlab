mod error;
mod utils;
mod geo;
mod wave;
mod nuclear;
mod quantum;
mod spectro;
mod em;

use wasm_bindgen::prelude::*;
use serde::Deserialize;

// ─── Géométrique ─────────────────────────────────────────────────

#[derive(Deserialize)]
struct SimInput {
    components: Vec<geo::raytracer::Component>,
    #[serde(default)]
    options:    geo::raytracer::TraceOptions,
}

#[wasm_bindgen]
pub fn run_simulation(input_json: &str) -> String {
    match serde_json::from_str::<SimInput>(input_json) {
        Ok(p)  => serde_json::to_string(
                    &geo::raytracer::trace(&p.components, &p.options))
                    .unwrap_or_else(|e| err("SER", &e.to_string())),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

// ─── Ondulatoire ─────────────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_young(params_json: &str) -> String {
    match serde_json::from_str::<wave::interference::YoungParams>(params_json) {
        Ok(p)  => ok(&wave::interference::compute_young(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_grating(params_json: &str) -> String {
    match serde_json::from_str::<wave::diffraction::GratingParams>(params_json) {
        Ok(p)  => ok(&wave::diffraction::compute_grating(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_malus(params_json: &str) -> String {
    match serde_json::from_str::<wave::polarization::MalusParams>(params_json) {
        Ok(p)  => ok(&wave::polarization::compute_malus(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_polarization_train(params_json: &str) -> String {
    match serde_json::from_str::<wave::polarization::PolarizationTrainParams>(params_json) {
        Ok(p)  => ok(&wave::polarization::compute_polarization_train(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_michelson(params_json: &str) -> String {
    match serde_json::from_str::<wave::coherence::MichelsonParams>(params_json) {
        Ok(p)  => ok(&wave::coherence::compute_michelson(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

// ─── Nucléaire ───────────────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_decay(params_json: &str) -> String {
    match serde_json::from_str::<nuclear::decay::DecayParams>(params_json) {
        Ok(p)  => ok(&nuclear::decay::compute_decay(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_attenuation(params_json: &str) -> String {
    match serde_json::from_str::<nuclear::attenuation::AttenuationParams>(params_json) {
        Ok(p)  => ok(&nuclear::attenuation::compute_attenuation(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_compton(energy_kev: f64, steps: usize) -> String {
    ok(&nuclear::compton::compute_compton(energy_kev, steps))
}

#[wasm_bindgen]
pub fn compute_dose(params_json: &str) -> String {
    match serde_json::from_str::<nuclear::dosimetry::DoseParams>(params_json) {
        Ok(p)  => ok(&nuclear::dosimetry::compute_dose(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

// ─── Quantique ───────────────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_photoelectric(params_json: &str) -> String {
    match serde_json::from_str::<quantum::photoelectric::PhotoelectricParams>(params_json) {
        Ok(p)  => ok(&quantum::photoelectric::compute_photoelectric(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_schrodinger(params_json: &str) -> String {
    match serde_json::from_str::<quantum::schrodinger::SchrodingerParams>(params_json) {
        Ok(p)  => ok(&quantum::schrodinger::compute_particle_in_box(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_bell(params_json: &str) -> String {
    match serde_json::from_str::<quantum::bell::BellParams>(params_json) {
        Ok(p)  => ok(&quantum::bell::compute_bell(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

// ─── Spectroscopie ────────────────────────────────────────────────

#[wasm_bindgen]
pub fn compute_atomic_spectrum(params_json: &str) -> String {
    match serde_json::from_str::<spectro::atomic::SpectrumParams>(params_json) {
        Ok(p)  => ok(&spectro::atomic::compute_spectrum(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn compute_solar_spectrum(steps: usize) -> String {
    ok(&spectro::fraunhofer::compute_solar_spectrum(steps))
}

#[wasm_bindgen]
pub fn get_fraunhofer_lines() -> String {
    ok(&spectro::fraunhofer::get_fraunhofer_lines())
}

#[wasm_bindgen]
pub fn identify_element(params_json: &str) -> String {
    match serde_json::from_str::<spectro::identification::IdentificationParams>(params_json) {
        Ok(p)  => ok(&spectro::identification::identify_element(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn get_atomic_lines(element: &str) -> String {
    ok(&spectro::atomic::get_lines(element))
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
pub fn run_fdtd(params_json: &str) -> String {
    match serde_json::from_str::<em::fdtd::FDTDParams>(params_json) {
        Ok(p)  => ok(&em::fdtd::run_fdtd(&p)),
        Err(e) => err("PARSE", &e.to_string()),
    }
}

#[wasm_bindgen]
pub fn engine_version() -> String { "0.3.0".to_string() }

// ─── Helpers internes ─────────────────────────────────────────────

fn ok<T: serde::Serialize>(v: &T) -> String {
    serde_json::to_string(v)
        .unwrap_or_else(|e| err("SER", &e.to_string()))
}

fn err(code: &str, msg: &str) -> String {
    error::LuxError::new(code, msg).to_json()
}