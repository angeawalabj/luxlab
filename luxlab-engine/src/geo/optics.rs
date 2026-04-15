use serde::{Deserialize, Serialize};

/// Indice de réfraction d'un matériau à une longueur d'onde donnée
/// Modèle de Cauchy simplifié : n(λ) = A + B/λ²
pub fn refractive_index(material: &str, wl_nm: f64) -> f64 {
    let wl_um = wl_nm / 1000.0; // convertir en µm
    match material {
        "BK7"          => cauchy(1.5168, 0.00420, wl_um),
        "Fused Silica" => cauchy(1.4580, 0.00354, wl_um),
        "Sapphire"     => cauchy(1.7550, 0.01080, wl_um),
        "ZnSe"         => cauchy(2.4360, 0.09000, wl_um),
        "CaF2"         => cauchy(1.4260, 0.00270, wl_um),
        _              => 1.5, // verre générique
    }
}

fn cauchy(a: f64, b: f64, wl_um: f64) -> f64 {
    a + b / (wl_um * wl_um)
}

/// Calcule l'angle réfracté via la loi de Snell-Descartes
/// Retourne None si réflexion totale
pub fn snell(n1: f64, n2: f64, theta_i: f64) -> Option<f64> {
    let sin_t = (n1 / n2) * theta_i.sin();
    if sin_t.abs() > 1.0 {
        None // réflexion totale interne
    } else {
        Some(sin_t.asin())
    }
}

/// Déviation d'un prisme (approximation paraxiale)
pub fn prism_deviation(n: f64, apex_angle_rad: f64) -> f64 {
    (n - 1.0) * apex_angle_rad
}

/// Déviation dépendant de λ (dispersion)
pub fn prism_deviation_chromatic(
    material: &str,
    apex_angle_rad: f64,
    wl_nm: f64,
) -> f64 {
    let n = refractive_index(material, wl_nm);
    prism_deviation(n, apex_angle_rad)
}