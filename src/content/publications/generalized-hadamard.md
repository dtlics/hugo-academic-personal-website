---
title: "Efficient Quantum Gradient and Higher-order Derivative Estimation via Generalized Hadamard Test"
authors: ["Dantong Li", "Dikshant Dulal", "Mykhailo Ohorodnikov", "Hanrui Wang", "Yongshan Ding"]
year: 2025
status: "Published"
venue: "2025 IEEE International Conference on Quantum Computing and Engineering (QCE)"
publicationUrl: "https://arxiv.org/abs/2408.05406"
summary: "Generalize Hadamard tests to estimate quantum gradients and higher-order derivatives."
selected: false
citationLabel: "IEEE QCE2025 · arXiv:2408.05406"
bibtex: |
  @inproceedings{generalized-hadamard-2025,
    title = {{Efficient Quantum Gradient and Higher-order Derivative Estimation via Generalized Hadamard Test}},
    author = {Dantong Li and Dikshant Dulal and Mykhailo Ohorodnikov and Hanrui Wang and Yongshan Ding},
    year = {2025},
    booktitle = {2025 IEEE International Conference on Quantum Computing and Engineering (QCE)},
    doi = {10.1109/QCE65121.2025.00024},
    url = {https://arxiv.org/abs/2408.05406}
  }
---

A quantum circuit can have adjustable angles. To improve its output, we need to know how the measured result changes with an angle. The gradient gives the slope. Higher derivatives describe how that slope changes.

The paper extends the Hadamard test to estimate these derivatives. It also shows how to choose a gradient method for each circuit parameter. The aim is to use a test that fits the circuit and the measurement, rather than one fixed method for every parameter.

For a teaching example, start a qubit in state 0. Rotate it about the y axis by angle θ in radians, then measure along z. The mean result is `f(θ) = cos θ`. Its slope is `−sin θ`, and its second derivative is `−cos θ`. These exact expressions show what the derivative tests aim to estimate.

This example explains the quantities; it is not a benchmark from the paper. The [paper](https://arxiv.org/abs/2408.05406) gives the test circuits, their assumptions and the measurement-cost comparisons.
