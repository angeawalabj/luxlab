use serde::{Deserialize, Serialize};

/// Longueur de cohérence d'une source
/// lc = λ² / Δλ
pub fn coherence_length(lambda_nm: f64, delta_lambda_nm: f64) -> f64 {
    if delta_lambda_nm < 1e-12 { return f64::INFINITY; }
    lambda_nm * lambda_nm / delta_lambda_nm   // en nm
}

/// Degré de cohérence temporelle (fonction de Michelson)
/// γ(Δl) = sinc(π Δl / lc)
pub fn temporal_coherence(path_diff_nm: f64, coherence_len_nm: f64) -> f64 {
    if coherence_len_nm < 1e-12 { return 0.0; }
    let x = std::f64::consts::PI * path_diff_nm / coherence_len_nm;
    if x.abs() < 1e-12 { 1.0 } else { x.sin() / x }
}

#[derive(Deserialize)]
pub struct MichelsonParams {
    pub wavelength_nm:    f64,
    pub delta_lambda_nm:  f64,  // largeur spectrale
    pub max_path_diff_nm: f64,
    pub steps:            usize,
}

#[derive(Serialize)]
pub struct MichelsonPoint {
    pub path_diff: f64,
    pub intensity: f64,
    pub coherence: f64,
}

pub fn compute_michelson(p: &MichelsonParams) -> Vec<MichelsonPoint> {
    let lc    = coherence_length(p.wavelength_nm, p.delta_lambda_nm);
    let k     = 2.0 * std::f64::consts::PI / p.wavelength_nm;
    let steps = p.steps.max(50).min(1000);

    (0..=steps).map(|i| {
        let dl  = (i as f64 / steps as f64) * p.max_path_diff_nm;
        let coh = temporal_coherence(dl, lc);
        let int = 0.5 * (1.0 + coh * (k * dl).cos());
        MichelsonPoint { path_diff:dl, intensity:int, coherence:coh }
    }).collect()
}