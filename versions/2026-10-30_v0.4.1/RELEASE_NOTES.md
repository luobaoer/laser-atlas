# Laser Atlas v0.4.1 · 2026-10-30

## Why this version exists

Solid-state 355 nm lasers cannot be designed from the passive 1064 nm cavity ABCD solution alone. End-pump shaping and gain-volume matching are part of the upstream system design and must be iterated with the cavity and the thermal lens. This version adds the missing pump stage without pretending that a two-lens Gaussian-equivalent calculation can predict the output power or actual thermal lens.

## Added to the professional solid-state curriculum

- `solid-02`: four new advanced sections covering LD X/Y axes, source M² and BPP, pump f₁/f₂ shaping, Nd:YVO₄ longitudinal absorption, conditional quantum-defect heat lower bound, and gain-mode spatial matching.
- `solid-03b`: explicit prerequisite about pump source and shaping before final cavity optimization.
- Preserves all old lesson identifiers, topic order, stored notes, and history snapshots.

## Integrated new pump module

Tool path: `/tools/resonator1064/` (anchor `#pump`).

- Independent pump optical path **equivalent input waist → f₁ → f₂ → gain crystal entrance**; each relay distance and focal length is editable. These lens elements **are not** resonator intracavity lenses.
- Independent X/Y input waist radii, M² parameters and equivalent second-moment propagation. Each axis propagates via `Σ' = M Σ Mᵀ`; the normalized second-moment emittance invariant is checked.
- Pump source wavelength and optical power, aggregate optical-path transmission, gain-crystal pump index, absorption coefficient and pump-to-resonator transverse offsets.
- Editable Nd:YVO₄ crystal thickness is **reused** from the resonator model; the pump remains separate from the 1064 nm cavity matrix.
- Single-pass Beer–Lambert absorption fraction and absolute pump power absorbed; quantum-defect heat budget **lower bound** only, not a calibrated heat model.
- Compare pump equivalent X/Y intensity radii and 1064 resonator T/S mode radii at crystal entrance, middle and exit and along 80 samples in the gain medium.
- Absorption-weighted squared Bhattacharyya intensity shape similarity, **not** pump utilization efficiency, laser slope efficiency, gain efficiency, threshold, or 355 nm output power.
- Separate dynamic charts: relay beam shaping and pump vs. 1064 nm mode sizes inside the gain crystal. Pump input error messages, JSON export/import and CSV of crystal cross sections.
- Mobile and desktop layouts; no external libraries.

## Physical boundaries

- The initial input plane is defined as a *measured or effective waist* of a preconditioned/fiber-delivered diode beam. It is **not** a model of the raw fast/slow axes of a bare edge-emitting chip or actual multimode ray intensity distribution. Collocated axis waist approximation applies.
- End-pump model assumes coaxial paraxial linear optics, thin lenses, ideal planar interfaces, approximate beam-moment M² propagation and Beer–Lambert absorption.
- Thermal lens remains manually supplied to the separate resonator stage; no one-to-one automatic link from pump power and overlap to f_th.
- The spatial BC² shape measure is a *mathematical shape comparison index*, not true laser mode gain capture; gain saturation and mode competition are not included.
- 1064/532/355 frequency conversion and optical-damage modelling remain outside this version.

## Verification

- Built-in `numericCheck()` of old resonator passes unchanged.
- Pump `numericCheck()` verifies: TEM00 free-space propagation, M²/emittance invariance through two lenses, 100% shape match for equal beams, misalignment and width mismatch reduction, absorption fraction, and unstable-cavity match suppression.
- Browser tests: laptop 1400 px and phone 390 px, JS error-free; pump lens focal length, pump M², cavity segment changes, invalid-input warning and JSON download tested; main `solid-02` and `solid-03b` course navigation checked. Pump beam curves must contain nonempty SVG line data.
- Previous V0.4.0 snapshot remains untouched in `versions/2026-10-30_v0.4.0/`.

### Sources

- https://www.rp-photonics.com/end_pumping.html
- https://www.rp-photonics.com/diode_pumped_lasers.html
- https://www.rp-photonics.com/resonator_design.html
- https://www.rp-photonics.com/spotlight_2007_04_01.html
- https://www.rp-photonics.com/thermal_lensing.html