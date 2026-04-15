/// Convertit une longueur d'onde en nm vers RGB (0.0–1.0)
pub fn wavelength_to_rgb(wl: f64) -> (f64, f64, f64) {
    let (r, g, b) = if wl < 380.0 {
        (0.5, 0.0, 1.0)
    } else if wl < 440.0 {
        let t = (440.0 - wl) / 60.0;
        (t, 0.0, 1.0)
    } else if wl < 490.0 {
        let t = (wl - 440.0) / 50.0;
        (0.0, t, 1.0)
    } else if wl < 510.0 {
        let t = (510.0 - wl) / 20.0;
        (0.0, 1.0, t)
    } else if wl < 580.0 {
        let t = (wl - 510.0) / 70.0;
        (t, 1.0, 0.0)
    } else if wl < 645.0 {
        let t = (645.0 - wl) / 65.0;
        (1.0, t, 0.0)
    } else if wl <= 780.0 {
        let t = (780.0 - wl) / 135.0;
        (1.0, 0.0, 0.0 + t * 0.0)
        // rouge pur qui s'assombrit
    } else {
        (0.6, 0.0, 0.0)
    };

    // Gamma correction 0.8
    let gamma = 0.8_f64;
    (
        r.powf(gamma),
        g.powf(gamma),
        b.powf(gamma),
    )
}

/// Énergie d'un photon en eV depuis λ en nm
pub fn wavelength_to_ev(wl_nm: f64) -> f64 {
    1240.0 / wl_nm
}

/// Fréquence en Hz depuis λ en nm
pub fn wavelength_to_hz(wl_nm: f64) -> f64 {
    crate::utils::constants::SPEED_OF_LIGHT / (wl_nm * 1e-9)
}