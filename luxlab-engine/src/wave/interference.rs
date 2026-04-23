use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct YoungParams {
    pub wavelength:      f64,  // nm
    pub slit_separation: f64,  // mm
    pub slit_width:      f64,  // mm
    pub screen_distance: f64,  // mm
    pub half_height:     f64,  // mm
    pub steps:           usize,
}

#[derive(Serialize)]
pub struct IntensityPoint {
    pub y: f64,
    pub i: f64,
}

#[derive(Serialize)]
pub struct YoungResult {
    pub profile:    Vec<IntensityPoint>,
    pub interfrange:f64,
    pub max_order:  Vec<f64>,
}

pub fn compute_young(p: &YoungParams) -> YoungResult {
    let lambda = p.wavelength  * 1e-6;  // nm → mm
    let d      = p.slit_separation;
    let a      = p.slit_width;
    let d_scr  = p.screen_distance;
    let steps  = p.steps.max(100).min(2000);

    let mut profile = Vec::with_capacity(steps + 1);

    for i in 0..=steps {
        let y    = -p.half_height + (i as f64 / steps as f64) * p.half_height * 2.0;
        let dist = (y * y + d_scr * d_scr).sqrt();
        let sin_t = y / dist;

        let beta  = if lambda > 1e-12 {
            std::f64::consts::PI * a * sin_t / lambda
        } else { 0.0 };

        let delta = if lambda > 1e-12 {
            std::f64::consts::PI * d * sin_t / lambda
        } else { 0.0 };

        let diff  = if beta.abs() < 1e-12 { 1.0 }
                    else { (beta.sin() / beta).powi(2) };
        let inter = delta.cos().powi(2);

        profile.push(IntensityPoint { y, i: diff * inter });
    }

    // Interfrange
    let interfrange = if d > 1e-12 {
        lambda * d_scr / d
    } else { 0.0 };

    // Maxima du réseau (pour les fentes de Young : d joue le rôle du pas)
    let mut max_order = Vec::new();
    for m in -5i32..=5i32 {
        let sin_t = m as f64 * lambda / d;
        if sin_t.abs() <= 1.0 {
            max_order.push(sin_t.asin() * 180.0 / std::f64::consts::PI);
        }
    }

    YoungResult { profile, interfrange, max_order }
}