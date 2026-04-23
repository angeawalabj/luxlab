use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct DecayParams {
    pub a0:     f64,  // activité initiale (normalisée)
    pub t_half: f64,  // demi-vie (unité quelconque)
    pub steps:  usize,
}

#[derive(Serialize)]
pub struct DecayPoint {
    pub t: f64,
    pub a: f64,
}

pub fn compute_decay(p: &DecayParams) -> Vec<DecayPoint> {
    let lambda = std::f64::consts::LN_2 / p.t_half;
    let steps  = p.steps.max(50).min(500);

    (0..=steps).map(|i| {
        let t = (i as f64 / steps as f64) * 5.0 * p.t_half;
        let a = p.a0 * (-lambda * t).exp();
        DecayPoint { t, a }
    }).collect()
}