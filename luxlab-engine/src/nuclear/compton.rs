use serde::Serialize;

#[derive(Serialize)]
pub struct ComptonPoint {
    pub angle:  f64,   // degrés
    pub energy: f64,   // keV (photon diffusé)
    pub d_sigma:f64,   // section efficace différentielle (Klein-Nishina)
}

pub fn compute_compton(energy_kev: f64, steps: usize) -> Vec<ComptonPoint> {
    let m0c2  = 511.0_f64;  // keV
    let steps = steps.max(36).min(360);

    (0..=steps).map(|i| {
        let angle = i as f64 * 180.0 / steps as f64;
        let theta = angle * std::f64::consts::PI / 180.0;
        let cos_t = theta.cos();

        // Énergie du photon diffusé (formule de Compton)
        let e1 = energy_kev / (1.0 + (energy_kev / m0c2) * (1.0 - cos_t));

        // Section efficace Klein-Nishina (simplifiée)
        let ratio = e1 / energy_kev;
        let kn    = 0.5 * ratio * ratio
                  * (ratio + 1.0/ratio - theta.sin().powi(2));

        ComptonPoint { angle, energy: e1, d_sigma: kn }
    }).collect()
}