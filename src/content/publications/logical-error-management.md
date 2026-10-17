---
title: "Co-Designing Error Mitigation and Error Detection for Logical Qubits"
authors: ["Rohan S. Kumar", "Takahiro Tsunoda", "Sophia H. Xue", "Dantong Li", "Robert J. Schoelkopf", "Yongshan Ding"]
year: 2026
status: "Preprint"
venue: "arXiv"
publicationUrl: "https://arxiv.org/abs/2604.19871"
summary: "Choose detection intervals and characterize residual noise to combine error detection with probabilistic error cancellation."
selected: true
citationLabel: "arXiv:2604.19871 (2026) · Preprint"
bibtex: |
  @misc{logical-2026,
    title = {{Co-Designing Error Mitigation and Error Detection for Logical Qubits}},
    author = {Rohan S. Kumar and Takahiro Tsunoda and Sophia H. Xue and Dantong Li and Robert J. Schoelkopf and Yongshan Ding},
    year = {2026},
    eprint = {2604.19871},
    archivePrefix = {arXiv},
    primaryClass = {quant-ph},
    url = {https://arxiv.org/abs/2604.19871}
  }
---

Error detection rejects a run when a check fails. Error mitigation reduces error in an estimate, but can increase its sampling uncertainty. A useful comparison must include both accuracy and uncertainty at the same number of attempted runs.

The paper designs the two steps together. It chooses when to check for errors, then models the noise left in the accepted runs. Probabilistic error cancellation uses that model to correct the estimate.

For example, Table II reports a simulation of the quantum approximate optimization algorithm (QAOA). At depth 8, it uses 100,000 attempted runs. Cancellation alone gives an absolute endpoint error of 0.00021 and a standard error of 0.0055. The combined method gives 0.00009 and 0.0013. The endpoint error is the distance from the ideal value. The standard error describes sampling uncertainty. A small endpoint error alone does not show how uncertain the estimate is.

The tool compares these reported simulation endpoints. They are finite-shot results, not forecasts for a different run count. See [Table II and the preprint](https://arxiv.org/abs/2604.19871) for the noise model, detection schedule and benchmark conditions.
