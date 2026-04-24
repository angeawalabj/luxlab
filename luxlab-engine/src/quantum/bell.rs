use serde::{Deserialize, Serialize};

/// Corrélation quantique pour deux polariseurs intriqués
/// C(a,b) = -cos(2(a-b)) pour état de Bell |Φ⁺⟩
pub fn bell_correlation(angle1_deg: f64, angle2_deg: f64) -> f64 {
    let theta = (angle2_deg - angle1_deg) * std::f64::consts::PI / 180.0;
    -(2.0 * theta).cos()
}

/// Paramètre CHSH — violation des inégalités de Bell si |S| > 2
/// S = C(a,b) - C(a,b') + C(a',b) + C(a',b')
/// Angles optimaux : 0°, 22.5°, 45°, 67.5°
pub fn chsh_parameter() -> f64 {
    let c_ab   = bell_correlation(0.0,  22.5);
    let c_ab2  = bell_correlation(0.0,  67.5);
    let c_a2b  = bell_correlation(45.0, 22.5);
    let c_a2b2 = bell_correlation(45.0, 67.5);
    (c_ab - c_ab2 + c_a2b + c_a2b2).abs()
}

#[derive(Deserialize)]
pub struct BellParams {
    pub angles: Vec<(f64, f64)>,  // paires d'angles à mesurer
}

#[derive(Serialize)]
pub struct BellMeasurement {
    pub angle1:      f64,
    pub angle2:      f64,
    pub correlation: f64,
}

#[derive(Serialize)]
pub struct BellResult {
    pub measurements:    Vec<BellMeasurement>,
    pub chsh:            f64,
    pub violates_bell:   bool,
    pub max_quantum:     f64,   // 2√2 ≈ 2.828
    pub classical_limit: f64,   // 2.0
}

pub fn compute_bell(p: &BellParams) -> BellResult {
    let measurements = p.angles.iter().map(|(a1,a2)| BellMeasurement {
        angle1:      *a1,
        angle2:      *a2,
        correlation: bell_correlation(*a1, *a2),
    }).collect();

    let s = chsh_parameter();

    BellResult {
        measurements,
        chsh:            s,
        violates_bell:   s > 2.0,
        max_quantum:     2.0_f64.sqrt() * 2.0,
        classical_limit: 2.0,
    }
}