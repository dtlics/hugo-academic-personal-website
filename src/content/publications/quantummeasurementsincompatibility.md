---
title: "Measuring incompatibility and clustering quantum observables with a quantum switch"
authors: ["Ning Gao", "Dantong Li", "Anchit Mishra", "Junchen Yan", "Kyrylo Simonov", "Giulio Chiribella"]
year: 2023
status: "Published"
venue: "Physical Review Letters"
publicationUrl: "https://doi.org/10.1103/PhysRevLett.130.170201"
summary: "Measure incompatibility with a quantum switch and use the measure to group quantum observables."
selected: true
citationLabel: "Physical Review Letters 130, 170201 (2023)"
codeUrl: "https://github.com/dtlics/quantum_incompatibility/blob/main/Quantum_Incompatibility_Paper_with_Code.ipynb"
instrument: "measurement"
bibtex: |
  @article{prl-2023,
    title = {{Measuring incompatibility and clustering quantum observables with a quantum switch}},
    author = {Ning Gao and Dantong Li and Anchit Mishra and Junchen Yan and Kyrylo Simonov and Giulio Chiribella},
    year = {2023},
    journal = {Physical Review Letters},
    volume = {130},
    number = {17},
    pages = {170201},
    doi = {10.1103/PhysRevLett.130.170201},
    url = {https://doi.org/10.1103/PhysRevLett.130.170201}
  }
---

One quantum measurement can disturb the states associated with another. We need a way to compare this disturbance, including when the measurements are not fully known.

The paper defines mutual eigenspace disturbance, or MED. It then shows how a quantum switch can measure this quantity. The switch uses quantum control over the order of two measurements. The paper also uses MED to group measurements by their compatibility.

Try two axes in the one-qubit tool. Matching axes give MED 0. Axes 45° apart give MED 0.5. Moving the axes changes how much the measurement bases disturb each other. MED is a measure of disturbance, not the probability of an event.

The tool uses known axes in a noiseless one-qubit example. See the [PRL paper](https://doi.org/10.1103/PhysRevLett.130.170201) for the quantum-switch protocol for unknown measurements, the clustering method and the noise analysis.
