---
title: "Asymptotically Optimal Depth Fermionic Permutation on 2D Grid Quantum Architecture without Ancillas"
authors: ["Dantong Li", "Shifan Xu", "Yongshan Ding"]
year: 2026
status: "Preprint"
venue: "arXiv"
publicationUrl: "https://arxiv.org/abs/2605.26041"
summary: "Route fermionic modes on a 2D grid in optimal O(sqrt(N)) depth without ancilla qubits."
selected: true
citationLabel: "arXiv:2605.26041 (2026) · Preprint"
codeUrl: "https://github.com/dtlics/fast-fermionic-permutation"
instrument: "route"
bibtex: |
  @misc{fermionic-2026,
    title = {{Asymptotically Optimal Depth Fermionic Permutation on 2D Grid Quantum Architecture without Ancillas}},
    author = {Dantong Li and Shifan Xu and Yongshan Ding},
    year = {2026},
    eprint = {2605.26041},
    archivePrefix = {arXiv},
    primaryClass = {quant-ph},
    url = {https://arxiv.org/abs/2605.26041}
  }
---

The qubits store fermionic modes. Each mode can be empty or occupied. To run a circuit, we may need to move these modes to new qubits. A square grid permits gates only between neighbours, so the order of these moves matters.

The method runs local gates in parallel. For N qubits, it achieves optimal depth scaling of O(√N) without extra qubits. It preserves the phase signs required for fermions, as well as the final destinations. Getting only the destinations right is not enough.

Try the transpose on the 4 × 4 grid. Mode 1 moves from row 1, column 2 to row 2, column 1. Follow the mode label through the route. During the Γ steps, a stored bit can represent group parity: whether a group has an odd or even number of occupied modes. It does not always represent one mode’s occupation.

The tool uses the fixed 4 × 4 public compiler. It is one example of the construction. The O(√N) result describes how depth scales as the grid grows. See the [preprint](https://arxiv.org/abs/2605.26041) for the construction and proof.
