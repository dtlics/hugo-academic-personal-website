---
title: "Local Optimization of Quantum Circuits"
authors: ["Jatin Arora", "Mingkuan Xu", "Sam Westrick", "Pengyu Liu", "Dantong Li", "Yongshan Ding", "Umut A. Acar"]
year: 2025
status: "Published"
venue: "2025 IEEE International Conference on Quantum Computing and Engineering (QCE)"
publicationUrl: "https://mingkuan.taichi.graphics/publication/2025-oac/"
summary: "Cut circuits into smaller parts, optimize each part, and join the results with local optimality guarantees."
selected: false
citationLabel: "IEEE QCE2025"
award: "Best Paper Award, first place in QSYS track"
bibtex: |
  @inproceedings{local-optimization-2025,
    title = {{Local Optimization of Quantum Circuits}},
    author = {Jatin Arora and Mingkuan Xu and Sam Westrick and Pengyu Liu and Dantong Li and Yongshan Ding and Umut A. Acar},
    year = {2025},
    booktitle = {2025 IEEE International Conference on Quantum Computing and Engineering (QCE)},
    url = {https://mingkuan.taichi.graphics/publication/2025-oac/},
    note = {Extended version: arXiv:2502.19526. Best Paper Award, first place in QSYS track.}
  }
---

Finding the best version of a large quantum circuit can be expensive. Smaller parts are easier to optimize. But a cut can hide a useful simplification between two neighbouring parts.

The method cuts the circuit, optimizes each part, then checks across the joins when needed. Its guarantees apply to the chosen optimization routine, cost rule and allowed subcircuit size. They do not imply the best circuit among all possible circuits.

For a small example, allow only X and H gates and read this sequence from left to right: `X → H | H → X`. The line marks a cut. Neither half can lose a gate on its own. Across the cut, the two H gates cancel. The two X gates then cancel too. Four gates become none.

This is a teaching example of why the joins matter, not a reported benchmark. See the [conference paper page](https://mingkuan.taichi.graphics/publication/2025-oac/) and [extended paper](https://arxiv.org/abs/2502.19526) for the algorithm, local optimality conditions and evaluation.
