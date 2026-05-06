"use client";

import { Calendar, Clock, Code, FileText, User } from "lucide-react";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "Fucking boredom is real.",
    date: "Boredom",
    content:
      "You open your phone because you want something to happen — but nothing does. raW gives you live anonymous rooms where you can talk, answer, react, and meet people now.",
    category: "Boredom",
    icon: Calendar,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "People everywhere. Still lonely.",
    date: "Loneliness",
    content:
      "Followers, contacts, group chats — and still no real connection. raW helps you find people who actually match your thoughts, energy, and interests.",
    category: "Loneliness",
    icon: FileText,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "No Mask. Say it.",
    date: "Judgment",
    content:
      "Some things are easier to say when your name is not attached. raW lets you be honest without turning your real identity into the price of speaking.",
    category: "Judgment",
    icon: Code,
    relatedIds: [2, 4],
    status: "in-progress" as const,
    energy: 60,
  },
  {
    id: 4,
    title: "Tired of performing? Same.",
    date: "Fake Social",
    content:
      "Most apps push people to look perfect, interesting, or successful. raW is built for what people really think, feel, and want to say.",
    category: "Fake Social",
    icon: User,
    relatedIds: [3, 5],
    status: "pending" as const,
    energy: 30,
  },
  {
    id: 5,
    title: "Not sure where you fit?",
    date: "Lost",
    content:
      "Sometimes you don’t know what you need or where you belong. raW uses questions, conversations, and communities to help you understand yourself better.",
    category: "Lost",
    icon: Clock,
    relatedIds: [4],
    status: "pending" as const,
    energy: 10,
  },
];

export function RadialOrbitalTimelineDemo() {
  return <RadialOrbitalTimeline timelineData={timelineData} />;
}
