interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'Who is TailorFit for?',
    answer:
      'TailorFit is designed for tailors, dressmakers and studio assistants who manage client measurements and garment orders.',
  },
  {
    question: 'Does the mannequin take measurements automatically?',
    answer:
      "No. You take measurements with your tape measure as usual, then record them on the mannequin's measurement points or in the List view to keep them organized.",
  },
  {
    question: "Can I reuse a client's measurements?",
    answer:
      'Yes. When a client returns for a new garment, you can open their record in Clients and reuse any saved fitting as the starting baseline for the new order.',
  },
  {
    question: 'Where are my records stored?',
    answer:
      'All client details, measurements, reference photos, and orders are stored securely directly in your browser workspace with resilient offline availability.',
  },
  {
    question: 'Can I back up my work?',
    answer:
      'Yes. In Studio Settings, you can create a full JSON backup of your studio records and restore it anytime to prevent data loss or move between devices.',
  },
];
