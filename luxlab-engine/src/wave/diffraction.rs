use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct GratingParams {
    pub wavelength: f64,   // nm
    pub spacing_nm: f64,   // nm (pas du réseau)
    pub max_order:  i32,
}

#[derive(Serialize)]
pub struct GratingMaximum {
    pub order: i32,
    pub angle: f64,  // degrés
}

pub fn compute_grating(p: &GratingParams) -> Vec<GratingMaximum> {
    let mut maxima = Vec::new();
    for m in -p.max_order..=p.max_order {
        let sin_t = m as f64 * p.wavelength / p.spacing_nm;
        if sin_t.abs() <= 1.0 {
            maxima.push(GratingMaximum {
                order: m,
                angle: sin_t.asin() * 180.0 / std::f64::consts::PI,
            });
        }
    }
    maxima
}