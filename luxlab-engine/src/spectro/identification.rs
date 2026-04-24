use serde::{Deserialize, Serialize};
use super::atomic::get_lines;

#[derive(Deserialize)]
pub struct IdentificationParams {
    pub observed_wavelengths: Vec<f64>,  // nm
    pub tolerance_nm:         f64,
}

#[derive(Serialize)]
pub struct IdentificationResult {
    pub element: String,
    pub score:   f64,
    pub matched: Vec<f64>,  // raies qui correspondent
}

const ELEMENTS: &[&str] = &[
    "Hydrogène","Sodium","Mercure","Hélium","Néon","Calcium"
];

pub fn identify_element(p: &IdentificationParams) -> Vec<IdentificationResult> {
    let tol = p.tolerance_nm.max(0.1);
    let mut results = Vec::new();

    for element in ELEMENTS {
        let lines   = get_lines(element);
        let mut score   = 0.0_f64;
        let mut matched = Vec::new();

        for obs_wl in &p.observed_wavelengths {
            for line in &lines {
                if (obs_wl - line.wl_nm).abs() < tol {
                    score   += line.intensity;
                    matched.push(line.wl_nm);
                }
            }
        }

        if score > 0.0 {
            results.push(IdentificationResult {
                element: element.to_string(),
                score,
                matched,
            });
        }
    }

    results.sort_by(|a,b| b.score.partial_cmp(&a.score).unwrap());
    results
}