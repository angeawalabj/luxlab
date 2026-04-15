mod error;
mod utils;
mod geo;

use wasm_bindgen::prelude::*;
use serde::Deserialize;

#[derive(Deserialize)]
struct SimInput {
    components: Vec<geo::raytracer::Component>,
    #[serde(default)]
    options: geo::raytracer::TraceOptions,
}

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
    "0.1.0".to_string()
}