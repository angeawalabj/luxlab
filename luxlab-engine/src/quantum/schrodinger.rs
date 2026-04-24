use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
pub struct SchrodingerParams {
    pub n:     u32,   // niveau quantique
    pub l:     f64,   // longueur de la boîte (unités arbitraires)
    pub steps: usize,
}

#[derive(Serialize)]
pub struct WavefunctionPoint {
    pub x:    f64,
    pub psi:  f64,   // fonction d'onde
    pub prob: f64,   // densité de probabilité |ψ|²
}

#[derive(Serialize)]
pub struct SchrodingerResult {
    pub points:       Vec<WavefunctionPoint>,
    pub energy:       f64,   // En unités de ℏ²π²/2mL²
    pub level:        u32,
    pub nodes:        u32,   // nombre de nœuds
    pub expectation_x:f64,   // valeur moyenne de x
    pub uncertainty_x:f64,   // ΔX
}

pub fn compute_particle_in_box(p: &SchrodingerParams) -> SchrodingerResult {
    let n     = p.n.max(1).min(20) as f64;
    let l     = p.l.max(1.0);
    let steps = p.steps.max(100).min(2000);

    let norm  = (2.0 / l).sqrt();
    let k     = n * std::f64::consts::PI / l;

    let mut points      = Vec::with_capacity(steps + 1);
    let mut sum_x       = 0.0_f64;
    let mut sum_x2      = 0.0_f64;
    let     dx          = l / steps as f64;

    for i in 0..=steps {
        let x   = (i as f64 / steps as f64) * l;
        let psi = norm * (k * x).sin();
        let prob= psi * psi;
        sum_x  += x * prob * dx;
        sum_x2 += x * x * prob * dx;
        points.push(WavefunctionPoint { x, psi, prob });
    }

    let exp_x = sum_x;
    let var_x = (sum_x2 - sum_x * sum_x).max(0.0);

    SchrodingerResult {
        points,
        energy:        n * n,       // × ℏ²π²/2mL²
        level:         p.n,
        nodes:         p.n - 1,
        expectation_x: exp_x,
        uncertainty_x: var_x.sqrt(),
    }
}