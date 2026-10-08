export const resources = [
  {
    id: "mern",
    name: "MERN Practice Lab",
    category: "Development",
    icon: "code",
    description: "Build full-stack projects in a guided sandbox.",
    eligibility: "Available to all learners",
  },
  {
    id: "react",
    name: "React Component Library",
    category: "Development",
    icon: "react",
    description: "Reusable components for your next project.",
    eligibility: "Basic React knowledge recommended",
  },
  {
    id: "mongo",
    name: "MongoDB Learning Cluster",
    category: "Data",
    icon: "database",
    description: "Practice queries with sample datasets.",
    eligibility: "Available to all learners",
  },
  {
    id: "design",
    name: "UI Design Kit",
    category: "Design",
    icon: "design",
    description: "Templates for accessible interfaces.",
    eligibility: "Available to all learners",
  },
  {
    id: "api",
    name: "API Testing Workspace",
    category: "Development",
    icon: "settings",
    description: "Test and document REST endpoints.",
    eligibility: "Basic HTTP knowledge recommended",
  },
  {
    id: "data",
    name: "Data Analysis Sandbox",
    category: "Data",
    icon: "chart",
    description: "Explore curated datasets.",
    eligibility: "Available to all learners",
  },
];
export const initialRequests = {
  react: {
    status: "approved",
    reason:
      "I would like to build accessible React components for my course project.",
    decisionReason: "Approved for your upcoming course project.",
  },
  mongo: {
    status: "pending",
    reason:
      "I want to practice aggregation queries using the sample learning datasets.",
  },
  design: {
    status: "rejected",
    reason:
      "I would like to explore interface design templates for my next project.",
    decisionReason:
      "Please describe the specific project you will use the kit for.",
  },
  api: {
    status: "cancelled",
    reason: "I planned to test a REST API but my project timeline has changed.",
  },
};
