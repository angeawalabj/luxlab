use serde::Serialize;
use super::atomic::gaussian;

#[derive(Serialize, Clone)]
pub struct FraunhoferLine {
    pub wl_nm:   f64,
    pub element: String,
    pub name:    String,
    pub depth:   f64,
}

pub fn get_fraunhofer_lines() -> Vec<FraunhoferLine> {
    vec![
        FraunhoferLine { wl_nm:393.4, element:"Ca²⁺".into(), name:"K".into(), depth:0.4 },
        FraunhoferLine { wl_nm:396.8, element:"Ca²⁺".into(), name:"H".into(), depth:0.35},
        FraunhoferLine { wl_nm:430.8, element:"Fe".into(),   name:"G".into(), depth:0.2 },
        FraunhoferLine { wl_nm:486.1, element:"Hβ".into(),   name:"F".into(), depth:0.3 },
        FraunhoferLine { wl_nm:516.7, element:"Mg".into(),   name:"b".into(), depth:0.15},
        FraunhoferLine { wl_nm:527.0, element:"Fe".into(),   name:"E₂".into(),depth:0.12},
        FraunhoferLine { wl_nm:589.0, element:"Na".into(),   name:"D₂".into(),depth:0.35},
        FraunhoferLine { wl_nm:589.6, element:"Na".into(),   name:"D₁".into(),depth:0.33},
        FraunhoferLine { wl_nm:656.3, element:"Hα".into(),   name:"C".into(), depth:0.4 },
        FraunhoferLine { wl_nm:686.7, element:"O₂".into(),   name:"B".into(), depth:0.25},
        FraunhoferLine { wl_nm:759.4, element:"O₂".into(),   name:"A".into(), depth:0.3 },
    ]
}

/// Spectre solaire avec raies de Fraunhofer
/// Corps noir 5778K avec absorption
pub fn compute_solar_spectrum(steps: usize) -> Vec<(f64, f64)> {
    let lines = get_fraunhofer_lines();
    let steps = steps.max(100).min(1600);

    (0..=steps).map(|i| {
        let wl   = 380.0 + (i as f64 / steps as f64) * 400.0;
        let x    = wl / 580.0;
        let exp  = (2.898e6 / (5778.0 * wl)).exp() - 1.0;
        let bb   = if exp.abs() < 1e-10 { 0.0 }
                   else { x.powf(-5.0) / exp };
        let mut i_out = (bb / 2e-4_f64).min(1.0);

        for line in &lines {
            let abs = gaussian(line.wl_nm, line.depth, wl, 1.2);
            i_out   = (i_out - abs).max(0.0);
        }

        (wl, i_out)
    }).collect()
}