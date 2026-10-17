---
title: "Transformer-QEC: Quantum Error Correction Code Decoding with Transferable Transformers"
authors: ["Hanrui Wang", "Pengyu Liu", "Kevin Shao", "Dantong Li", "Jiaqi Gu", "David Z. Pan", "Yongshan Ding", "Song Han"]
year: 2023
status: "Published"
venue: "Fast ML for Science Workshop at ICCAD2023"
publicationUrl: "https://arxiv.org/abs/2311.16082"
summary: "Use a transformer decoder and transfer learning to decode quantum error-correction codes across code distances."
selected: false
citationLabel: "Fast ML for Science @ ICCAD2023 · arXiv:2311.16082"
bibtex: |
  @inproceedings{transformer-qec-2023,
    title = {{Transformer-QEC: Quantum Error Correction Code Decoding with Transferable Transformers}},
    author = {Hanrui Wang and Pengyu Liu and Kevin Shao and Dantong Li and Jiaqi Gu and David Z. Pan and Yongshan Ding and Song Han},
    year = {2023},
    booktitle = {Fast ML for Science Workshop at ICCAD2023},
    url = {https://arxiv.org/abs/2311.16082},
    note = {arXiv:2311.16082. Workshop paper, not an ICCAD main-conference paper.}
  }
---

Quantum error correction produces a pattern of check results, called a syndrome. A decoder uses this pattern to infer errors. As a code grows, the pattern grows too, and decoding becomes harder.

The transformer reads the full pattern and proposes local corrections. A conventional decoder then handles the remaining syndrome. The two stages are combined to infer the final logical error. Transfer learning lets a trained model serve as the starting point for another code distance, a measure of code protection.

For example, the paper starts from a model trained at code distance 5. It then adjusts that model for other distances with 10 training passes, compared with 100 passes when training from scratch. The model reuses what it learned, but still receives further training.

This example describes the paper’s training setup. It does not guarantee the same training saving for every code or noise model. See [Section 4.1 of the paper](https://arxiv.org/abs/2311.16082) for the transfer experiment, and Section 3 for the two-stage decoder.
