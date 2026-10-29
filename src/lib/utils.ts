import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const initials = (name: string): string =>
  name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
