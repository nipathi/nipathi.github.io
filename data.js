/* Single source of truth for the skills universe and the skills grid.
   Only skills backed by real work are listed. "Exploring" is marked as such. */
window.PORTFOLIO = {
  clusters: [
    {
      id: "ml", name: "Machine learning", color: "#7aa2ff",
      blurb: "Training, evaluating and comparing models on real datasets.",
      skills: ["Python", "scikit-learn", "XGBoost benchmarking", "ROC-AUC evaluation", "Class imbalance (SMOTE)"],
      seen: ["heart", "work"]
    },
    {
      id: "dl", name: "Deep learning", color: "#b58cff",
      blurb: "Convolutional and hybrid networks, built in TensorFlow and PyTorch.",
      skills: ["TensorFlow", "PyTorch", "Convolutional networks", "MobileNetV2", "Model compression"],
      seen: ["heart", "brinjal"]
    },
    {
      id: "cv", name: "Computer vision", color: "#4cd7c0",
      blurb: "Reading images: plant disease classes, and text in scanned documents.",
      skills: ["OpenCV", "Image classification", "Optical character recognition (OCR)", "Data preparation for images"],
      seen: ["brinjal", "work"]
    },
    {
      id: "nlp", name: "Speech and language", color: "#ff8fb1",
      blurb: "Voice assistants that understand a request and report the real result.",
      skills: ["Voice AI flows", "Speech recognition", "Intent understanding", "HuggingFace", "Test data design"],
      seen: ["work"]
    },
    {
      id: "edge", name: "Edge AI", color: "#8ee06a",
      blurb: "Models small enough to run on a few-dollar camera board.",
      skills: ["TensorFlow Lite", "INT8 quantisation", "ESP32-CAM", "LoRa radio links"],
      seen: ["brinjal"]
    },
    {
      id: "qml", name: "Quantum machine learning", color: "#6ee7f9",
      blurb: "Hybrid quantum and classical models, tested against strong baselines.",
      skills: ["PennyLane", "Variational circuits", "Angle encoding", "Parameter-shift gradients"],
      seen: ["heart"]
    },
    {
      id: "app", name: "Backend and data", color: "#ff9f6b",
      blurb: "Turning models and ideas into working applications.",
      skills: ["Flask", "SQL", "MongoDB", "Full-stack web", "Business analytics", "Cloud application development"],
      seen: ["heart", "store"]
    },
    {
      id: "exp", name: "Exploring", color: "#c9cbd6", dashed: true,
      blurb: "Early exploration. Not yet backed by shipped work, so marked clearly.",
      skills: ["LLM applications", "AI agents", "Generative AI", "Automation systems"],
      seen: []
    }
  ],
  projects: [
    {
      id: "heart", short: "Quantum heart model", name: "Hybrid quantum heart disease model", color: "#b58cff",
      line: "Quantum model vs four classical models. It did not win, and the paper explains why.",
      hubs: ["ml", "dl", "qml", "app"], href: "#case-heart"
    },
    {
      id: "brinjal", short: "Brinjal detector", name: "Brinjal disease detector on a camera chip", color: "#8ee06a",
      line: "7 classes, 14,751 images, 84% accuracy in a 0.67 MB model, built to run offline.",
      hubs: ["dl", "cv", "edge"], href: "#case-brinjal"
    },
    {
      id: "store", short: "Roofing store", name: "Roofing business e-commerce platform", color: "#ff9f6b",
      line: "Full-stack store with QR code payments and a real-time admin dashboard.",
      hubs: ["app"], href: "#case-store"
    },
    {
      id: "work", short: "AI at work", name: "Voice and language AI at work", color: "#ffb547",
      line: "Hands-free voice flows and document reading, with checks before anything is called done. Details are private.",
      hubs: ["nlp", "cv", "ml"], href: "#journey"
    }
  ]
};
