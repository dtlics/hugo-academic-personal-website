/* Exact transcription of rounded Table II endpoints. arXiv:2604.19871v1. */
window.LOGICAL_RESULTS = {
  "paper": "Co-Designing Error Mitigation and Error Detection for Logical Qubits",
  "arxiv": "2604.19871v1",
  "source_url": "https://arxiv.org/html/2604.19871v1#S6.T2",
  "pdf_page": 10,
  "source_tex": "work/logical-inspection/main.tex",
  "source_tex_lines": {
    "table": [
      449,
      478
    ],
    "metric_definition": 482,
    "endpoint_definition": 484
  },
  "attempted_shots": 100000,
  "code": "[[6,4,2]] Iceberg",
  "logical_qubits": 4,
  "noise_model": "Depolarizing; p1=1e-4, p2=1e-3",
  "qed_schedule": "Midpoint and terminal checks",
  "data_status": "Exact transcription of rounded values printed in Table II; not unrounded raw simulation data",
  "absolute_error_interpretation": "Finite-shot endpoint absolute deviation of the estimate from the ideal cost, according to the source's endpoint comparison and metric definition. Not independently established as the true ensemble bias.",
  "mse_interpretation": "Paper reports MSE=bias^2+SE^2 and calls bias the signed deviation of the estimate from the ideal observable value. Preserve the reported MSE column. Recomputing with rounded displayed values does not reproduce every reported MSE exactly.",
  "projection_status": "Do not use absolute_error as a true asymptotic bias floor for future-shot projection. No raw shot records, repeated-ensemble bias estimate, or independent true ensemble bias is provided in the inspected source.",
  "source_column_order": [
    "Abs. Err.",
    "SE",
    "MSE",
    "gamma",
    "Acc."
  ],
  "rows": [
    {
      "qaoa_depth": 4,
      "protocol": "Unmitigated",
      "absolute_error": 0.031,
      "standard_error": 0.00087,
      "reported_mse": 0.00096,
      "gamma": null,
      "acceptance_percent": null,
      "printed_values": [
        "3.10e-2",
        "8.7e-4",
        "9.6e-4",
        "---",
        "---"
      ]
    },
    {
      "qaoa_depth": 4,
      "protocol": "QED only",
      "absolute_error": 0.0029,
      "standard_error": 0.00028,
      "reported_mse": 8.2e-06,
      "gamma": null,
      "acceptance_percent": 93.1,
      "printed_values": [
        "2.9e-3",
        "2.8e-4",
        "8.2e-6",
        "---",
        "93.1%"
      ]
    },
    {
      "qaoa_depth": 4,
      "protocol": "PEC only",
      "absolute_error": 0.0064,
      "standard_error": 0.0038,
      "reported_mse": 5.5e-05,
      "gamma": 1.053,
      "acceptance_percent": null,
      "printed_values": [
        "6.4e-3",
        "3.8e-3",
        "5.5e-5",
        "1.053",
        "---"
      ]
    },
    {
      "qaoa_depth": 4,
      "protocol": "PEC+QED",
      "absolute_error": 0.0006,
      "standard_error": 0.0012,
      "reported_mse": 1.7e-06,
      "gamma": 1.005,
      "acceptance_percent": 93.9,
      "printed_values": [
        "6.0e-4",
        "1.2e-3",
        "1.7e-6",
        "1.005",
        "93.9%"
      ]
    },
    {
      "qaoa_depth": 6,
      "protocol": "Unmitigated",
      "absolute_error": 0.0469,
      "standard_error": 0.0011,
      "reported_mse": 0.0022,
      "gamma": null,
      "acceptance_percent": null,
      "printed_values": [
        "4.69e-2",
        "1.1e-3",
        "2.2e-3",
        "---",
        "---"
      ]
    },
    {
      "qaoa_depth": 6,
      "protocol": "QED only",
      "absolute_error": 0.003,
      "standard_error": 0.00029,
      "reported_mse": 9.1e-06,
      "gamma": null,
      "acceptance_percent": 92.0,
      "printed_values": [
        "3.0e-3",
        "2.9e-4",
        "9.1e-6",
        "---",
        "92.0%"
      ]
    },
    {
      "qaoa_depth": 6,
      "protocol": "PEC only",
      "absolute_error": 0.0036,
      "standard_error": 0.0046,
      "reported_mse": 3.4e-05,
      "gamma": 1.08,
      "acceptance_percent": null,
      "printed_values": [
        "3.6e-3",
        "4.6e-3",
        "3.4e-5",
        "1.080",
        "---"
      ]
    },
    {
      "qaoa_depth": 6,
      "protocol": "PEC+QED",
      "absolute_error": 0.0017,
      "standard_error": 0.0012,
      "reported_mse": 4.3e-06,
      "gamma": 1.006,
      "acceptance_percent": 91.9,
      "printed_values": [
        "1.7e-3",
        "1.2e-3",
        "4.3e-6",
        "1.006",
        "91.9%"
      ]
    },
    {
      "qaoa_depth": 8,
      "protocol": "Unmitigated",
      "absolute_error": 0.0499,
      "standard_error": 0.0011,
      "reported_mse": 0.0025,
      "gamma": null,
      "acceptance_percent": null,
      "printed_values": [
        "4.99e-2",
        "1.1e-3",
        "2.5e-3",
        "---",
        "---"
      ]
    },
    {
      "qaoa_depth": 8,
      "protocol": "QED only",
      "absolute_error": 0.0026,
      "standard_error": 0.00027,
      "reported_mse": 6.9e-06,
      "gamma": null,
      "acceptance_percent": 90.2,
      "printed_values": [
        "2.6e-3",
        "2.7e-4",
        "6.9e-6",
        "---",
        "90.2%"
      ]
    },
    {
      "qaoa_depth": 8,
      "protocol": "PEC only",
      "absolute_error": 0.00021,
      "standard_error": 0.0055,
      "reported_mse": 3e-05,
      "gamma": 1.108,
      "acceptance_percent": null,
      "printed_values": [
        "2.1e-4",
        "5.5e-3",
        "3.0e-5",
        "1.108",
        "---"
      ]
    },
    {
      "qaoa_depth": 8,
      "protocol": "PEC+QED",
      "absolute_error": 9e-05,
      "standard_error": 0.0013,
      "reported_mse": 1.8e-06,
      "gamma": 1.006,
      "acceptance_percent": 90.2,
      "printed_values": [
        "9.0e-5",
        "1.3e-3",
        "1.8e-6",
        "1.006",
        "90.2%"
      ]
    }
  ]
};
